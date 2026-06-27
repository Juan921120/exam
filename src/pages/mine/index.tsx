// 我的页
import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';
import { useQuizStore } from '../../store/quizStore';

const MinePage: React.FC = () => {
  const { history } = useQuizStore();

  // 计算统计数据
  const totalTests = history.length;
  const totalQuestions = history.reduce((sum, record) => sum + record.result.totalQuestions, 0);
  const totalCorrect = history.reduce((sum, record) => sum + record.result.correctCount, 0);
  const avgRate = totalTests > 0 ? totalCorrect / totalQuestions : 0;

  return (
    <ScrollView className={styles.minePage} scrollY>
      {/* 用户信息 */}
      <View className={styles.userSection}>
        <View className={styles.userAvatar}>
          <Text className={styles.userIcon}>👤</Text>
        </View>
        <Text className={styles.userName}>AI训练师学员</Text>
      </View>

      {/* 统计数据 */}
      <View className={styles.statsGrid}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{totalTests}</Text>
          <Text className={styles.statLabel}>测试次数</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{totalQuestions}</Text>
          <Text className={styles.statLabel}>答题总数</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{Math.round(avgRate * 100)}%</Text>
          <Text className={styles.statLabel}>平均正确率</Text>
        </View>
      </View>

      {/* 历史记录 */}
      <View className={styles.historySection}>
        <Text className={styles.sectionTitle}>答题历史</Text>
        {history.length > 0 ? (
          <View className={styles.historyList}>
            {history.map((record) => (
              <View key={record.id} className={styles.historyCard}>
                <View className={styles.historyHeader}>
                  <Text className={styles.historyDate}>{record.date}</Text>
                  <Text className={styles.historyMode}>
                    {record.mode === 'random' ? '随机模式' : '顺序模式'}
                  </Text>
                </View>
                <View className={styles.historyStats}>
                  <Text className={styles.historyScore}>
                    {record.result.correctCount} / {record.result.totalQuestions}
                  </Text>
                  <Text className={styles.historyRate}>
                    正确率: {Math.round(record.result.correctRate * 100)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyText}>暂无答题记录</Text>
            <Text className={styles.emptyDesc}>开始测试吧!</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default MinePage;