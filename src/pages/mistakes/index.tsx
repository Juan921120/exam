// 错题本页
import React from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useMistakesStore } from '../../store/mistakesStore';
import { useQuizStore } from '../../store/quizStore';

const MistakesPage: React.FC = () => {
  const { mistakeRecords, clearMistakes } = useMistakesStore();
  const { startMistakesReview } = useQuizStore();

  // 开始错题复习
  const handleStartReview = () => {
    if (mistakeRecords.length === 0) {
      return;
    }
    startMistakesReview(mistakeRecords);
    Taro.navigateTo({ url: '/pages/quiz/index' });
  };

  // 格式化用户答案
  const formatUserAnswer = (record: typeof mistakeRecords[0]) => {
    if (record.userAnswer === null || record.userAnswer === undefined) return '（未作答）';
    if (record.question.type === 'tf') return record.userAnswer === 'T' ? '正确 ✓' : '错误 ✗';
    return record.userAnswer;
  };

  // 格式化正确答案
  const formatCorrectAnswer = (question: typeof mistakeRecords[0]['question']) => {
    if (question.type === 'tf') return question.answer === 'T' ? '正确 ✓' : '错误 ✗';
    return question.answer;
  };

  // 从错题本移除
  const handleRemove = (questionId: number) => {
    useMistakesStore.getState().removeMistake(questionId);
  };

  return (
    <ScrollView className={styles.mistakesPage} scrollY>
      {/* 统计信息 */}
      <View className={styles.headerSection}>
        <Text className={styles.pageTitle}>错题本</Text>
        <Text className={styles.mistakesCount}>共 {mistakeRecords.length} 题</Text>
        {mistakeRecords.length > 0 && (
          <Button className={styles.reviewButton} onClick={handleStartReview}>
            📖 开始错题复习
          </Button>
        )}
      </View>

      {/* 错题列表 */}
      {mistakeRecords.length > 0 ? (
        <View className={styles.mistakesList}>
          {mistakeRecords.map((record) => (
            <View key={record.question.id} className={styles.mistakeCard}>
              <View className={styles.mistakeHeader}>
                <Text className={styles.mistakeType}>
                  {record.question.type === 'tf' ? '判断题' : record.question.type === 'single' ? '单选题' : '多选题'}
                </Text>
                <Text className={styles.mistakeId}>题目 #{record.question.id}</Text>
              </View>
              <Text className={styles.mistakeQuestion}>{record.question.q}</Text>

              {/* 答案信息 */}
              <View className={styles.answerInfo}>
                <Text className={styles.answerRow}>
                  你的答案：<Text className={styles.answerWrong}>{formatUserAnswer(record)}</Text>
                </Text>
                <Text className={styles.answerRow}>
                  正确答案：<Text className={styles.answerCorrect}>{formatCorrectAnswer(record.question)}</Text>
                </Text>
              </View>

              {/* 解析 */}
              {record.question.explanation && (
                <View className={styles.explanationSection}>
                  <Text className={styles.explanationLabel}>💡 解析：</Text>
                  <Text className={styles.explanationText}>{record.question.explanation}</Text>
                </View>
              )}

              <Button className={styles.removeButton} onClick={() => handleRemove(record.question.id)}>
                ✕ 移除
              </Button>
            </View>
          ))}
        </View>
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>✅</Text>
          <Text className={styles.emptyText}>错题本是空的</Text>
          <Text className={styles.emptyDesc}>完成测试后，答错的题目会自动收录</Text>
        </View>
      )}

      {/* 清空按钮 */}
      {mistakeRecords.length > 0 && (
        <View className={styles.actionSection}>
          <Button className={styles.clearButton} onClick={clearMistakes}>
            清空错题本
          </Button>
        </View>
      )}
    </ScrollView>
  );
};

export default MistakesPage;