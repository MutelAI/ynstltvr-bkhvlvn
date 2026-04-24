/**
 * Aurora Background
 * Popular: 781 stars on 21st.dev/community
 * Source: https://21st.dev/community/components/aceternity/aurora-background/default
 * Adapted: removed "use client", replaced framer-motion with motion/react
 *
 * Usage:
 *   <AuroraBackground>
 *     <div>your content</div>
 *   </AuroraBackground>
 *
 * Requires the `animate-aurora` keyframe in styles.css (already added).
 */
import { cn } from '@/lib/utils';
import React, { type ReactNode } from 'react';

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        'relative flex flex-col h-[100vh] items-center justify-center bg-zinc-50 text-slate-950 transition-bg overflow-hidden',
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            [
              '[--white-gradient:repeating-linear-gradient(100deg,white_0%,white_7%,transparent_10%,transparent_12%,white_16%)]',
              '[--aurora:repeating-linear-gradient(100deg,#3b82f6_10%,#a5b4fc_15%,#93c5fd_20%,#ddd6fe_25%,#60a5fa_30%)]',
              '[background-image:var(--white-gradient),var(--aurora)]',
              '[background-size:300%,200%]',
              '[background-position:50%_50%,50%_50%]',
              'filter blur-[10px] invert',
              'after:content-[""] after:absolute after:inset-0',
              'after:[background-image:var(--white-gradient),var(--aurora)]',
              'after:[background-size:200%,100%]',
              'after:animate-aurora',
              'after:[background-attachment:fixed]',
              'after:mix-blend-difference',
              'pointer-events-none',
              'absolute -inset-[10px] opacity-50 will-change-transform',
            ].join(' '),
            showRadialGradient &&
              '[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]',
          )}
        />
      </div>
      {children}
    </div>
  );
};
