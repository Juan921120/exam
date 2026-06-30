// 结果页 (分包)
import React, { useState, useRef } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useLoad, useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useQuizStore } from '../../../../store/quizStore';
import { sampleQuestions } from '../../../../data/questions';

const ResultPage: React.FC = () => {
  const { history, startReview, startQuiz, loadQuestions, allQuestions } = useQuizStore();
  const [hasViewedReview, setHasViewedReview] = useState(false);
  const isReturningFromReview = useRef(false);
  
  useDidShow(() => {
    if (isReturningFromReview.current) {
      setHasViewedReview(true);
      isReturningFromReview.current = false;
    }
  });
  
  useLoad(() => {
    if (allQuestions.length === 0) {
      loadQuestions(sampleQuestions);
    }
  });

  const latestRecord = history[history.length - 1];
  const isPerfectScore = latestRecord && latestRecord.result.correctCount === latestRecord.result.totalQuestions;
  const handleNextRound = () => {
    startQuiz();
    Taro.redirectTo({ url: '/subpackages/exam/pages/quiz/index' });
  };

  if (!latestRecord) {
    return (
      <View className={styles.resultPage}>
        <Text className={styles.errorText}>未找到测试结果</Text>
        <Button className={styles.backButton} onClick={() => Taro.navigateBack()}>
          返回首页
        </Button>
      </View>
    );
  }

  const { result } = latestRecord;

  // 查看解析：进入答题页复习模式
  const handleViewReview = () => {
    isReturningFromReview.current = true;
    startReview('session');
    Taro.navigateTo({ url: '/subpackages/exam/pages/quiz/index' });
  };

  return (
    <View className={styles.resultPage}>
      {/* 成绩展示 */}
      <View className={styles.heroSection}>
        <View className={styles.scoreCircle}>
          <Text className={styles.scoreNum}>{result.correctCount}</Text>
          <Text className={styles.scoreDen}>/ {result.totalQuestions}</Text>
        </View>
        <Text className={styles.gradeText}>
          {result.correctRate >= 0.8 ? '优秀' : result.correctRate >= 0.6 ? '良好' : '继续加油'}
        </Text>
        <Text className={styles.rateText}>
          正确率: {Math.round(result.correctRate * 100)}%
        </Text>
      </View>

      {/* 统计数据 */}
      <View className={styles.statsSection}>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{result.correctCount}</Text>
          <Text className={styles.statLabel}>答对</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{result.wrongCount}</Text>
          <Text className={styles.statLabel}>答错</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>
            {Math.floor(result.timeSpent / 60000)}:{Math.floor((result.timeSpent % 60000) / 1000).toString().padStart(2, '0')}
          </Text>
          <Text className={styles.statLabel}>用时</Text>
        </View>
      </View>

      {/* 操作按钮 */}
      <View className={styles.actionSection}>
        <Button className={styles.primaryButton} onClick={handleViewReview}>
          📋 查看解析
        </Button>
        {(isPerfectScore || hasViewedReview) && (
          <Button className={styles.primaryButton} onClick={handleNextRound}>
            🚀 继续下一轮测试
          </Button>
        )}
        <Button className={styles.outlineButton} onClick={() => Taro.switchTab({ url: '/pages/home/index' })}>
          🏠 返回首页
        </Button>
      </View>
    </View>
  );
};

export default ResultPage;
