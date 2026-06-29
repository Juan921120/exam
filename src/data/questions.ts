// 题库数据入口
// H5端和小程序端统一使用完整题库（包含explanation）
// questions-minimal.json 保留作为不含解析的精简版备用
import type { Question } from '../types/question';
import { questionsData } from './questions-data';

export const sampleQuestions: Question[] = questionsData as Question[];

// 工具函数从独立文件导出（主包 store 只引用 question-utils，不引用此文件以避免数据打包进主包）
export { getQuestionStats, getRandomQuestions, getSequentialQuestions } from './question-utils';