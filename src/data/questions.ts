// 题库数据
import type { Question } from '../types/question';
import questionsJson from '../../questions.json';

// 导出完整题库数据
export const sampleQuestions: Question[] = questionsJson;

// 获取题库统计信息
export function getQuestionStats(questions: Question[]) {
  const tfCount = questions.filter(q => q.type === 'tf').length;
  const singleCount = questions.filter(q => q.type === 'single').length;
  const multiCount = questions.filter(q => q.type === 'multi').length;

  return {
    total: questions.length,
    tfCount,
    singleCount,
    multiCount
  };
}

// 随机抽取题目
export function getRandomQuestions(questions: Question[], count: number = 10): Question[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// 按顺序获取题目(从指定索引开始)
export function getSequentialQuestions(questions: Question[], startIndex: number = 0, count: number = 10): Question[] {
  const endIndex = Math.min(startIndex + count, questions.length);
  return questions.slice(startIndex, endIndex);
}