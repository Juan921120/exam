import React from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useQuizStore } from '../../store/quizStore';
import { getQuestionStats } from '../../data/questions';

const HomePage: React.FC = () => {
  const { quizMode, setQuizMode, startQuiz, allQuestions, sequentialStartIndex, isLoading } = useQuizStore();
  const stats = getQuestionStats(allQuestions);

  const handleStartQuiz = () => {
    if (isLoading) {
      Taro.showToast({ title: '题库加载中...', icon: 'loading' });
      return;
    }
    startQuiz();
    Taro.navigateTo({
      url: '/pages/quiz/index'
    });
  };

  const handleViewMistakes = () => {
    Taro.switchTab({
      url: '/pages/mistakes/index'
    });
  };

  const handleViewHistory = () => {
    Taro.switchTab({
      url: '/pages/mine/index'
    });
  };

  return (
    <ScrollView className={styles.homePage} scrollY>
      <View className={styles.heroSection}>
        <Text className={styles.heroTitle}>人工智能训练师</Text>
        <Text className={styles.heroSubtitle}>三级理论题库</Text>
        <Text className={styles.heroDesc}>随机抽取10题,完成后查看解析与错题分析</Text>
      </View>

      {isLoading ? (
        <View className={styles.loadingSection}>
          <Text className={styles.loadingText}>📦 正在加载题库...</Text>
          <Text className={styles.loadingSubtext}>首次加载可能需要几秒钟</Text>
        </View>
      ) : (
        <>
          <View className={styles.statsSection}>
            <View className={styles.statCard}>
              <Text className={styles.statNum}>{stats.tfCount}</Text>
              <Text className={styles.statLabel}>判断题</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={styles.statNum}>{stats.singleCount}</Text>
              <Text className={styles.statLabel}>单选题</Text>
            </View>
            <View className={styles.statCard}>
              <Text className={styles.statNum}>{stats.multiCount}</Text>
              <Text className={styles.statLabel}>多选题</Text>
            </View>
          </View>

          <View className={styles.modeSection}>
            <Text className={styles.modeTitle}>出题模式</Text>
            <View className={styles.modeButtons}>
              <Button
                className={quizMode === 'random' ? styles.modeButtonActive : styles.modeButton}
                onClick={() => setQuizMode('random')}
              >
                🎲 随机模式
              </Button>
              <Button
                className={quizMode === 'sequential' ? styles.modeButtonActive : styles.modeButton}
                onClick={() => setQuizMode('sequential')}
              >
                📋 顺序模式
              </Button>
            </View>
            <Text className={styles.modeDesc}>
              {quizMode === 'random' ? '完全随机抽取10题' : '从第1题开始,每次10题,断点续做'}
            </Text>
          </View>

          <View className={styles.actionSection}>
            <Button className={styles.primaryButton} onClick={handleStartQuiz}>
              🚀 开始测试
            </Button>
            <View className={styles.secondaryButtons}>
              <Button className={styles.outlineButton} onClick={handleViewMistakes}>
                📒 错题本
              </Button>
              <Button className={styles.outlineButton} onClick={handleViewHistory}>
                📊 历史记录
              </Button>
            </View>
          </View>

          <View className={styles.tipSection}>
            <Text className={styles.tipText}>
              当前题库共{stats.total}题
            </Text>
            <Text className={styles.tipText}>
              顺序模式已刷{sequentialStartIndex}题
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default HomePage;