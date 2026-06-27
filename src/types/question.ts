// 题目类型定义
export interface Question {
  id: number;
  type: 'tf' | 'single' | 'multi'; // tf:判断题, single:单选题, multi:多选题
  q: string; // 题目内容
  answer: string; // 正确答案
  options?: Array<{key: string; text: string}>; // 选项(单选/多选题才有)
  explanation: string; // 解析
}

export interface QuestionStats {
  total: number;
  tfCount: number;
  singleCount: number;
  multiCount: number;
}

export interface AnswerRecord {
  questionId: number;
  userAnswer: string | null;
  isCorrect: boolean;
  timeSpent: number;
}