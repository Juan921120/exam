// 答题页
import React, { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useQuizStore } from '../../store/quizStore';
import { useMistakesStore } from '../../store/mistakesStore';
import QuestionCard from '../../components/QuestionCard';
import ProgressDots from '../../components/ProgressDots';
import TimerDisplay from '../../components/TimerDisplay';

const QuizPage: React.FC = () => {
  const {
    currentSession,
    nextQuestion,
    prevQuestion,
    saveAnswer,
    submitQuiz,
    reviewMode,
    exitReview
  } = useQuizStore();
  const { addMistake } = useMistakesStore();

  const isReview = reviewMode !== null;
  const [submitting, setSubmitting] = useState(false);

  // 计算错误题目索引（复习模式用）
  const wrongIndices = currentSession
    ? currentSession.questions
        .map((q, i) => currentSession.answers[i] !== q.answer ? i : -1)
        .filter(i => i !== -1)
    : [];

  if (!currentSession) {
    return (
      <View className={styles.quizPage}>
        <Text className={styles.errorText}>未找到测试会话</Text>
        <Button className={styles.backButton} onClick={() => Taro.navigateBack()}>
          返回首页
        </Button>
      </View>
    );
  }

  const currentQuestion = currentSession.questions[currentSession.currentIndex];
  const currentAnswer = currentSession.answers[currentSession.currentIndex];
  const answeredCount = currentSession.answers.filter(a => a !== null).length;

  // 提交测试
  const handleSubmit = () => {
    if (submitting) return;
    setSubmitting(true);
    Taro.showLoading({ title: '提交中...', mask: true });

    try {
      console.log('[submit] 开始提交...');
      submitQuiz();
      console.log('[submit] submitQuiz 完成');

      // 将错题添加到错题本（附带用户答案）
      currentSession.questions.forEach((question, index) => {
        const userAnswer = currentSession.answers[index];
        if (userAnswer !== question.answer) {
          console.log('[submit] 添加错题:', question.id, '用户答案:', userAnswer);
          addMistake(question, userAnswer);
        }
      });
      console.log('[submit] 错题处理完成');

      Taro.hideLoading();
      Taro.navigateTo({
        url: '/pages/result/index'
      });
    } catch (err) {
      console.error('[submit] 提交失败:', err);
      Taro.hideLoading();
      Taro.showToast({
        title: '提交失败: ' + (err instanceof Error ? err.message : String(err)),
        icon: 'none',
        duration: 4000
      });
      setSubmitting(false);
    }
  };

  // 复习模式：返回成绩页
  const handleBackFromReview = () => {
    exitReview();
    Taro.navigateBack();
  };

  // 下一题或结束复习
  const handleNextOrFinish = () => {
    if (isReview && currentSession.currentIndex >= currentSession.questions.length - 1) {
      handleBackFromReview();
    } else {
      nextQuestion();
    }
  };

  const isLastQuestion = currentSession.currentIndex >= currentSession.questions.length - 1;

  return (
    <View className={styles.quizPage}>
      {/* 进度区域 */}
      <View className={styles.progressCard}>
        <View className={styles.progressHeader}>
          <Text className={styles.progressText}>
            {isReview
              ? `${currentSession.currentIndex + 1} / ${currentSession.questions.length} 题`
              : `${answeredCount} / ${currentSession.questions.length} 已作答`
            }
          </Text>
          {!isReview && <TimerDisplay startTime={currentSession.startTime} />}
        </View>
        <ProgressDots
          currentIndex={currentSession.currentIndex}
          total={currentSession.questions.length}
          answered={currentSession.answers.map(a => a !== null)}
          wrongIndices={isReview ? wrongIndices : undefined}
          onDotClick={(index) => {
            useQuizStore.getState().goToQuestion(index);
          }}
        />
      </View>

      {/* 题目卡片 */}
      <QuestionCard
        question={currentQuestion}
        currentIndex={currentSession.currentIndex}
        totalQuestions={currentSession.questions.length}
        userAnswer={currentAnswer}
        onAnswer={(answer) => saveAnswer(answer)}
        isReview={isReview}
      />

      {/* 导航按钮 */}
      <View className={styles.navButtons}>
        <Button
          className={styles.navButton}
          onClick={isReview ? handleBackFromReview : prevQuestion}
          disabled={!isReview && currentSession.currentIndex === 0}
        >
          {isReview
            ? (reviewMode === 'session' ? '← 返回成绩' : '← 返回错题本')
            : '← 上一题'
          }
        </Button>
        <View className={styles.navSpacer} />
        {isReview ? (
          <Button className={styles.navButtonPrimary} onClick={handleNextOrFinish}>
            {isLastQuestion
              ? (reviewMode === 'session' ? '返回成绩' : '返回错题本')
              : '下一题 →'
            }
          </Button>
        ) : isLastQuestion ? (
          <Button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '提交中...' : '提交测试'}
          </Button>
        ) : (
          <Button className={styles.navButtonPrimary} onClick={nextQuestion}>
            下一题 →
          </Button>
        )}
      </View>
    </View>
  );
};

export default QuizPage;