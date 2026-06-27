// 题目卡片组件
import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { Question } from '../../types/question';

interface QuestionCardProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  userAnswer: string | null;
  onAnswer: (answer: string) => void;
  isReview?: boolean; // 是否在复习模式
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  userAnswer,
  onAnswer,
  isReview = false
}) => {
  const questionNumber = currentIndex + 1;
  const questionTypeText = {
    tf: '判断题',
    single: '单选题',
    multi: '多选题'
  }[question.type];

  // 判断题选项
  const tfOptions = [
    { key: 'T', text: '正确' },
    { key: 'F', text: '错误' }
  ];

  // 处理选项点击（复习模式下禁用）
  const handleOptionClick = (optionKey: string) => {
    if (isReview) return;
    if (question.type === 'multi') {
      const currentAnswers = userAnswer ? userAnswer.split(',') : [];
      const newAnswers = currentAnswers.includes(optionKey)
        ? currentAnswers.filter(a => a !== optionKey)
        : [...currentAnswers, optionKey].sort();
      onAnswer(newAnswers.join(','));
    } else {
      onAnswer(optionKey);
    }
  };

  // 判断选项是否被选中
  const isOptionSelected = (optionKey: string) => {
    if (question.type === 'multi') {
      return userAnswer ? userAnswer.split(',').includes(optionKey) : false;
    }
    return userAnswer === optionKey;
  };

  // 复习模式下判断选项的样式类
  const getReviewOptionClass = (optionKey: string) => {
    if (!isReview) return '';

    const correctKeys = question.type === 'multi'
      ? question.answer.split('')
      : [question.answer];
    const selectedKeys = question.type === 'multi'
      ? (userAnswer ? userAnswer.split(',') : [])
      : (userAnswer ? [userAnswer] : []);

    const isCorrectKey = correctKeys.includes(optionKey);
    const isSelected = selectedKeys.includes(optionKey);

    if (isCorrectKey && isSelected) return styles.optionCorrect;       // 正确且选中 → 绿色
    if (!isCorrectKey && isSelected) return styles.optionWrong;        // 错误且选中 → 红色
    if (isCorrectKey && !isSelected) return styles.optionMissed;       // 正确但未选中 → 黄色
    return '';
  };

  // 获取显示的选项
  const displayOptions = question.type === 'tf'
    ? tfOptions
    : question.options || [];

  // 判断答案是否正确
  const isAnswerCorrect = () => {
    if (userAnswer === null || userAnswer === undefined) return false;
    if (question.type === 'tf' || question.type === 'single') return userAnswer === question.answer;
    // multi
    const correct = question.answer.split('').sort().join('');
    const ua = userAnswer.split(',').sort().join('');
    return correct === ua;
  };

  const correct = isAnswerCorrect();

  // 格式化答案显示
  const formatAnswer = (answer: string | null) => {
    if (answer === null || answer === undefined) return '（未作答）';
    if (question.type === 'tf') return answer === 'T' ? '正确 ✓' : '错误 ✗';
    return answer;
  };

  return (
    <View className={styles.questionCard}>
      {/* 题目头部 */}
      <View className={styles.cardHeader}>
        <Text className={styles.questionNumber}>
          {isReview ? `第 ${questionNumber} 题 / 共 ${totalQuestions} 题` : `第 ${questionNumber} 题`}
        </Text>
        <Text className={styles.questionType}>{questionTypeText}</Text>
      </View>

      {/* 题目内容 */}
      <View className={styles.questionContent}>
        <Text className={styles.questionText}>{question.q}</Text>
      </View>

      {/* 选项列表 */}
      <View className={styles.optionsList}>
        {displayOptions.map((option) => (
          <Button
            key={option.key}
            className={classnames(
              styles.optionButton,
              isOptionSelected(option.key) && !isReview && styles.optionSelected,
              isReview && getReviewOptionClass(option.key)
            )}
            onClick={() => handleOptionClick(option.key)}
            disabled={isReview}
          >
            <Text className={styles.optionKey}>{option.key}</Text>
            <Text className={styles.optionText}>{option.text}</Text>
          </Button>
        ))}
      </View>

      {/* 复习模式：显示答案解析 */}
      {isReview && (
        <View className={styles.explanation}>
          <View className={styles.explanationLabel}>📋 答案解析</View>
          <View className={classnames(styles.explanationCorrect, correct ? styles.isCorrect : styles.isWrong)}>
            {correct ? '✅ 回答正确' : '❌ 回答错误'}
          </View>
          <View className={styles.answerCompare}>
            <Text className={styles.answerText}>
              正确答案：<Text className={styles.answerHighlight}>{formatAnswer(question.answer)}</Text>
            </Text>
            {!correct && (
              <Text className={styles.answerText}>
                你的答案：<Text className={styles.answerWrong}>{formatAnswer(userAnswer)}</Text>
              </Text>
            )}
          </View>
          <View className={styles.explanationDetail}>
            <Text className={styles.explanationDetailLabel}>💡 解析：</Text>
            <Text className={styles.explanationDetailText}>{question.explanation}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default QuestionCard;