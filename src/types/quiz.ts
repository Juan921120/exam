// 测试相关类型定义
import type { Question, AnswerRecord } from './question';

export interface QuizSession {
  questions: Question[];
  currentIndex: number;
  answers: (string | null)[];
  startTime: number;
  endTime?: number;
}

export interface QuizResult {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  correctRate: number;
  timeSpent: number;
  answerRecords: AnswerRecord[];
}

export interface QuizHistory {
  id: string;
  date: string;
  mode: 'random' | 'sequential';
  result: QuizResult;
}

export type QuizMode = 'random' | 'sequential';