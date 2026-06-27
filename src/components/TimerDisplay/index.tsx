// 计时器组件
import React, { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface TimerDisplayProps {
  startTime: number;
  endTime?: number;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ startTime, endTime }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (endTime) {
      // 已结束,显示总用时
      setElapsedTime(Math.floor((endTime - startTime) / 1000));
    } else {
      // 正在进行,实时更新
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [startTime, endTime]);

  // 格式化时间
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