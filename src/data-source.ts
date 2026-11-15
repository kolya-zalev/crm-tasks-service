import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { TaskEntity } from './task.entity';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.TASKS_DATABASE_URL,
  entities: [TaskEntity],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
};

export default new DataSource(dataSourceOptions);
