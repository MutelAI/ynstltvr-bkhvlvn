import type { Photo } from '@/types';

/**
 * Picks the best photo for hero display.
 * Parses Google Maps thumb URL dimensions (=wW-hH) and prefers landscape
 * ratio closest to 1.4 (4:3 / 3:2) — looks best in a wide centred card.
 * Falls back to first photo if no dimensions can be parsed.
 */
export function pickHeroPhoto(photos: Photo[]): Photo | null {
  if (!photos.length) return null;
  const dimRe = /=w(\d+)-h(\d+)/;
  const scored = photos.map(p => {
    const m = dimRe.exec(p.thumb || p.url);
    const ratio = m ? parseInt(m[1]) / parseInt(m[2]) : 1;
    return { p, score: -Math.abs(ratio - 1.4) };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].p;
}
