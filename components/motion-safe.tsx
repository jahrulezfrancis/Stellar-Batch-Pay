"use client";

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";
import type { ElementType } from "react";

type MotionSafeProps = HTMLMotionProps<"div"> & {
  as?: keyof typeof motion;
};

export function MotionSafe({
  as,
  children,
  ...props
}: MotionSafeProps) {
  const reduceMotion = useReducedMotion();
  const tag = as ?? "div";

  if (reduceMotion) {
    const {
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      whileInView: _whileInView,
      whileHover: _whileHover,
      whileTap: _whileTap,
      viewport: _viewport,
      variants: _variants,
      ...rest
    } = props;
    const StaticTag = tag as ElementType;
    return <StaticTag {...rest}>{children}</StaticTag>;
  }

  const MotionComponent = motion[tag] as ElementType;
  return <MotionComponent {...props}>{children}</MotionComponent>;
}
