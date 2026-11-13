import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('students')
@Unique('uq_students_email', ['email'])
@Unique('uq_students_number', ['studentNumber'])
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'full_name', length: 150 })
  fullName: string;

  @Column({ length: 150 })
  email: string;

  @Column({ name: 'student_number', length: 60 })
  studentNumber: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}

@Entity('exams')
export class Exam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 180 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes: number;

  @Column({ name: 'start_at', type: 'datetime' })
  startAt: Date;

  @Column({ name: 'end_at', type: 'datetime' })
  endAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}

@Entity('questions')
@Index('idx_questions_exam_id', ['examId'])
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'exam_id', type: 'int' })
  examId: number;

  @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  @Column({ name: 'option_a', length: 500 })
  optionA: string;

  @Column({ name: 'option_b', length: 500 })
  optionB: string;

  @Column({ name: 'option_c', length: 500 })
  optionC: string;

  @Column({ name: 'option_d', length: 500 })
  optionD: string;

  @Column({ name: 'correct_option', type: 'enum', enum: ['A', 'B', 'C', 'D'] })
  correctOption: string;

  @Column({ type: 'int', default: 1 })
  marks: number;
}

@Entity('submissions')
@Unique('one_submission_per_exam', ['studentId', 'examId'])
@Index('idx_submissions_submitted_at', ['submittedAt'])
export class Submission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'student_id', type: 'int' })
  studentId: number;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'exam_id', type: 'int' })
  examId: number;

  @ManyToOne(() => Exam)
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @Column({ name: 'answers_json', type: 'json' })
  answers: Record<string, string>;

  @Column({ type: 'int' })
  score: number;

  @Column({ name: 'total_marks', type: 'int' })
  totalMarks: number;

  @Column({ name: 'submitted_at', type: 'datetime' })
  submittedAt: Date;
}
