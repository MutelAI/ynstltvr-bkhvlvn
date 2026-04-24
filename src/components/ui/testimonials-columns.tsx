/**
 * TestimonialsColumns — infinite vertical scrolling testimonial columns
 * Popular: 470 stars on 21st.dev/community
 * Source: https://21st.dev/community/components/efferd/testimonials-columns-1/default
 * Adapted: removed "use client", uses motion/react (already compatible)
 *
 * Usage:
 *   const col1 = testimonials.slice(0, 3).map(r => ({
 *     text: r.text_he,
 *     name: r.author,
 *     role: 'לקוח מרוצה',
 *   }));
 *   <TestimonialsColumns columns={[col1, col2, col3]} />
 *
 * Each item shape: { text: string; name: string; role: string; image?: string }
 */
import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface TestimonialItem {
  text: string;
  name: string;
  role: string;
  image?: string;
  rating?: number;
}

interface TestimonialsColumnProps {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}

export const TestimonialsColumn = ({
  className,
  testimonials,
  duration = 15,
}: TestimonialsColumnProps) => {
  return (
    <div className={cn('overflow-hidden', className)}>
      <motion.div
        animate={{ translateY: '-50%' }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[...Array(2)].map((_, repeatIdx) => (
          <React.Fragment key={repeatIdx}>
            {testimonials.map(({ text, image, name, role, rating }, i) => (
              <div
                key={`${repeatIdx}-${i}`}
                className="p-6 rounded-3xl border border-gray-200 shadow-lg shadow-blue-100/30 max-w-xs w-full bg-white"
              >
                {rating !== undefined && (
                  <div className="text-yellow-400 text-sm mb-2">
                    {'★'.repeat(Math.round(rating))}
                    {'☆'.repeat(5 - Math.round(rating))}
                  </div>
                )}
                <p className="text-gray-700 text-sm leading-relaxed">{text}</p>
                <div className="flex items-center gap-3 mt-4">
                  {image ? (
                    <img
                      width={36}
                      height={36}
                      src={image}
                      alt={name}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                      {name.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div className="font-semibold text-gray-900 text-sm leading-5">{name}</div>
                    <div className="text-xs text-gray-500 leading-5">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};

interface TestimonialsColumnsProps {
  /** 2–4 arrays of testimonial items, one per column */
  columns: TestimonialItem[][];
  /** Base duration in seconds — each column gets a slightly different speed */
  baseDuration?: number;
  className?: string;
}

/**
 * Renders 2–4 auto-scrolling testimonial columns side by side.
 */
export const TestimonialsColumns = ({
  columns,
  baseDuration = 15,
  className,
}: TestimonialsColumnsProps) => {
  const durations = [baseDuration, baseDuration * 1.3, baseDuration * 1.1, baseDuration * 0.9];

  return (
    <div
      className={cn(
        'flex gap-6 items-start max-h-[600px]',
        className,
      )}
    >
      {columns.map((col, idx) => (
        <TestimonialsColumn
          key={idx}
          testimonials={col}
          duration={durations[idx] ?? baseDuration}
          className="flex-1"
        />
      ))}
    </div>
  );
};
