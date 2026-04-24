/**
 * AnimatedTextCycle — cycles through words/phrases with a spring animation
 * Inspired by: https://21st.dev/community/components/tommyjepsen/animated-hero (824 stars)
 * and: https://21st.dev/community/components/thimows/animated-text-cycle (236 stars)
 * Adapted: removed framer-motion, uses motion/react
 *
 * Usage:
 *   <AnimatedTextCycle
 *     words={['מקצועי', 'מהיר', 'אמין', 'זול']}
 *     className="text-yellow-300 font-black"
 *   />
 *
 * Renders a single word that flips vertically on a timer.
 */
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface AnimatedTextCycleProps {
  words: string[];
  /** Milliseconds between word changes */
  interval?: number;
  className?: string;
  /** Height of the visible window. Defaults to 1.2em */
  height?: string;
}

export const AnimatedTextCycle = ({
  words,
  interval = 2000,
  className,
  height = '1.2em',
}: AnimatedTextCycleProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearTimeout(timer);
  }, [index, words.length, interval]);

  return (
    <span
      className={cn('relative inline-flex overflow-hidden', className)}
      style={{ height }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="absolute"
          initial={{ opacity: 0, y: -100 }}
          transition={{ type: 'spring', stiffness: 50 }}
          animate={
            index === i
              ? { y: 0, opacity: 1 }
              : { y: index > i ? -150 : 150, opacity: 0 }
          }
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};
