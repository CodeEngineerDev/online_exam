import {
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsDateString,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  full_name: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  student_number: string;
}

export class CreateExamDto {
  @IsString()
  @MinLength(1)
  @MaxLength(180)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  duration_minutes: number;

  @IsDateString()
  start_at: string;

  @IsDateString()
  end_at: string;
}

export class CreateQuestionDto {
  @IsInt()
  @Min(1)
  exam_id: number;

  @IsString()
  @MinLength(1)
  question_text: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  option_a: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  option_b: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  option_c: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  option_d: string;

  @IsIn(['A', 'B', 'C', 'D'])
  correct_option: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  marks?: number;
}

export class SubmitExamDto {
  @IsInt()
  @Min(1)
  student_id: number;

  @IsInt()
  @Min(1)
  exam_id: number;

  @IsObject()
  answers: Record<string, string>;
}
