// 解析页 (分包)
import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';
import { useQuizStore } from '../../../../store/quizStore';

const ReviewPage: React.FC = () => {
  const { history } = useQuizStore();
  const latestRecord = history[history.length - 1];

  if (!latestRecord) {
    return <View className={styles.reviewPage}><Text>未找到测试记录</Text></View>;
  }

  const { result, mode } = latestRecord;

  return (
    <ScrollView className={styles.reviewPage} scrollY>
      <Text className={styles.pageTitle}>答题解析</Text>
      <Text className={styles.pageDesc}>{mode === 'random' ? '随机模式' : '顺序模式'}</Text>

      {result.answerRecords.map((record, index) => {
        const question = latestRecord.result.answerRecords[index];
        return (
          <View key={index} className={styles.reviewCard}>
            <View className={styles.cardHeader}>
              <Text className={record.isCorrect ? styles.questionNumCorrect : styles.questionNumWrong}>第 {index + 1} 题</Text>
              <Text className={styles.statusTag}>
                {record.isCorrect ? '✓ 正确' : '✗ 错误'}
              </Text>
            </View>
            <Text className={styles.questionText}>{question.questionId}</Text>
            <View className={styles.answerInfo}>
              <Text className={styles.userAnswer}>你的答案: {record.userAnswer || '未作答'}</Text>
              <Text className={styles.correctAnswer}>正确答案: {question.questionId}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

export default ReviewPage;
