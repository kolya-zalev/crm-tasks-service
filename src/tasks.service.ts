import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateTaskInServicePayload,
  LeadDeletedEvent,
  LeadIdPayload,
  RemoveTaskPayload,
  TaskDto,
  UpdateTaskInServicePayload,
} from '@crm/shared';
import { Repository } from 'typeorm';
import { TaskEntity } from './task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { toTaskDto } from './tasks.mapper';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity) private readonly repo: Repository<TaskEntity>,
  ) {}

  async findAll(): Promise<TaskDto[]> {
    const tasks = await this.repo.find({
      order: { createdAt: 'DESC' },
    });
    return tasks.map(toTaskDto);
  }

  async findByLead({ leadId }: LeadIdPayload): Promise<TaskDto[]> {
    const tasks = await this.repo.find({
      where: { leadId },
      order: { createdAt: 'DESC' },
    });
    return tasks.map(toTaskDto);
  }

  async create({ leadId, data }: CreateTaskInServicePayload): Promise<TaskDto> {
    const task = await this.repo.save(
      this.repo.create({
        leadId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: new Date(data.dueDate),
        status: 'pending',
      }),
    );

    return toTaskDto(task);
  }

  async update({ taskId, data }: UpdateTaskInServicePayload): Promise<TaskDto> {
    const task = await this.repo.findOneBy({ id: taskId });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    const updated = await this.repo.save(
      this.repo.merge(task, {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        completedAt:
          data.completedAt === null
            ? null
            : data.completedAt
              ? new Date(data.completedAt)
              : undefined,
      }),
    );
    return toTaskDto(updated);
  }

  async remove({ taskId }: RemoveTaskPayload): Promise<TaskDto> {
    const task = await this.repo.findOneBy({
      id: taskId,
    });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    await this.repo.delete({ id: taskId });

    return toTaskDto(task);
  }

  async removeByLead({ leadId }: LeadDeletedEvent): Promise<void> {
    await this.repo.delete({ leadId });
  }
}
