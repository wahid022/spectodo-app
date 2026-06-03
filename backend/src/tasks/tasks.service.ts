import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';
import { Task } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaskDto): Promise<Task> {
    const aggregate = await this.prisma.task.aggregate({
      _max: { sortOrder: true },
    });
    const nextOrder = (aggregate._max.sortOrder ?? -1) + 1;

    const reminderStatus =
      dto.reminderEnabled && dto.reminderTime ? 'pending' : 'none';

    return this.prisma.task.create({
      data: {
        title: dto.title.trim(),
        category: dto.category,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        sortOrder: nextOrder,
        reminderTime: dto.reminderTime ? new Date(dto.reminderTime) : null,
        reminderEnabled: dto.reminderEnabled ?? false,
        reminderStatus,
      },
    });
  }

  findAll(): Promise<Task[]> {
    return this.prisma.task.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const sideEffects: Record<string, unknown> = {};

    if (dto.completed === true) {
      sideEffects.reminderEnabled = false;
      sideEffects.reminderStatus = 'none';
      sideEffects.snoozeUntil = null;
    }

    if (dto.reminderEnabled === false) {
      sideEffects.reminderStatus = 'none';
      sideEffects.notificationTriggered = false;
      sideEffects.snoozeUntil = null;
    }

    if (dto.reminderStatus === 'snoozed') {
      sideEffects.snoozeUntil = new Date(Date.now() + 5 * 60 * 1000);
      sideEffects.notificationTriggered = false;
    }

    if (dto.reminderStatus === 'dismissed') {
      sideEffects.snoozeUntil = null;
    }

    try {
      return await this.prisma.task.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title.trim() }),
          ...(dto.category !== undefined && { category: dto.category }),
          ...(dto.priority !== undefined && { priority: dto.priority }),
          ...(dto.dueDate !== undefined && {
            dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          }),
          ...(dto.completed !== undefined && { completed: dto.completed }),
          ...(dto.reminderTime !== undefined && {
            reminderTime: dto.reminderTime ? new Date(dto.reminderTime) : null,
          }),
          ...(dto.reminderEnabled !== undefined && {
            reminderEnabled: dto.reminderEnabled,
          }),
          ...(dto.reminderStatus !== undefined && {
            reminderStatus: dto.reminderStatus,
          }),
          ...(dto.notificationTriggered !== undefined && {
            notificationTriggered: dto.notificationTriggered,
          }),
          ...sideEffects,
        },
      });
    } catch {
      throw new NotFoundException('Task not found');
    }
  }

  async reorder(dto: ReorderTasksDto): Promise<{ updated: number }> {
    await this.prisma.$transaction(
      dto.tasks.map((t) =>
        this.prisma.task.update({
          where: { id: t.id },
          data: { sortOrder: t.sortOrder },
        }),
      ),
    );
    return { updated: dto.tasks.length };
  }

  async remove(id: string): Promise<Task> {
    try {
      return await this.prisma.task.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Task not found');
    }
  }
}
