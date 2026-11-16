# crm-tasks-service

Микросервис задач CRM: задачи по лидам (создание, изменение статуса, удаление,
список всех задач и задач лида).
Отвечает на вопрос «что и к какому сроку нужно сделать по лиду».

- транспорт: **RabbitMQ**, очередь **`tasks_queue`** (`@nestjs/microservices`), HTTP нет
- база: **`tasks_db`** (PostgreSQL, TypeORM)
- вызывается только из [crm-gateway](https://github.com/kolya-zalev/crm-gateway)
- контракты: [@crm/shared](https://github.com/kolya-zalev/crm-shared) (`tasksMessages`, `TasksContract`, `TasksEvents`)

Раньше задачи жили внутри leads-service, в одной базе с лидами. Теперь у сервиса
своя база, и о лидах он знает только `leadId`.

## Как связаны задачи и лиды

Лиды лежат в другой базе (`leads_db`), поэтому **внешнего ключа на лид нет**.
Целостность поддерживают gateway и события:

| Что | Кто отвечает |
|---|---|
| лид существует при создании задачи | gateway: сначала `leads.findOne`, если 404, задача не создаётся |
| имя лида для уведомлений | gateway запрашивает его у leads-service |
| задачи удалённого лида | событие **`lead.deleted`**: gateway отправляет его после удаления лида, сервис удаляет задачи |

```
создание:  gateway ──leads.findOne──▶ leads-service
           gateway ──tasks.create───▶ tasks_queue ──▶ tasks-service ──▶ tasks_db
удаление лида:
           gateway ──leads.remove───▶ leads-service
           gateway ──emit lead.deleted──▶ tasks_queue ──▶ tasks-service: удалить задачи лида
```

**Цена разделения.** Раньше задачи удалялись каскадом в той же транзакции.
Теперь это **итоговая согласованность**: если сервис выключен, задачи удалённого лида
ещё существуют, пока он не поднимется. Событие при этом не теряется: очередь durable,
сообщения persistent, оно дождётся сервиса в `tasks_queue`.

## Сообщения

| Тип | Паттерн | Payload | Ответ |
|---|---|---|---|
| запрос | `tasks.findAll` | `{}` | `TaskDto[]`, новые сверху |
| запрос | `tasks.findByLead` | `{ leadId }` | `TaskDto[]` |
| запрос | `tasks.create` | `{ leadId, data }` | созданное `TaskDto` (`status: pending`) |
| запрос | `tasks.update` | `{ taskId, data }` | обновлённое `TaskDto` |
| запрос | `tasks.remove` | `{ taskId }` | удалённое `TaskDto` (gateway берёт из него `leadId`) |
| событие | `lead.deleted` | `{ leadId }` | ответа нет: удаляются все задачи лида |

Ошибки (`NotFoundException`…) превращаются в RPC-ошибки с `statusCode`
через `HttpToRpcExceptionFilter`. Если сервис не запущен, gateway через 5 секунд
отвечает `503`. Ошибка в обработчике события пишется в лог.

## Данные

`Task`: `id` (uuid), `leadId` (индекс), `title`, `description`, `status` (`pending` / `completed`),
`priority` (`low` / `medium` / `high`), `dueDate`, `createdAt`, `completedAt` (все даты `timestamptz`).

Задачи перенесены из `leads_db` через
`pg_dump --data-only --table='"Task"'`: имена таблицы и колонок сохранены, поэтому
перенос прошёл одной командой.

## Переменные окружения

| Переменная | Пример |
|---|---|
| `TASKS_DATABASE_URL` | `postgresql://USER:PASSWORD@localhost:5432/tasks_db` |
| `RABBIT_URL` | `amqp://USER:PASSWORD@localhost:5672` |

## Локальный запуск

Нужны PostgreSQL и RabbitMQ: проще всего поднять их из
[crm-infra](https://github.com/kolya-zalev/crm-infra) (`docker compose up -d db rabbitmq`).

```bash
cp .env.example .env
npm install
npm run migration:run
npm run start:dev
```

Проверка: в RabbitMQ UI (http://localhost:15672) у очереди `tasks_queue` → Consumers: 1.

## Миграции

```bash
npm run migration:generate -- src/migrations/<Имя>   # по изменениям entity
npm run migration:run                                # применить
npm run migration:revert                             # откатить последнюю
```

`synchronize` выключен: схема меняется только миграциями.

## Docker

`Dockerfile` → `npm ci` → `nest build`.
`start.sh` → `typeorm migration:run -d dist/data-source.js` → `node dist/main`.

Запуск вместе с остальными: [crm-infra](https://github.com/kolya-zalev/crm-infra).
