/**
 * ServiceIcon — renders a Lucide SVG icon by name.
 *
 * The `icon` field in business JSON holds a Lucide icon name (e.g. "Wrench").
 * Legacy emoji values (e.g. "🔧") are mapped to the closest Lucide icon via
 * EMOJI_FALLBACK so old data keeps working without a migration.
 *
 * All icons in ICON_MAP are statically imported — no dynamic require needed.
 */
import {
  // ── General tools & repair ───────────────────────────────────────────────
  Wrench, Hammer, Drill, Settings, Settings2, Cog, Ruler,
  // ── Water & plumbing ─────────────────────────────────────────────────────
  Droplets, Droplet, Waves, ShowerHead, Bath, Toilet, Wind,
  // ── Electrical & energy ──────────────────────────────────────────────────
  Zap, Plug, Lightbulb, BatteryCharging, CircuitBoard, Power,
  // ── Home & construction ──────────────────────────────────────────────────
  Home, HardHat, Layers, PaintbrushVertical, Paintbrush, Fence,
  DoorClosed, DoorOpen,
  // ── HVAC & climate ───────────────────────────────────────────────────────
  Thermometer, Snowflake, Sun, Flame, Heater,
  // ── Security & access ────────────────────────────────────────────────────
  Lock, LockOpen, Shield, ShieldCheck, Key, Camera,
  // ── Automotive ───────────────────────────────────────────────────────────
  Car, CarFront, Fuel,
  // ── Cleaning & garden ────────────────────────────────────────────────────
  Sparkles, Leaf, Scissors, Trash2,
  // ── Business / misc ──────────────────────────────────────────────────────
  Phone, MapPin, Star, Clock, Truck, Package, CheckCircle, ClipboardList,
  Briefcase, Users, Award, BadgeCheck,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

// ── Icon registry ────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  // tools & repair
  Wrench, Hammer, Drill, Settings, Settings2, Cog, Ruler,
  // water & plumbing
  Droplets, Droplet, Waves, ShowerHead, Bath, Toilet, Wind,
  // electrical
  Zap, Plug, Lightbulb, BatteryCharging, CircuitBoard, Power,
  // home & construction
  Home, HardHat, Layers, PaintbrushVertical, Paintbrush, Fence,
  DoorClosed, DoorOpen,
  // HVAC & climate
  Thermometer, Snowflake, Sun, Flame, Heater,
  // security & access
  Lock, LockOpen, Shield, ShieldCheck, Key, Camera,
  // automotive
  Car, CarFront, Fuel,
  // cleaning & garden
  Sparkles, Leaf, Scissors, Trash2,
  // business / misc
  Phone, MapPin, Star, Clock, Truck, Package, CheckCircle, ClipboardList,
  Briefcase, Users, Award, BadgeCheck,
};

// ── Emoji → Lucide name fallback (for legacy JSON values) ───────────────────

const EMOJI_FALLBACK: Record<string, string> = {
  // tools
  '🔧': 'Wrench', '🔨': 'Hammer', '🪛': 'Screwdriver', '🪚': 'Drill',
  '⚙️': 'Settings', '⚙': 'Settings', '🔩': 'Cog',
  // water
  '💧': 'Droplets', '🚰': 'Droplets', '🚿': 'Shower', '🛁': 'Bath',
  '🚽': 'Toilet', '🌊': 'Waves',
  // electrical
  '⚡': 'Zap', '🔌': 'Plug', '💡': 'Lightbulb', '🔋': 'BatteryCharging',
  // home & construction
  '🏠': 'Home', '🏗️': 'HardHat', '🏗': 'HardHat', '🎨': 'Paintbrush',
  '🪟': 'DoorClosed', '🚪': 'DoorOpen',
  // HVAC
  '❄️': 'Snowflake', '❄': 'Snowflake', '🌡️': 'Thermometer', '🌡': 'Thermometer',
  '♨️': 'Flame', '♨': 'Flame', '🔥': 'Flame', '☀️': 'Sun', '☀': 'Sun',
  // security
  '🔒': 'Lock', '🔓': 'LockOpen', '🛡️': 'Shield', '🛡': 'Shield',
  '🔑': 'Key', '🗝️': 'Key', '🗝': 'Key', '📷': 'Camera',
  // automotive
  '🚗': 'Car', '🚙': 'CarFront', '⛽': 'Fuel',
  // cleaning & garden
  '✨': 'Sparkles', '🌿': 'Leaf', '✂️': 'Scissors', '✂': 'Scissors',
  '🗑️': 'Trash2', '🗑': 'Trash2',
  // business / misc
  '📞': 'Phone', '📍': 'MapPin', '⭐': 'Star', '🌟': 'Star',
  '🕐': 'Clock', '🚚': 'Truck', '📦': 'Package', '✅': 'CheckCircle',
  '📋': 'ClipboardList', '💼': 'Briefcase', '👥': 'Users',
  '🏆': 'Award', '🎯': 'BadgeCheck', '🏢': 'Home',
};

// ── Component ────────────────────────────────────────────────────────────────

interface ServiceIconProps extends LucideProps {
  /** Lucide icon name (e.g. "Wrench") or legacy emoji (e.g. "🔧") */
  icon: string;
}

export default function ServiceIcon({ icon, ...props }: ServiceIconProps) {
  const name = EMOJI_FALLBACK[icon] ?? icon;
  const Icon = ICON_MAP[name];

  if (!Icon) {
    // Unknown value: render as plain text (emoji passthrough)
    return <span aria-hidden="true" style={{ fontSize: 'inherit' }}>{icon}</span>;
  }

  return <Icon {...props} />;
}
