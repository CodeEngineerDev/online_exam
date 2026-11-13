import { Body, Controller, Get, Post, Query, ParseIntPipe } from '@nestjs/common';
import { AppService } from './app.service';
import {
  CreateExamDto,
  CreateQuestionDto,
  CreateStudentDto,
  SubmitExamDto,
} from './app.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('stats')
  stats() {
    return this.appService.getStats();
  }

  @Get('students')
  students() {
    return this.appService.getStudents();
  }

  @Post('students')
  createStudent(@Body() dto: CreateStudentDto) {
    return this.appService.createStudent(dto);
  }

  @Get('exams')
  exams() {
    return this.appService.getExams();
  }

  @Post('exams')
  createExam(@Body() dto: CreateExamDto) {
    return this.appService.createExam(dto);
  }

  @Get('questions')
  questions(@Query('exam_id', ParseIntPipe) examId: number) {
    return this.appService.getQuestions(examId);
  }

  @Post('questions')
  createQuestion(@Body() dto: CreateQuestionDto) {
    return this.appService.createQuestion(dto);
  }

  @Get('exam-questions')
  examQuestions(@Query('exam_id', ParseIntPipe) examId: number) {
    return this.appService.getExamQuestions(examId);
  }

  @Post('submit')
  submit(@Body() dto: SubmitExamDto) {
    return this.appService.submitExam(dto);
  }

  @Get('results')
  results() {
    return this.appService.getResults();
  }
}
