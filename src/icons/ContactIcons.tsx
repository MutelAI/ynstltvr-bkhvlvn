/**
 * ContactIcons — Professional phone & WhatsApp icons with per-site style variation.
 *
 * Each site deterministically gets one of 4 visual styles based on the business
 * name hash, so sites look distinctly different while each site is consistent.
 *
 * Usage:
 *   <PhoneIconAuto size={20} className="shrink-0" />
 *   <WhatsAppIconAuto size={20} className="shrink-0" />
 */
import { Phone, PhoneCall, PhoneIncoming } from 'lucide-react';
import { useBusiness } from '@/context/BusinessContext';

type IconProps = { className?: string; size?: number };

// ── Deterministic per-site style selector ───────────────────────────────────

function hashStr(s: string): number {
  return [...s].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) & 0xfffffff, 0);
}

export function useContactIconIndex(): number {
  const { business } = useBusiness();
  const seed = (business?.name ?? '') + (business?.phone ?? '');
  return hashStr(seed) % 4;
}

// ── Phone icon variants ──────────────────────────────────────────────────────

/** V0: Classic line handset */
const PhoneV0 = ({ className, size = 20 }: IconProps) => (
  <Phone size={size} className={className} aria-hidden="true" />
);

/** V1: Ringing — with two signal arcs */
const PhoneV1 = ({ className, size = 20 }: IconProps) => (
  <PhoneCall size={size} className={className} aria-hidden="true" />
);

/** V2: Incoming call — with inward arrow */
const PhoneV2 = ({ className, size = 20 }: IconProps) => (
  <PhoneIncoming size={size} className={className} aria-hidden="true" />
);

/** V3: Solid filled handset — Material-style */
const PhoneV3 = ({ className, size = 20 }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
  >
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
  </svg>
);

const PHONE_VARIANTS = [PhoneV0, PhoneV1, PhoneV2, PhoneV3] as const;

// ── WhatsApp icon variants ───────────────────────────────────────────────────

/** V0: Official WhatsApp bubble logo */
const WhatsAppV0 = ({ className, size = 20 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} className={className} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/** V1: Rounded-square app-icon style */
const WhatsAppV1 = ({ className, size = 20 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} className={className} aria-hidden="true">
    <rect x="1" y="1" width="22" height="22" rx="6" opacity="0.15" />
    <rect x="1" y="1" width="22" height="22" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9.2 8.4H8.3a.7.7 0 0 0-.7.75c.09.64.27 1.24.55 1.78a8.8 8.8 0 0 0 3.9 3.9c.54.28 1.14.46 1.78.55.43.06.75-.27.75-.7v-.9c0-.2-.13-.37-.32-.43l-1.06-.33a.35.35 0 0 0-.36.09l-.44.44a7.4 7.4 0 0 1-3.05-3.05l.44-.44c.1-.1.13-.27.09-.36l-.33-1.06a.43.43 0 0 0-.42-.24z" />
  </svg>
);

/** V2: Round bubble with phone receiver — outline+fill hybrid */
const WhatsAppV2 = ({ className, size = 20 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} className={className} aria-hidden="true">
    <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10a9.9 9.9 0 0 1-4.95-1.32L2 22l1.35-4.95A9.9 9.9 0 0 1 2 12z" opacity="0.12" />
    <path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10a9.9 9.9 0 0 1-4.95-1.32L2 22l1.35-4.95A9.9 9.9 0 0 1 2 12z" />
    <path d="M9.2 8.4H8.3a.7.7 0 0 0-.7.75c.09.64.27 1.24.55 1.78a8.8 8.8 0 0 0 3.9 3.9c.54.28 1.14.46 1.78.55.43.06.75-.27.75-.7v-.9c0-.2-.13-.37-.32-.43l-1.06-.33a.35.35 0 0 0-.36.09l-.44.44a7.4 7.4 0 0 1-3.05-3.05l.44-.44c.1-.1.13-.27.09-.36l-.33-1.06a.43.43 0 0 0-.42-.24z" />
  </svg>
);

/** V3: Speech-bubble (chat) shape + phone receiver */
const WhatsAppV3 = ({ className, size = 20 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} className={className} aria-hidden="true">
    <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" opacity="0.12" />
    <path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
    <path d="M9.2 7.4H8.3a.7.7 0 0 0-.7.75c.09.64.27 1.24.55 1.78a8.8 8.8 0 0 0 3.9 3.9c.54.28 1.14.46 1.78.55.43.06.75-.27.75-.7v-.9c0-.2-.13-.37-.32-.43l-1.06-.33a.35.35 0 0 0-.36.09l-.44.44a7.4 7.4 0 0 1-3.05-3.05l.44-.44c.1-.1.13-.27.09-.36l-.33-1.06a.43.43 0 0 0-.42-.24z" />
  </svg>
);

const WA_VARIANTS = [WhatsAppV0, WhatsAppV1, WhatsAppV2, WhatsAppV3] as const;

// ── Auto-picking exported components ────────────────────────────────────────

export function PhoneIconAuto({ className, size = 20 }: IconProps) {
  const idx = useContactIconIndex();
  const Icon = PHONE_VARIANTS[idx];
  return <Icon className={className} size={size} />;
}

export function WhatsAppIconAuto({ className, size = 20 }: IconProps) {
  const idx = useContactIconIndex();
  const Icon = WA_VARIANTS[idx];
  return <Icon className={className} size={size} />;
}
