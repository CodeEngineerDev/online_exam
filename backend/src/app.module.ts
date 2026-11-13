import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Exam, Question, Student, Submission } from './entities';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      username: process.env.DB_USER || 'exam_user',
      password: process.env.DB_PASSWORD || 'exam_password',
      database: process.env.DB_NAME || 'online_exam',
      entities: [Student, Exam, Question, Submission],
      synchronize: false,
      retryAttempts: 20,
      retryDelay: 3000,
    }),
    TypeOrmModule.forFeature([Student, Exam, Question, Submission]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
