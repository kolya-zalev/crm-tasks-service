import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import {
  type LeadDeletedEvent,
  leadsEvents,
  tasksMessages,
  type LeadIdPayload,
  type RemoveTaskPayload,
  type TaskDto,
  type UpdateTaskPayload,
  CreateTaskInServicePayload,
  UpdateTaskInServicePayload,
} from '@crm/shared';
import { TasksService } from './tasks.service';

@Controller()
export class TasksController {
  private readonly logger = new Logger(TasksController.name);

  constructor(private readonly tasksService: TasksService) {}

  @MessagePattern(tasksMessages.tasksFindAll)
  findAll(): Promise<TaskDto[]> {
    return this.tasksService.findAll();
  }

  @MessagePattern(tasksMessages.tasksFindByLead)
  findByLead(@Payload() payload: LeadIdPayload): Promise<TaskDto[]> {
    return this.tasksService.findByLead(payload);
  }

  @MessagePattern(tasksMessages.tasksCreate)
  create(@Payload() payload: CreateTaskInServicePayload): Promise<TaskDto> {
    return this.tasksService.create(payload);
  }

  @MessagePattern(tasksMessages.tasksUpdate)
  update(@Payload() payload: UpdateTaskInServicePayload): Promise<TaskDto> {
    return this.tasksService.update(payload);
  }

  @MessagePattern(tasksMessages.tasksRemove)
  remove(@Payload() payload: RemoveTaskPayload): Promise<TaskDto> {
    return this.tasksService.remove(payload);
  }

  @EventPattern(leadsEvents.leadDeleted)
  async handleLeadDeleted(
    @Payload() { leadId }: LeadDeletedEvent,
  ): Promise<void> {
    try {
      await this.tasksService.removeByLead({ leadId });
    } catch (error) {
      this.logger.error(
        `Failed to remove tasks for deleted lead ${leadId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
