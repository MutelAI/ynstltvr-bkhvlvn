/**
 * LimelightNav — navigation bar with a limelight highlight that tracks the active item
 * Popular: 137 stars on 21st.dev/community
 * Source: https://21st.dev/community/components/easemize/limelight-nav/default
 * Adapted: no external dependencies
 *
 * Usage:
 *   <LimelightNav
 *     items={[{ id: 'home', icon: <HomeIcon />, label: 'Home', onClick: () => scrollTo('hero') }]}
 *     defaultActiveIndex={0}
 *   />
 */
import React, { useState, useRef, useLayoutEffect, cloneElement } from 'react';

export type LimelightNavItem = {
  id: string | number;
  icon: React.ReactElement;
  label?: string;
  onClick?: () => void;
};

interface LimelightNavProps {
  items: LimelightNavItem[];
  defaultActiveIndex?: number;
  onTabChange?: (index: number) => void;
  className?: string;
  limelightClassName?: string;
  iconContainerClassName?: string;
  iconClassName?: string;
}

/**
 * Adaptive-width nav bar with a "limelight" spotlight effect on the active item.
 */
export const LimelightNav = ({
  items,
  defaultActiveIndex = 0,
  onTabChange,
  className,
  limelightClassName,
  iconContainerClassName,
  iconClassName,
}: LimelightNavProps) => {
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);
  const [isReady, setIsReady] = useState(false);
  const navItemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const limelightRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (items.length === 0) return;
    const limelight = limelightRef.current;
    const activeItem = navItemRefs.current[activeIndex];
    if (limelight && activeItem) {
      const newLeft = activeItem.offsetLeft + activeItem.offsetWidth / 2 - limelight.offsetWidth / 2;
      limelight.style.left = `${newLeft}px`;
      if (!isReady) setTimeout(() => setIsReady(true), 50);
    }
  }, [activeIndex, isReady, items]);

  if (items.length === 0) return null;

  const handleItemClick = (index: number, itemOnClick?: () => void) => {
    setActiveIndex(index);
    onTabChange?.(index);
    itemOnClick?.();
  };

  return (
    <nav
      className={`relative inline-flex items-center h-14 rounded-2xl bg-white/90 backdrop-blur-md text-gray-800 border border-gray-200 shadow-lg px-2 ${className ?? ''}`}
    >
      {items.map(({ id, icon, label, onClick }, index) => (
        <a
          key={id}
          ref={(el) => { navItemRefs.current[index] = el; }}
          className={`relative z-20 flex h-full cursor-pointer items-center justify-center px-4 ${iconContainerClassName ?? ''}`}
          onClick={() => handleItemClick(index, onClick)}
          aria-label={label}
          title={label}
        >
          {cloneElement(icon as React.ReactElement<{ className?: string }>, {
            className: `w-5 h-5 transition-opacity duration-100 ease-in-out ${
              activeIndex === index ? 'opacity-100 text-blue-600' : 'opacity-40'
            } ${(icon as React.ReactElement<{ className?: string }>).props.className ?? ''} ${iconClassName ?? ''}`,
          })}
        </a>
      ))}

      {/* The limelight spotlight */}
      <div
        ref={limelightRef}
        className={`absolute top-0 z-10 w-10 h-[4px] rounded-full bg-blue-600 shadow-[0_40px_12px_rgb(37,99,235)] ${
          isReady ? 'transition-[left] duration-400 ease-in-out' : ''
        } ${limelightClassName ?? ''}`}
        style={{ left: '-999px' }}
      >
        <div className="absolute left-[-30%] top-[4px] w-[160%] h-12 [clip-path:polygon(5%_100%,25%_0,75%_0,95%_100%)] bg-gradient-to-b from-blue-400/30 to-transparent pointer-events-none" />
      </div>
    </nav>
  );
};
