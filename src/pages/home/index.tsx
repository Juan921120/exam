// 首页
import React from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useQuizStore } from '../../store/quizStore';
import { questionStats } from '../../data/questions-meta';

const HomePage: React.FC = () => {
  const { quizMode, setQuizMode, sequentialStartIndex } = useQuizStore();
  const stats = questionStats;
  const loaded = true;

  // 开始测试 — 不在此处调用 startQuiz()，避免 allQuestions 还未注入就创建空 session
  // 通过 URL 参数 action=start 告知分包 quiz 页面在加载题库后再开始
  const handleStartQuiz = () => {
    Taro.navigateTo({
      url: '/subpackages/exam/pages/quiz/index?action=start'
    });
  };

  // 查看错题本
  const handleViewMistakes = () => {
    Taro.switchTab({
      url: '/pages/mistakes/index'
    });
  };

  // 查看历史记录
  const handleViewHistory = () => {
    Taro.switchTab({
      url: '/pages/mine/index'
    });
  };

  return (
    <ScrollView className={styles.homePage} scrollY>
      {/* Hero区域 */}
      <View className={styles.heroSection}>
        <Text className={styles.heroTitle}>人工智能训练师</Text>
        <Text className={styles.heroSubtitle}>三级理论题库</Text>
        <Text className={styles.heroDesc}>随机抽取10题,完成后查看解析与错题分析</Text>
      </View>

      {/* 统计信息 */}
      <View className={styles.statsSection}>
        <View className={styles.statCard}>
          <Text className={styles.statNum}>{loaded ? stats.tfCount : '—'}</Text>
          <Text className={styles.statLabel}>判断题</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statNum}>{loaded ? stats.singleCount : '—'}</Text>
          <Text className={styles.statLabel}>单选题</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statNum}>{loaded ? stats.multiCount : '—'}</Text>
          <Text className={styles.statLabel}>多选题</Text>
        </View>
      </View>

      {/* 出题模式选择 */}
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

      {/* 操作按钮 */}
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

      {/* 提示信息 */}
      <View className={styles.tipSection}>
        <Text className={styles.tipText}>
          {loaded ? `当前题库共${stats.total}题` : '题库加载中...'}
        </Text>
        <Text className={styles.tipText}>
          顺序模式已刷{sequentialStartIndex}题
        </Text>
      </View>
    </ScrollView>
  );
};

export default HomePage;