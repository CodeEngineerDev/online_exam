import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateExamDto,
  CreateQuestionDto,
  CreateStudentDto,
  SubmitExamDto,
} from './app.dto';
import { Exam, Question, Student, Submission } from './entities';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Student) private readonly students: Repository<Student>,
    @InjectRepository(Exam) private readonly exams: Repository<Exam>,
    @InjectRepository(Question) private readonly questions: Repository<Question>,
    @InjectRepository(Submission) private readonly submissions: Repository<Submission>,
  ) {}

  async getStats() {
    const [students, exams, questions, submissions] = await Promise.all([
      this.students.count(),
      this.exams.count(),
      this.questions.count(),
      this.submissions.count(),
    ]);
    return { students, exams, questions, submissions };
  }

  getStudents() {
    return this.students.find({
      select: { id: true, fullName: true, email: true, studentNumber: true, createdAt: true },
      order: { fullName: 'ASC' },
    });
  }

  async createStudent(dto: CreateStudentDto) {
    try {
      const student = await this.students.save(this.students.create({
        fullName: dto.full_name.trim(),
        email: dto.email.trim().toLowerCase(),
        studentNumber: dto.student_number.trim(),
      }));
      return { id: student.id, message: 'Student registered' };
    } catch (error) {
      if (this.isDuplicate(error)) {
        throw new ConflictException('Email or student number already exists');
      }
      throw error;
    }
  }

  async getExams() {
    const { entities, raw } = await this.exams
      .createQueryBuilder('exam')
      .leftJoin(Question, 'question', 'question.exam_id = exam.id')
      .addSelect('COUNT(question.id)', 'question_count')
      .groupBy('exam.id')
      .orderBy('exam.created_at', 'DESC')
      .getRawAndEntities();
    return entities.map((exam, index) => ({
      ...exam,
      question_count: Number(raw[index]?.question_count || 0),
    }));
  }

  async createExam(dto: CreateExamDto) {
    const startAt = new Date(dto.start_at);
    const endAt = new Date(dto.end_at);
    if (endAt <= startAt) {
      throw new UnprocessableEntityException('End time must be after start time');
    }
    const exam = await this.exams.save(this.exams.create({
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      durationMinutes: dto.duration_minutes,
      startAt,
      endAt,
    }));
    return { id: exam.id, message: 'Exam created' };
  }

  async getQuestions(examId: number) {
    return this.questions.find({
      where: { examId },
      select: {
        id: true,
        examId: true,
        questionText: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        marks: true,
      },
      order: { id: 'ASC' },
    });
  }

  async createQuestion(dto: CreateQuestionDto) {
    const exam = await this.exams.findOneBy({ id: dto.exam_id });
    if (!exam) throw new NotFoundException('Exam not found');
    const question = await this.questions.save(this.questions.create({
      examId: dto.exam_id,
      questionText: dto.question_text.trim(),
      optionA: dto.option_a.trim(),
      optionB: dto.option_b.trim(),
      optionC: dto.option_c.trim(),
      optionD: dto.option_d.trim(),
      correctOption: dto.correct_option,
      marks: dto.marks ?? 1,
    }));
    return { id: question.id, message: 'Question added' };
  }

  async getExamQuestions(examId: number) {
    return this.questions.find({
      where: { examId },
      select: {
        id: true,
        questionText: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        marks: true,
      },
      order: { id: 'ASC' },
    });
  }

  async submitExam(dto: SubmitExamDto) {
    const [exam, student] = await Promise.all([
      this.exams.findOneBy({ id: dto.exam_id }),
      this.students.findOneBy({ id: dto.student_id }),
    ]);
    if (!exam) throw new NotFoundException('Exam not found');
    if (!student) throw new NotFoundException('Student not found');

    const now = new Date();
    if (now < exam.startAt || now > exam.endAt) {
      throw new ForbiddenException('This exam is not currently open');
    }

    const questions = await this.questions.find({ where: { examId: exam.id } });
    if (!questions.length) {
      throw new UnprocessableEntityException('This exam has no questions');
    }

    const validIds = new Set(questions.map((question) => String(question.id)));
    for (const [questionId, answer] of Object.entries(dto.answers)) {
      if (!validIds.has(questionId) || !['A', 'B', 'C', 'D'].includes(answer)) {
        throw new UnprocessableEntityException('Answers contain an invalid question or option');
      }
    }

    let score = 0;
    let totalMarks = 0;
    for (const question of questions) {
      totalMarks += question.marks;
      if (dto.answers[String(question.id)] === question.correctOption) score += question.marks;
    }

    try {
      await this.submissions.save(this.submissions.create({
        studentId: student.id,
        examId: exam.id,
        answers: dto.answers,
        score,
        totalMarks,
        submittedAt: new Date(),
      }));
    } catch (error) {
      if (this.isDuplicate(error)) {
        throw new ConflictException('You have already submitted this exam');
      }
      throw error;
    }
    return { message: 'Exam submitted successfully', score, total_marks: totalMarks };
  }

  getResults() {
    return this.submissions
      .createQueryBuilder('submission')
      .innerJoin('submission.student', 'student')
      .innerJoin('submission.exam', 'exam')
      .select('submission.id', 'id')
      .addSelect('submission.score', 'score')
      .addSelect('submission.total_marks', 'total_marks')
      .addSelect('submission.submitted_at', 'submitted_at')
      .addSelect('student.full_name', 'full_name')
      .addSelect('student.student_number', 'student_number')
      .addSelect('exam.title', 'exam_title')
      .orderBy('submission.submitted_at', 'DESC')
      .getRawMany();
  }

  private isDuplicate(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY';
  }
}
