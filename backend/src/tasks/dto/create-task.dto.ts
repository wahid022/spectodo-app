import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsIn,
  IsOptional,
  IsISO8601,
  IsBoolean,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsIn(['Work', 'Personal', 'Health', 'Finance', 'Learning'])
  category!: string;

  @IsString()
  @IsIn(['Low', 'Medium', 'High', 'Urgent'])
  priority!: string;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @IsOptional()
  @IsISO8601()
  reminderTime?: string;

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;
}
