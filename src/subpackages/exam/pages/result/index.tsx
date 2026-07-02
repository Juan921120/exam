// 结果页 (分包)
import React, { useState, useRef } from 'react';
import { View, Text, Button, Image } from '@tarojs/components';
import Taro, { useLoad, useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useQuizStore } from '../../../../store/quizStore';
import { sampleQuestions } from '../../../../data/questions';
import bgImage from '../../../../assets/UI_03.png';
import rightBg from '../../../../assets/right.png';
import wrongBg from '../../../../assets/wrong.png';
import timeBg from '../../../../assets/time.png';
import lookBg from '../../../../assets/look.png';
import returnBg from '../../../../assets/retrun.png';
import moreOneBg from '../../../../assets/moreOne.png';

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
    Taro.reLaunch({ url: '/subpackages/exam/pages/quiz/index?action=start' });
  };

  if (!latestRecord) {
    return (
      <View className={styles.resultPage}>
        <Image className={styles.bgImage} src={bgImage} mode="aspectFill" />
        <Text className={styles.errorText}>未找到测试结果</Text>
        <Button className={styles.backButton} onClick={() => Taro.navigateBack()}>
          返回首页
        </Button>
      </View>
    );
  }

  const { result } = latestRecord;

  const handleViewReview = () => {
    isReturningFromReview.current = true;
    startReview('session');
    Taro.navigateTo({ url: '/subpackages/exam/pages/quiz/index' });
  };

  return (
    <View className={styles.resultPage}>
      <Image className={styles.bgImage} src={bgImage} mode="aspectFill" />
      
      <View className={styles.contentWrapper}>
        <View className={styles.heroSection}>
          <View className={styles.scoreCircle}>
            <Text className={styles.scoreNum}>{result.correctCount} </Text>
            <Text className={styles.scoreDen}>/ {result.totalQuestions}</Text>
          </View>
          <Text className={styles.gradeText}>
            {result.correctRate >= 0.8 ? '优秀，' : result.correctRate >= 0.6 ? '良好，' : '继续加油，'}
          </Text>
          <Text className={styles.rateText}>
            正确率: {Math.round(result.correctRate * 100)}%
          </Text>
        </View>

        <View className={styles.statsSection}>
          <View className={styles.statCard}>
            <Image className={styles.statBgImage} src={rightBg} mode="aspectFill" />
            <View className={styles.statContent}>
              <Text className={styles.statValue}>{result.correctCount}</Text>
              <Text className={styles.statLabel}>答对</Text>
            </View>
          </View>
          <View className={styles.statCard}>
            <Image className={styles.statBgImage} src={wrongBg} mode="aspectFill" />
            <View className={styles.statContent}>
              <Text className={styles.statValue}>{result.wrongCount}</Text>
              <Text className={styles.statLabel}>答错</Text>
            </View>
          </View>
          <View className={styles.statCard}>
            <Image className={styles.statBgImage} src={timeBg} mode="aspectFill" />
            <View className={styles.statContent}>
              <Text className={styles.statValue}>
                {Math.floor(result.timeSpent / 60000)}:{Math.floor((result.timeSpent % 60000) / 1000).toString().padStart(2, '0')}
              </Text>
              <Text className={styles.statLabel}>用时</Text>
            </View>
          </View>
        </View>

        <View className={styles.actionSection}>
          <Button className={styles.imageButton} onClick={handleViewReview}>
            <Image className={styles.buttonImage} src={lookBg} mode="aspectFit" />
          </Button>
          {(isPerfectScore || hasViewedReview) && (
            <Button className={styles.imageButton} onClick={handleNextRound}>
              <Image className={styles.buttonImage} src={moreOneBg} mode="aspectFit" />
            </Button>
          )}
          <Button className={styles.imageButton} onClick={() => Taro.switchTab({ url: '/pages/home/index' })}>
            <Image className={styles.buttonImage} src={returnBg} mode="aspectFit" />
          </Button>
        </View>
      </View>
    </View>
  );
};

export default ResultPage;