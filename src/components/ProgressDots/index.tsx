// 进度点组件
import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface ProgressDotsProps {
  currentIndex: number;
  total: number;
  answered: boolean[];
  wrongIndices?: number[]; // 复习模式下错误题目索引
  correctIndices?: number[]; // 复习模式下正确题目索引
  onDotClick?: (index: number) => void;
}

const ProgressDots: React.FC<ProgressDotsProps> = ({
  currentIndex,
  total,
  answered,
  wrongIndices = [],
  correctIndices = [],
  onDotClick
}) => {
  return (
    <View className={styles.progressDots}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          className={classnames(
            styles.dot,
            index === currentIndex && styles.dotCurrent,
            answered[index] && styles.dotAnswered,
            wrongIndices.includes(index) && styles.dotWrong,
            correctIndices.includes(index) && styles.dotCorrect
          )}
          onClick={() => onDotClick && onDotClick(index)}
        >
          <Text className={classnames(
            styles.dotNumber,
            wrongIndices.includes(index) && styles.dotNumberWrong,
            correctIndices.includes(index) && styles.dotNumberCorrect
          )}>{index + 1}</Text>
        </View>
      ))}
    </View>
  );
};

export default ProgressDots;