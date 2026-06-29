import type { Question } from '../types/question';
import Taro from '@tarojs/taro';

const REMOTE_URL = 'https://raw.githubusercontent.com/Juan921120/exam/main/questions.json';

const STORAGE_KEY = 'exam-questions-cache';

const defaultQuestions: Question[] = [];

export let sampleQuestions: Question[] = defaultQuestions;

export async function loadQuestions(): Promise<Question[]> {
  try {
    const cached = Taro.getStorageSync(STORAGE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (Array.isArray(data) && data.length > 0) {
          console.log('[Questions] Loaded from cache:', data.length, 'questions');
          sampleQuestions = data;
          return data;
        }
      } catch (e) {
        console.error('[Questions] Failed to parse cached questions:', e);
      }
    }
  } catch (e) {
    console.error('[Questions] Failed to read from storage:', e);
  }

  return await loadFromRemote();
}

async function loadFromRemote(): Promise<Question[]> {
  try {
    const res = await Taro.request({
      url: REMOTE_URL,
      method: 'GET',
      timeout: 15000,
    });

    if (res.statusCode === 200 && Array.isArray(res.data)) {
      console.log('[Questions] Loaded from remote:', res.data.length, 'questions');
      sampleQuestions = res.data;
      try {
        Taro.setStorageSync(STORAGE_KEY, JSON.stringify(res.data));
      } catch (e) {
        console.warn('[Questions] Failed to cache questions:', e);
      }
      return res.data;
    }
  } catch (e) {
    console.error('[Questions] Failed to load from remote:', e);
  }

  console.warn('[Questions] Using default empty questions');
  return defaultQuestions;
}

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

export function getRandomQuestions(questions: Question[], count: number = 10): Question[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getSequentialQuestions(questions: Question[], startIndex: number = 0, count: number = 10): Question[] {
  const endIndex = Math.min(startIndex + count, questions.length);
  return questions.slice(startIndex, endIndex);
}