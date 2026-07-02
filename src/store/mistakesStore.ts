// 错题本状态管理
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Question } from '../types/question';

// 兼容 Taro 多端环境：H5 用 localStorage，小程序用 Taro.getStorageSync
function getStorage() {
  try {
    // Taro 环境
    const Taro = require('@tarojs/taro');
    if (Taro && Taro.getStorageSync) {
      return {
        getItem: (key: string) => {
          const val = Taro.getStorageSync(key);
          return val ? JSON.stringify(val) : null;
        },
        setItem: (key: string, value: string) => {
          Taro.setStorageSync(key, JSON.parse(value));
        },
        removeItem: (key: string) => {
          Taro.removeStorageSync(key);
        }
      };
    }
  } catch {}
  // 浏览器环境兜底
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {}
  // 兜底：内存存储（仅当前会话有效）
  const mem: Record<string, string> = {};
  return {
    getItem: (key: string) => mem[key] ?? null,
    setItem: (key: string, value: string) => { mem[key] = value; },
    removeItem: (key: string) => { delete mem[key]; }
  };
}

// 错题记录：包含题目和用户的错误答案
export interface MistakeRecord {
  question: Question;
  userAnswer: string | null;
  lastWrong: number;
}

interface MistakesStore {
  mistakeRecords: MistakeRecord[];

  addMistake: (question: Question, userAnswer: string | null) => void;
  removeMistake: (questionId: number) => void;
  clearMistakes: () => void;
  isMistake: (questionId: number) => boolean;
  getMistakeRecords: () => MistakeRecord[];
  batchUpdateMistakes: (addList: { question: Question; userAnswer: string | null }[], removeIds: number[]) => void;
}

export const useMistakesStore = create<MistakesStore>()(
  persist(
    (set, get) => ({
      mistakeRecords: [],

      addMistake: (question, userAnswer) => {
        const { mistakeRecords } = get();
        // 过滤掉旧版本残留的空数据
        const validRecords = mistakeRecords.filter(r => r && r.question);
        const existingIndex = validRecords.findIndex(r => r.question.id === question.id);
        if (existingIndex === -1) {
          set({
            mistakeRecords: [...validRecords, { question, userAnswer, lastWrong: Date.now() }]
          });
        } else {
          const updated = [...validRecords];
          updated[existingIndex] = { ...updated[existingIndex], userAnswer, lastWrong: Date.now() };
          set({ mistakeRecords: updated });
        }
      },

      removeMistake: (questionId) => {
        const { mistakeRecords } = get();
        set({
          mistakeRecords: (mistakeRecords || []).filter(r => r && r.question && r.question.id !== questionId)
        });
      },

      clearMistakes: () => set({ mistakeRecords: [] }),

      isMistake: (questionId) => {
        const records = get().mistakeRecords || [];
        return records.some(r => r && r.question && r.question.id === questionId);
      },

      getMistakeRecords: () => (get().mistakeRecords || []).filter(r => r && r.question),

      batchUpdateMistakes: (addList, removeIds) => {
        const { mistakeRecords } = get();
        let validRecords = (mistakeRecords || []).filter(r => r && r.question);
        validRecords = validRecords.filter(r => !removeIds.includes(r.question.id));
        addList.forEach(({ question, userAnswer }) => {
          const existingIndex = validRecords.findIndex(r => r.question.id === question.id);
          if (existingIndex === -1) {
            validRecords.push({ question, userAnswer, lastWrong: Date.now() });
          } else {
            validRecords[existingIndex] = { ...validRecords[existingIndex], userAnswer, lastWrong: Date.now() };
          }
        });
        set({ mistakeRecords: validRecords });
      }
    }),
    {
      name: 'mistakes-storage',
      storage: createJSONStorage(getStorage),
      // 合并旧数据时清理无效记录
      merge: (persisted: any, current) => ({
        ...current,
        ...persisted,
        mistakeRecords: (persisted?.mistakeRecords || []).filter(r => r && r.question)
      })
    }
  )
);