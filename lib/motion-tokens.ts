import type { Transition } from "framer-motion";

export const motionEase = [0.25, 0.1, 0.25, 1] as const;

export const motionDuration = {
  fast: 0.25,
  normal: 0.5,
  slow: 0.6,
} as const;

export const motionCssDuration = {
  fast: "duration-300",
  normal: "duration-500",
} as const;

const baseTransition = (duration: number, delay = 0): Transition => ({
  duration,
  ease: motionEase,
  delay,
});

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: baseTransition(motionDuration.fast),
} as const;

export const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: baseTransition(motionDuration.fast),
} as const;

export const fadeInUpMedium = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: baseTransition(motionDuration.normal),
} as const;

export const pageEnter = fadeInUp;

export const stepEnter = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: baseTransition(motionDuration.normal),
} as const;

export function staggerTransition(index: number, step = 0.1): Transition {
  return baseTransition(motionDuration.fast, index * step);
}
