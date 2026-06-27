import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { QuizSession, QuizMode, QuizHistory } from '../types/quiz';
import type { Question } from '../types/question';
import { getRandomQuestions, getSequentialQuestions, sampleQuestions } from '../data/questions';
import type { MistakeRecord } from './mistakesStore';

// Storage key
const STORAGE_KEY = 'quiz-store';

// 从 storage 读取状态
const loadState = () => {
  try {
    const data = Taro.getStorageSync(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to load quiz store:', e);
    return null;
  }
};

// 保存状态到 storage
const saveState = (state: Partial<QuizStore>) => {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save quiz store:', e);
  }
};

// 加载初始状态
const initialState = loadState();

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
  currentSession: initialState?.currentSession || null,
  quizMode: initialState?.quizMode || 'random',
  sequentialStartIndex: initialState?.sequentialStartIndex || 0,
  history: initialState?.history || [],
  allQuestions: sampleQuestions, // 默认使用示例题目
  reviewMode: null,

  setQuizMode: (mode) => {
    set({ quizMode: mode });
    saveState({ quizMode: mode });
  },

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

    const newSequentialIndex = quizMode === 'sequential' 
      ? sequentialStartIndex + questions.length 
      : sequentialStartIndex;

    set({ 
      currentSession: session, 
      reviewMode: null,
      sequentialStartIndex: newSequentialIndex 
    });

    // 保存到 storage
    saveState({ 
      currentSession: session, 
      sequentialStartIndex: newSequentialIndex 
    });
  },

  startReview: (type) => {
    const { currentSession } = get();
    if (!currentSession) return;
    set({
      reviewMode: type,
      currentSession: { ...currentSession, currentIndex: 0 }
    });
    saveState({ currentSession: { ...currentSession, currentIndex: 0 } });
  },

  exitReview: () => {
    set({ reviewMode: null });
    saveState({ reviewMode: null });
  },

  startMistakesReview: (mistakeRecords) => {
    if (mistakeRecords.length === 0) return;
    const session: QuizSession = {
      questions: mistakeRecords.map(r => ({ ...r.question })),
      currentIndex: 0,
      answers: mistakeRecords.map(r => r.userAnswer),
      startTime: Date.now()
    };
    set({ currentSession: session, reviewMode: 'mistakes' });
    saveState({ currentSession: session, reviewMode: 'mistakes' });
  },

  goToQuestion: (index) => {
    const { currentSession } = get();
    if (currentSession && index >= 0 && index < currentSession.questions.length) {
      set({ currentSession: { ...currentSession, currentIndex: index } });
      saveState({ currentSession: { ...currentSession, currentIndex: index } });
    }
  },

  nextQuestion: () => {
    const { currentSession } = get();
    if (currentSession && currentSession.currentIndex < currentSession.questions.length - 1) {
      const newIndex = currentSession.currentIndex + 1;
      set({ currentSession: { ...currentSession, currentIndex: newIndex } });
      saveState({ currentSession: { ...currentSession, currentIndex: newIndex } });
    }
  },

  prevQuestion: () => {
    const { currentSession } = get();
    if (currentSession && currentSession.currentIndex > 0) {
      const newIndex = currentSession.currentIndex - 1;
      set({ currentSession: { ...currentSession, currentIndex: newIndex } });
      saveState({ currentSession: { ...currentSession, currentIndex: newIndex } });
    }
  },

  saveAnswer: (answer) => {
    const { currentSession } = get();
    if (currentSession) {
      const newAnswers = [...currentSession.answers];
      newAnswers[currentSession.currentIndex] = answer;
      const updatedSession = { ...currentSession, answers: newAnswers };
      set({ currentSession: updatedSession });
      saveState({ currentSession: updatedSession });
    }
  },

  submitQuiz: () => {
    const { currentSession, quizMode, history } = get();
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

      const newHistory = [...history, historyRecord];
      set(() => ({
        history: newHistory,
        currentSession: {
          ...currentSession,
          endTime
        }
      }));
      saveState({ 
        history: newHistory,
        currentSession: {
          ...currentSession,
          endTime
        }
      });
    }
  }
}));