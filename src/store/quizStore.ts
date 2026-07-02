import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { QuizSession, QuizMode, QuizHistory } from '../types/quiz';
import type { Question } from '../types/question';
import { getRandomQuestions, getSequentialQuestions } from '../data/question-utils';
import type { MistakeRecord } from './mistakesStore';

const STORAGE_KEY = 'quiz-store';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const debouncedSaveState = (state: Partial<PersistedState>) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    saveState(state);
    debounceTimer = null;
  }, 500);
};

// 轻量级持久化状态接口（只保存必要数据）
interface PersistedState {
  quizMode: QuizMode;
  sequentialStartIndex: number;
  history: QuizHistory[];
  // 当前会话只保存题目ID和答案，不保存完整题目对象
  sessionQuestionIds: number[] | null;
  sessionAnswers: (string | null)[] | null;
  sessionCurrentIndex: number;
  sessionStartTime: number;
  sessionEndTime: number | undefined;
  reviewMode: 'session' | 'mistakes' | null;
}

// 从 storage 读取状态
const loadState = (): PersistedState | null => {
  try {
    const data = Taro.getStorageSync(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      console.log('Loaded quiz state:', {
        historyCount: parsed.history?.length || 0,
        sequentialStartIndex: parsed.sequentialStartIndex || 0,
        hasSession: !!parsed.sessionQuestionIds
      });
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load quiz store:', e);
  }
  return null;
};

// 保存状态到 storage
const saveState = (state: Partial<PersistedState>) => {
  try {
    const current = loadState() || {};
    const newState = { ...current, ...state };
    
    // 限制历史记录数量，最多保留50条
    if (newState.history && newState.history.length > 50) {
      newState.history = newState.history.slice(-50);
    }
    
    const jsonStr = JSON.stringify(newState);
    console.log('Saving quiz state, size:', jsonStr.length);
    Taro.setStorageSync(STORAGE_KEY, jsonStr);
  } catch (e) {
    console.error('Failed to save quiz store:', e);
  }
};

// 加载初始状态
const persistedState = loadState();

// 根据题目ID数组恢复题目对象
const restoreQuestionsByIds = (questionIds: number[], allQuestions: Question[]): Question[] => {
  if (!Array.isArray(questionIds)) {
    console.warn('restoreQuestionsByIds: questionIds is not an array');
    return [];
  }
  if (!Array.isArray(allQuestions) || allQuestions.length === 0) {
    console.warn('restoreQuestionsByIds: allQuestions is empty');
    return [];
  }
  return questionIds.map(id => {
    const found = allQuestions.find(q => q.id === id);
    if (!found) {
      console.warn(`Question ${id} not found in question bank`);
      return null;
    }
    return found;
  }).filter((q): q is Question => q !== null);
};

interface QuizStore {
  currentSession: QuizSession | null;
  quizMode: QuizMode;
  sequentialStartIndex: number;
  history: QuizHistory[];
  allQuestions: Question[];
  reviewMode: 'session' | 'mistakes' | null;

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
  clearHistory: () => void;
}

export const useQuizStore = create<QuizStore>((set, get) => {
  // 尝试从持久化状态恢复当前会话
  const restoreSession = (): QuizSession | null => {
    if (!persistedState?.sessionQuestionIds || !Array.isArray(persistedState.sessionQuestionIds) || persistedState.sessionQuestionIds.length === 0) {
      return null;
    }
    try {
      const questions = restoreQuestionsByIds(persistedState.sessionQuestionIds, get().allQuestions);
      if (questions.length === 0) {
        console.warn('No questions restored from saved state');
        return null;
      }
      const savedAnswers = persistedState.sessionAnswers;
      let answers: (string | null)[];
      if (Array.isArray(savedAnswers) && savedAnswers.length === questions.length) {
        answers = savedAnswers;
      } else {
        console.warn('sessionAnswers format invalid, resetting to null');
        answers = questions.map(() => null);
      }
      return {
        questions,
        currentIndex: typeof persistedState.sessionCurrentIndex === 'number' ? persistedState.sessionCurrentIndex : 0,
        answers,
        startTime: typeof persistedState.sessionStartTime === 'number' ? persistedState.sessionStartTime : Date.now(),
        endTime: typeof persistedState.sessionEndTime === 'number' ? persistedState.sessionEndTime : undefined
      };
    } catch (e) {
      console.error('Failed to restore session:', e);
      saveState({
        sessionQuestionIds: null,
        sessionAnswers: null,
        sessionCurrentIndex: 0,
        sessionStartTime: 0,
        sessionEndTime: undefined
      });
      return null;
    }
  };

  return {
    currentSession: restoreSession(),
    quizMode: persistedState?.quizMode || 'random',
    sequentialStartIndex: persistedState?.sequentialStartIndex || 0,
    history: persistedState?.history || [],
    // 主包初始为空数组，分包 quiz 页面 onLoad 时通过 loadQuestions() 注入完整题库
    allQuestions: [] as Question[],
    reviewMode: persistedState?.reviewMode || null,

    setQuizMode: (mode) => {
      set({ quizMode: mode });
      saveState({ quizMode: mode });
    },

    loadQuestions: (questions) => {
      set({ allQuestions: questions });
      if (!get().currentSession && persistedState?.sessionQuestionIds && Array.isArray(persistedState.sessionQuestionIds) && persistedState.sessionQuestionIds.length > 0) {
        try {
          const restoredQuestions = restoreQuestionsByIds(persistedState.sessionQuestionIds, questions);
          if (restoredQuestions.length > 0) {
            const savedAnswers = persistedState.sessionAnswers;
            let answers: (string | null)[];
            if (Array.isArray(savedAnswers) && savedAnswers.length === restoredQuestions.length) {
              answers = savedAnswers;
            } else {
              console.warn('sessionAnswers format invalid in loadQuestions, resetting to null');
              answers = restoredQuestions.map(() => null);
            }
            set({
              currentSession: {
                questions: restoredQuestions,
                currentIndex: typeof persistedState.sessionCurrentIndex === 'number' ? persistedState.sessionCurrentIndex : 0,
                answers,
                startTime: typeof persistedState.sessionStartTime === 'number' ? persistedState.sessionStartTime : Date.now(),
                endTime: typeof persistedState.sessionEndTime === 'number' ? persistedState.sessionEndTime : undefined
              }
            });
          }
        } catch (e) {
          console.error('Failed to restore session on loadQuestions:', e);
          saveState({
            sessionQuestionIds: null,
            sessionAnswers: null,
            sessionCurrentIndex: 0,
            sessionStartTime: 0,
            sessionEndTime: undefined
          });
        }
      }
    },

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

      set({ 
        currentSession: session, 
        reviewMode: null
      });

      // 轻量级持久化：只保存题目ID和答案
      saveState({ 
        sessionQuestionIds: questions.map(q => q.id),
        sessionAnswers: session.answers,
        sessionCurrentIndex: session.currentIndex,
        sessionStartTime: session.startTime,
        sessionEndTime: undefined,
        reviewMode: null
      });
    },

    startReview: (type) => {
      const { currentSession } = get();
      if (!currentSession) return;
      set({
        reviewMode: type,
        currentSession: { ...currentSession, currentIndex: 0 }
      });
      saveState({ 
        sessionCurrentIndex: 0,
        reviewMode: type 
      });
    },

    exitReview: () => {
      set({ reviewMode: null });
      saveState({ reviewMode: null });
    },

    startMistakesReview: (mistakeRecords) => {
      if (mistakeRecords.length === 0) return;
      const shuffled = [...mistakeRecords].sort(() => Math.random() - 0.5);
      const selectedRecords = shuffled.slice(0, 10);
      const session: QuizSession = {
        questions: selectedRecords.map(r => ({ ...r.question })),
        currentIndex: 0,
        answers: selectedRecords.map(() => null),
        startTime: Date.now()
      };
      set({ currentSession: session, reviewMode: 'mistakes' });
      saveState({ 
        sessionQuestionIds: session.questions.map(q => q.id),
        sessionAnswers: session.answers,
        sessionCurrentIndex: session.currentIndex,
        sessionStartTime: session.startTime,
        sessionEndTime: undefined,
        reviewMode: 'mistakes'
      });
    },

    goToQuestion: (index) => {
      const { currentSession } = get();
      if (currentSession && index >= 0 && index < currentSession.questions.length) {
        set({ currentSession: { ...currentSession, currentIndex: index } });
        debouncedSaveState({ sessionCurrentIndex: index });
      }
    },

    nextQuestion: () => {
      const { currentSession } = get();
      if (currentSession && currentSession.currentIndex < currentSession.questions.length - 1) {
        const newIndex = currentSession.currentIndex + 1;
        set({ currentSession: { ...currentSession, currentIndex: newIndex } });
        debouncedSaveState({ sessionCurrentIndex: newIndex });
      }
    },

    prevQuestion: () => {
      const { currentSession } = get();
      if (currentSession && currentSession.currentIndex > 0) {
        const newIndex = currentSession.currentIndex - 1;
        set({ currentSession: { ...currentSession, currentIndex: newIndex } });
        debouncedSaveState({ sessionCurrentIndex: newIndex });
      }
    },

    saveAnswer: (answer) => {
      const { currentSession } = get();
      if (currentSession) {
        const newAnswers = [...currentSession.answers];
        newAnswers[currentSession.currentIndex] = answer;
        const updatedSession = { ...currentSession, answers: newAnswers };
        set({ currentSession: updatedSession });
        debouncedSaveState({ sessionAnswers: newAnswers });
      }
    },

    submitQuiz: () => {
      const { currentSession, quizMode, history } = get();
      if (currentSession) {
        const endTime = Date.now();
        const timeSpent = endTime - currentSession.startTime;

        const isAnswerCorrect = (question: Question, userAnswer: string | null): boolean => {
          if (userAnswer === null || userAnswer === undefined) return false;
          if (question.type === 'tf' || question.type === 'single') return userAnswer === question.answer;
          const correct = question.answer.split('').sort().join('');
          const ua = userAnswer.split(',').sort().join('');
          return correct === ua;
        };

        let correctCount = 0;
        currentSession.questions.forEach((question, index) => {
          const userAnswer = currentSession.answers[index];
          if (isAnswerCorrect(question, userAnswer)) {
            correctCount++;
          }
        });

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
              isCorrect: isAnswerCorrect(question, currentSession.answers[index]),
              timeSpent: 0
            }))
          }
        };

        const newHistory = [...history, historyRecord];
        const updatedSession = { ...currentSession, endTime };
        
        let newSequentialIndex = get().sequentialStartIndex;
        if (quizMode === 'sequential') {
          newSequentialIndex += currentSession.questions.length;
        }
        
        set(() => ({
          history: newHistory,
          currentSession: updatedSession,
          sequentialStartIndex: newSequentialIndex
        }));
        
        saveState({ 
          history: newHistory,
          sessionEndTime: endTime,
          sequentialStartIndex: newSequentialIndex
        });
      }
    },

    clearHistory: () => {
      set({ history: [] });
      saveState({ history: [] });
    }
  };
});