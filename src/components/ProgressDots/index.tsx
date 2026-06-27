// 进度点组件
import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface ProgressDotsProps {
  currentIndex: number;
  total: number;
  answered: boolean[];
  onDotClick?: (index: number) => void;
}

const ProgressDots: React.FC<ProgressDotsProps> = ({
  currentIndex,
  total,
  answered,
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
            answered[index] && styles.dotAnswered
          )}
          onClick={() => onDotClick && onDotClick(index)}
        >
          <Text className={styles.dotNumber}>{index + 1}</Text>
        </View>
      ))}
    </View>
  );
};

export default ProgressDots;