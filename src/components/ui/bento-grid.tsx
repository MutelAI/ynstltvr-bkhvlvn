/**
 * BentoGrid
 * Popular: 338 stars on 21st.dev/community
 * Source: https://21st.dev/community/components/kokonutd/bento-grid/default
 * Adapted: removed "use client", removed dark mode variants
 *
 * Usage:
 *   const items: BentoItem[] = [{ title, description, icon, status, tags, meta, colSpan }];
 *   <BentoGrid items={items} />
 */
import { cn } from '@/lib/utils';

export interface BentoItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  status?: string;
  tags?: string[];
  meta?: string;
  cta?: string;
  colSpan?: number;
  hasPersistentHover?: boolean;
}

interface BentoGridProps {
  items: BentoItem[];
  className?: string;
}

export function BentoGrid({ items, className }: BentoGridProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-3', className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            'group relative p-4 rounded-xl overflow-hidden transition-all duration-300',
            'border border-gray-100/80 bg-white',
            'hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
            'hover:-translate-y-0.5 will-change-transform',
            item.colSpan === 2 ? 'md:col-span-2' : 'col-span-1',
            item.hasPersistentHover && 'shadow-[0_2px_12px_rgba(0,0,0,0.03)] -translate-y-0.5',
          )}
        >
          {/* dot-grid overlay on hover */}
          <div
            className={cn(
              'absolute inset-0 transition-opacity duration-300',
              item.hasPersistentHover ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[length:4px_4px]" />
          </div>

          <div className="relative flex flex-col space-y-3">
            {/* Icon + status badge */}
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/5 group-hover:bg-gradient-to-br transition-all duration-300">
                {item.icon}
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-lg bg-black/5 text-gray-600 transition-colors duration-300 group-hover:bg-black/10">
                {item.status ?? 'Active'}
              </span>
            </div>

            {/* Title + description */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 tracking-tight text-[15px]">
                {item.title}
                {item.meta && (
                  <span className="ml-2 text-xs text-gray-500 font-normal">{item.meta}</span>
                )}
              </h3>
              <p className="text-sm text-gray-600 leading-snug font-[425]">{item.description}</p>
            </div>

            {/* Tags + CTA */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                {item.tags?.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-md bg-black/5 backdrop-blur-sm transition-all duration-200 hover:bg-black/10"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.cta ?? 'Explore →'}
              </span>
            </div>
          </div>

          {/* gradient border */}
          <div
            className={cn(
              'absolute inset-0 -z-10 rounded-xl p-px bg-gradient-to-br from-transparent via-gray-100/50 to-transparent transition-opacity duration-300',
              item.hasPersistentHover ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            )}
          />
        </div>
      ))}
    </div>
  );
}
