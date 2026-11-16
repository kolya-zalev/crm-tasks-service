import { TaskEntity } from './task.entity';
import { TaskDto } from '@crm/shared';

export const toTaskDto = (row: TaskEntity): TaskDto => ({
  id: row.id,
  leadId: row.leadId,
  title: row.title,
  description: row.description ?? null,
  status: row.status,
  priority: row.priority,
  dueDate: row.dueDate.toISOString(),
  createdAt: row.createdAt.toISOString(),
  completedAt: row.completedAt?.toISOString() ?? null,
});
