// 错题本页
import React from 'react';
import { View, Text, Button, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useMistakesStore } from '../../store/mistakesStore';
import { useQuizStore } from '../../store/quizStore';
import reviewBg from '../../assets/review.png';
import clearBg from '../../assets/clear.png';

const MistakesPage: React.FC = () => {
  const { mistakeRecords, clearMistakes } = useMistakesStore();
  const { startMistakesReview } = useQuizStore();

  const handleStartReview = () => {
    if (mistakeRecords.length === 0) {
      return;
    }
    startMistakesReview(mistakeRecords);
    Taro.navigateTo({ url: '/subpackages/exam/pages/quiz/index' });
  };

  return (
    <View className={styles.mistakesPage}>
      <View className={styles.contentWrapper}>
        <View className={styles.headerSection}>
          <Text className={styles.pageTitle}>错题本</Text>
          <Text className={styles.mistakesCount}>共 {mistakeRecords.length} 题</Text>
          {mistakeRecords.length > 0 && (
            <Text className={styles.reviewHint}>每次复习 10 题，答对后自动移除</Text>
          )}
        </View>

        {mistakeRecords.length > 0 ? (
          <View className={styles.actionSection}>
            <Button className={styles.imageButton} onClick={handleStartReview}>
              <Image className={styles.buttonImage} src={reviewBg} mode="aspectFit" />
            </Button>
            <Button className={styles.imageButton} onClick={clearMistakes}>
              <Image className={styles.buttonImage} src={clearBg} mode="aspectFit" />
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
    </View>
  );
};

export default MistakesPage;