import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import './app.scss';
import { loadQuestions } from './data/questions';
import { useQuizStore } from './store/quizStore';

function App(props) {
  const loadQuestionsAction = useQuizStore(state => state.loadQuestions);

  useEffect(() => {
    loadQuestions().then(questions => {
      if (questions.length > 0) {
        loadQuestionsAction(questions);
      }
    });
  }, []);

  useDidShow(() => {});

  useDidHide(() => {});

  return props.children;
}

export default App;