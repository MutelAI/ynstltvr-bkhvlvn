/**
 * FloatingActionMenu — expandable FAB with animated option buttons
 * Popular: 106 stars on 21st.dev/community
 * Source: https://21st.dev/community/components/chetanverma16/floating-action-menu/default
 * Adapted: removed "use client", replaced framer-motion with motion/react
 *
 * Usage:
 *   <FloatingActionMenu
 *     options={[
 *       { label: 'Call', onClick: () => {}, Icon: <PhoneIcon /> },
 *       { label: 'WhatsApp', onClick: () => {}, Icon: <MessageIcon /> },
 *     ]}
 *   />
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export type FloatingActionMenuOption = {
  label: string;
  onClick: () => void;
  Icon?: React.ReactNode;
};

interface FloatingActionMenuProps {
  options: FloatingActionMenuOption[];
  className?: string;
  /** Custom trigger button content. Defaults to a "+" icon */
  triggerIcon?: React.ReactNode;
  triggerClassName?: string;
}

export const FloatingActionMenu = ({
  options,
  className,
  triggerIcon,
  triggerClassName,
}: FloatingActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn('fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2', className)}>
      {/* Option buttons */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10, y: 10, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 10, y: 10, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
            className="flex flex-col items-end gap-2 mb-2"
          >
            {options.map((option, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                onClick={() => {
                  option.onClick();
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 bg-gray-900/85 hover:bg-gray-900 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-xl transition-colors"
              >
                {option.Icon}
                <span>{option.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          'w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-2xl transition-colors',
          triggerClassName,
        )}
        aria-label="Menu"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut', type: 'spring', stiffness: 300, damping: 20 }}
        >
          {triggerIcon ?? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          )}
        </motion.div>
      </button>
    </div>
  );
};
