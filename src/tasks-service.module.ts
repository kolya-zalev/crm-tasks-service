import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './data-source';
import { TaskEntity } from './task.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    TypeOrmModule.forFeature([TaskEntity]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksServiceModule {}
