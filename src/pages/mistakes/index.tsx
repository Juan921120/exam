// 错题本页
import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useMistakesStore } from '../../store/mistakesStore';
import { useQuizStore } from '../../store/quizStore';

const MistakesPage: React.FC = () => {
  const { mistakeRecords, clearMistakes } = useMistakesStore();
  const { startMistakesReview } = useQuizStore();

  // 开始错题复习（每次10题）
  const handleStartReview = () => {
    if (mistakeRecords.length === 0) {
      return;
    }
    startMistakesReview(mistakeRecords);
    Taro.navigateTo({ url: '/pages/quiz/index' });
  };

  return (
    <View className={styles.mistakesPage}>
      {/* 统计信息 */}
      <View className={styles.headerSection}>
        <Text className={styles.pageTitle}>错题本</Text>
        <Text className={styles.mistakesCount}>共 {mistakeRecords.length} 题</Text>
        {mistakeRecords.length > 0 && (
          <Text className={styles.reviewHint}>每次复习 10 题，答对后自动移除</Text>
        )}
      </View>

      {/* 开始复习按钮 */}
      {mistakeRecords.length > 0 ? (
        <View className={styles.actionSection}>
          <Button className={styles.reviewButton} onClick={handleStartReview}>
            📖 开始错题复习
          </Button>
          <Button className={styles.clearButton} onClick={clearMistakes}>
            清空错题本
          </Button>
        </View>
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>✅</Text>
          <Text className={styles.emptyText}>错题本是空的</Text>
          <Text className={styles.emptyDesc}>完成测试后，答错的题目会自动收录</Text>
        </View>
      )}
    </View>
  );
};

export default MistakesPage;