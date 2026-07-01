// 答题页 (分包)
import React, { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import styles from './index.module.scss';
import { useQuizStore } from '../../../../store/quizStore';
import { useMistakesStore } from '../../../../store/mistakesStore';
import QuestionCard from '../../../../components/QuestionCard';
import ProgressDots from '../../../../components/ProgressDots';
import TimerDisplay from '../../../../components/TimerDisplay';
// 题库数据只在分包中引用，不会被打包进主包 common.js
import { sampleQuestions } from '../../../../data/questions';

const QuizPage: React.FC = () => {
  const {
    currentSession,
    nextQuestion,
    prevQuestion,
    saveAnswer,
    submitQuiz,
    reviewMode,
    exitReview,
    loadQuestions,
    allQuestions,
  } = useQuizStore();
  const { addMistake, removeMistake } = useMistakesStore();

  const [submitting, setSubmitting] = useState(false);

  // 分包页面加载时注入题库数据到 store，然后再根据 URL 参数决定是否开始新测试
  // 关键：用 useQuizStore.getState() 访问 store，避免 React 闭包捕获旧值
  useLoad((options) => {
    const store = useQuizStore.getState();

    // 步骤1：注入题库（只注入一次）
    if (store.allQuestions.length === 0) {
      store.loadQuestions(sampleQuestions);
    }

    // 步骤2：根据 URL 参数决定行为
    // action=start：来自首页"开始测试"，题库注入后立即开始新测试
    // 无参数：来自错题复习（session 已由 startMistakesReview 提前设置）或复习模式
    if (options.action === 'start') {
      useQuizStore.getState().startQuiz();
    }
  });


  // 计算错误和正确题目索引（session 复习模式用）
  const wrongIndices = currentSession && reviewMode === 'session'
    ? currentSession.questions
        .map((q, i) => currentSession.answers[i] !== q.answer ? i : -1)
        .filter(i => i !== -1)
    : [];
  
  const correctIndices = currentSession && reviewMode === 'session'
    ? currentSession.questions
        .map((q, i) => currentSession.answers[i] === q.answer ? i : -1)
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

      // 处理错题本
      if (reviewMode === 'mistakes') {
        // 错题复习模式：答对的从错题本移除，答错的保留
        currentSession.questions.forEach((question, index) => {
          const userAnswer = currentSession.answers[index];
          if (userAnswer === question.answer) {
            console.log('[submit] 答对移除错题:', question.id);
            removeMistake(question.id);
          } else {
            console.log('[submit] 答错更新错题:', question.id, '用户答案:', userAnswer);
            addMistake(question, userAnswer);
          }
        });
      } else {
        // 正常答题模式：答错的加入错题本
        currentSession.questions.forEach((question, index) => {
          const userAnswer = currentSession.answers[index];
          if (userAnswer !== question.answer) {
            console.log('[submit] 添加错题:', question.id, '用户答案:', userAnswer);
            addMistake(question, userAnswer);
          }
        });
      }
      console.log('[submit] 错题处理完成');

      Taro.hideLoading();
      Taro.navigateTo({
        url: '/subpackages/exam/pages/result/index'
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

  // session 复习模式下一题或结束
  const handleNextOrFinish = () => {
    if (currentSession.currentIndex >= currentSession.questions.length - 1) {
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
            {reviewMode === 'session'
              ? `${currentSession.currentIndex + 1} / ${currentSession.questions.length} 题`
              : `${answeredCount} / ${currentSession.questions.length} 已作答`
            }
          </Text>
          {reviewMode !== 'session' && <TimerDisplay startTime={currentSession.startTime} />}
        </View>
        <ProgressDots
          currentIndex={currentSession.currentIndex}
          total={currentSession.questions.length}
          answered={currentSession.answers.map(a => a !== null)}
          wrongIndices={reviewMode === 'session' ? wrongIndices : undefined}
          correctIndices={reviewMode === 'session' ? correctIndices : undefined}
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
        isReview={reviewMode === 'session'} // 只有 session 复习模式才显示答案
      />

      {/* 导航按钮 */}
      <View className={styles.navButtons}>
        {currentSession.currentIndex !== 0 && (
          <Button
            className={styles.navButton}
            onClick={reviewMode === 'session' ? prevQuestion : prevQuestion}
          >
            ← 上一题
          </Button>
        )}
        <View className={styles.navSpacer} />
        {reviewMode === 'session' ? (
          <Button className={styles.navButtonPrimary} onClick={handleNextOrFinish}>
            {isLastQuestion ? '返回成绩' : '下一题 →'}
          </Button>
        ) : isLastQuestion ? (
          <Button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={submitting}
            type="primary"
          >
            {submitting ? '提交中...' : '提交答案'}
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
