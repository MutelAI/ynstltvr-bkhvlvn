export function buildWhatsappUrl(phone: string | undefined, message: string): string {
  const num = (phone ?? '').replace(/\D/g, '');
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}
