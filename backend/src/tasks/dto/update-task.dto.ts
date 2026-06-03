import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsIn,
  IsOptional,
  IsBoolean,
  IsISO8601,
} from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Work', 'Personal', 'Health', 'Finance', 'Learning'])
  category?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Low', 'Medium', 'High', 'Urgent'])
  priority?: string;

  @IsOptional()
  @IsISO8601()
  dueDate?: string | null;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsISO8601()
  reminderTime?: string | null;

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['none', 'pending', 'snoozed', 'dismissed'])
  reminderStatus?: string;

  @IsOptional()
  @IsBoolean()
  notificationTriggered?: boolean;
}
