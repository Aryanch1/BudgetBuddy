import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { money, money0 } from '../lib/coach';
import { palette, type } from '../lib/theme';

const SIZE = 232;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

/**
 * Data hero: the budget ring. Spent today vs the daily budget, with the
 * big bold spent number in the centre. The arc springs to its value on
 * every change; violet while on budget, red once the day is over budget,
 * lime while under half the budget.
 */
export function BudgetRing({
  spent,
  budget,
}: {
  spent: number;
  budget: number;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withSpring(Math.min(1, budget > 0 ? spent / budget : 0), {
      damping: 16,
      stiffness: 120,
    });
  }, [spent, budget, progress]);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRC * (1 - progress.value),
  }));
  const over = spent > budget;
  const underHalf = spent <= budget / 2;
  const arcColor = over ? palette.over : underHalf ? palette.accentDeep : palette.primary;
  const remaining = budget - spent;

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={palette.primarySoft}
          strokeWidth={STROKE}
          fill="none"
        />
        <AnimatedCircle
          animatedProps={animatedProps}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={arcColor}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${CIRC} ${CIRC}`}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.spent}>{money(spent)}</Text>
        <Text style={styles.of}>of {money0(budget)} today</Text>
        <Text style={[styles.remaining, { color: over ? palette.over : palette.accentDeep }]}>
          {over ? `${money(-remaining)} over budget` : `${money(remaining)} left`}
        </Text>
      </View>
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    alignSelf: 'center',
    height: SIZE,
    justifyContent: 'center',
    width: SIZE,
  },
  svg: { position: 'absolute' },
  center: { alignItems: 'center', maxWidth: SIZE - 64 },
  spent: { color: palette.ink, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 44, lineHeight: 48 },
  of: { ...type.body, color: palette.body, marginTop: 2 },
  remaining: { ...type.bodyStrong, marginTop: 6, textAlign: 'center' },
});
