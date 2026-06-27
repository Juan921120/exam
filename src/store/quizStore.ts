import { create } from 'zustand';
import type { QuizSession, QuizMode, QuizHistory } from '../types/quiz';
import type { Question } from '../types/question';
import { getRandomQuestions, getSequentialQuestions, sampleQuestions } from '../data/questions';
import type { MistakeRecord } from './mistakesStore';

interface QuizStore {
  // 当前测试会话
  currentSession: QuizSession | null;
  // 出题模式
  quizMode: QuizMode;
  // 顺序模式的起始索引
  sequentialStartIndex: number;
  // 历史记录
  history: QuizHistory[];
  // 题库数据(实际项目中应导入完整题库)
  allQuestions: Question[];
  // 复习模式: 'session'(本次测试复习) | 'mistakes'(错题本复习) | null(正常答题)
  reviewMode: 'session' | 'mistakes' | null;

  // Actions
  setQuizMode: (mode: QuizMode) => void;
  startQuiz: () => void;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  saveAnswer: (answer: string | null) => void;
  submitQuiz: () => void;
  loadQuestions: (questions: Question[]) => void;
  startReview: (type: 'session' | 'mistakes') => void;
  exitReview: () => void;
  startMistakesReview: (mistakeRecords: MistakeRecord[]) => void;
}

export const useQuizStore = create<QuizStore>((set, get) => ({
  currentSession: null,
  quizMode: 'random',
  sequentialStartIndex: 0,
  history: [],
  allQuestions: sampleQuestions, // 默认使用示例题目
  reviewMode: null,

  setQuizMode: (mode) => set({ quizMode: mode }),

  loadQuestions: (questions) => set({ allQuestions: questions }),

  startQuiz: () => {
    const { quizMode, sequentialStartIndex, allQuestions } = get();
    const questions = quizMode === 'random'
      ? getRandomQuestions(allQuestions, 10)
      : getSequentialQuestions(allQuestions, sequentialStartIndex, 10);

    const session: QuizSession = {
      questions,
      currentIndex: 0,
      answers: questions.map(() => null),
      startTime: Date.now()
    };

    set({ currentSession: session, reviewMode: null });

    // 更新顺序模式的起始索引
    if (quizMode === 'sequential') {
      set({ sequentialStartIndex: sequentialStartIndex + questions.length });
    }
  },

  startReview: (type) => {
    const { currentSession } = get();
    if (!currentSession) return;
    set({
      reviewMode: type,
      currentSession: { ...currentSession, currentIndex: 0 }
    });
  },

  exitReview: () => set({ reviewMode: null }),

  startMistakesReview: (mistakeRecords) => {
    if (mistakeRecords.length === 0) return;
    const session: QuizSession = {
      questions: mistakeRecords.map(r => ({ ...r.question })),
      currentIndex: 0,
      answers: mistakeRecords.map(r => r.userAnswer),
      startTime: Date.now()
    };
    set({ currentSession: session, reviewMode: 'mistakes' });
  },

  goToQuestion: (index) => {
    const { currentSession } = get();
    if (currentSession && index >= 0 && index < currentSession.questions.length) {
      set({ currentSession: { ...currentSession, currentIndex: index } });
    }
  },

  nextQuestion: () => {
    const { currentSession } = get();
    if (currentSession && currentSession.currentIndex < currentSession.questions.length - 1) {
      set({ currentSession: { ...currentSession, currentIndex: currentSession.currentIndex + 1 } });
    }
  },

  prevQuestion: () => {
    const { currentSession } = get();
    if (currentSession && currentSession.currentIndex > 0) {
      set({ currentSession: { ...currentSession, currentIndex: currentSession.currentIndex - 1 } });
    }
  },

  saveAnswer: (answer) => {
    const { currentSession } = get();
    if (currentSession) {
      const newAnswers = [...currentSession.answers];
      newAnswers[currentSession.currentIndex] = answer;
      set({ currentSession: { ...currentSession, answers: newAnswers } });
    }
  },

  submitQuiz: () => {
    const { currentSession, quizMode } = get();
    if (currentSession) {
      // 计算测试结果
      const endTime = Date.now();
      const timeSpent = endTime - currentSession.startTime;

      let correctCount = 0;
      currentSession.questions.forEach((question, index) => {
        const userAnswer = currentSession.answers[index];
        if (userAnswer === question.answer) {
          correctCount++;
        }
      });

      // 添加到历史记录
      const historyRecord: QuizHistory = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        mode: quizMode,
        result: {
          totalQuestions: currentSession.questions.length,
          correctCount,
          wrongCount: currentSession.questions.length - correctCount,
          correctRate: correctCount / currentSession.questions.length,
          timeSpent,
          answerRecords: currentSession.questions.map((question, index) => ({
            questionId: question.id,
            userAnswer: currentSession.answers[index],
            isCorrect: currentSession.answers[index] === question.answer,
            timeSpent: 0
          }))
        }
      };

      set((state) => ({
        history: [...state.history, historyRecord],
        currentSession: {
          ...currentSession,
          endTime
        }
      }));
    }
  }
}));