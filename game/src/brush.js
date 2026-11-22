// The Velvet Vault — the brush: small drawing helpers every painter shares.
//
// One file, one job: text with one call, rounded boxes, money and clock formatting. Nothing
// here knows what a guard or a room is.

export const SERIF = 'Georgia, "Times New Roman", serif';
export const SANS = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';

/** Draw one line of text. `align` is left, center or right; `weight` is a CSS font weight. */
export function label(ctx, text, x, y, { size = 14, color = '#eef2ff', align = 'left', font = SANS, weight = '600', alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Trace a rounded rectangle path (fill or stroke it afterwards). */
export function roundedRect(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/** A small filled tag with text in it, centred on (x, y): the labels over guards and loot. */
export function tag(ctx, text, x, y, { size = 11, color = '#0a1022', fill = '#eef2ff', alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `700 ${size}px ${SANS}`;
  const width = ctx.measureText(text).width + 10;
  roundedRect(ctx, x - width / 2, y - size / 2 - 3, width, size + 6, 4);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
  label(ctx, text, x, y + 0.5, { size, color, align: 'center', weight: '700', alpha });
}

/** $1,250 */
export function money(amount) {
  const whole = Math.round(amount);
  return `${whole < 0 ? '-' : ''}$${Math.abs(whole).toLocaleString('en-US')}`;
}

/** 1:07 */
export function clock(seconds) {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
