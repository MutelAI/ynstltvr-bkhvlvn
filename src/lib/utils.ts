/**
 * Lightweight class name utility — joins truthy strings.
 * Drop-in replacement for cn/clsx for components from 21st.dev.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
