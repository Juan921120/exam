// 计时器组件
import React, { useState, useEffect, useRef } from 'react';
import { View, Text } from '@tarojs/components';
import { useDidShow, useDidHide } from '@tarojs/taro';
import styles from './index.module.scss';

interface TimerDisplayProps {
  startTime: number;
  endTime?: number;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ startTime, endTime }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVisibleRef = useRef(true);

  const updateTimer = () => {
    if (isVisibleRef.current && !endTime) {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }
  };

  useEffect(() => {
    if (endTime) {
      setElapsedTime(Math.floor((endTime - startTime) / 1000));
    } else {
      updateTimer();
      intervalRef.current = setInterval(() => {
        updateTimer();
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [startTime, endTime]);

  useDidShow(() => {
    isVisibleRef.current = true;
    updateTimer();
  });

  useDidHide(() => {
    isVisibleRef.current = false;
  });

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View className={styles.timerDisplay}>
      <Text className={styles.timerIcon}>⏱</Text>
      <Text className={styles.timerText}>{formatTime(elapsedTime)}</Text>
    </View>
  );
};

export default TimerDisplay;