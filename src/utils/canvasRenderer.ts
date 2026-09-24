import { BusinessProfile, Invoice } from '../types';
import { formatZAR } from './whatsapp';

export interface CanvasCardOptions {
  format: 'square' | 'story'; // square: 1080x1080, story: 1080x1920
}

export function drawInvoiceStatusCard(
  canvas: HTMLCanvasElement,
  invoice: Invoice,
  profile: BusinessProfile,
  format: 'square' | 'story' = 'square',
  loadedLogoImg?: HTMLImageElement | null
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = 1080;
  const height = format === 'square' ? 1080 : 1920;

  canvas.width = width;
  canvas.height = height;

  const isPaid = invoice.status === 'paid';
  const accentColor = profile.accentColor || '#10b981';

  // 1. Sleek Background (Dark Obsidian with subtle radial glow)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#090a0f');
  bgGrad.addColorStop(0.5, '#12141c');
  bgGrad.addColorStop(1, '#0b0c12');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle accent ambient glow at top right
  const glowGrad = ctx.createRadialGradient(width - 150, 150, 20, width - 150, 150, 450);
  glowGrad.addColorStop(0, `${accentColor}33`); // 20% opacity
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, width, height);

  // Outer border with subtle sheen
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#262938';
  roundRect(ctx, 40, 40, width - 80, height - 80, 48);
  ctx.stroke();

  // 2. Top Header Bar (Inside Container)
  const padX = 90;
  let cursorY = 130;

  // Small Pill-like Tag: "OFFICIAL INVOICE & RECEIPT"
  ctx.fillStyle = '#1e2230';
  roundRect(ctx, padX, cursorY, 260, 48, 24);
  ctx.fill();
  ctx.strokeStyle = '#32384e';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 20px "Space Grotesk", sans-serif';
  ctx.fillText('SEAL SLIP SA', padX + 28, cursorY + 31);

  // Invoice ID on right
  ctx.fillStyle = '#64748b';
  ctx.font = '600 22px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`#${invoice.id}`, width - padX, cursorY + 32);
  ctx.textAlign = 'left';

  cursorY += 90;

  // 3. Business Brand Card (With Uploaded Logo or Emoji Fallback)
  const avatarCenterX = padX + 44;
  const avatarCenterY = cursorY + 44;
  const avatarRadius = 44;

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (loadedLogoImg && loadedLogoImg.complete && loadedLogoImg.naturalWidth > 0) {
    // Draw uploaded logo clipped to circle
    ctx.drawImage(
      loadedLogoImg,
      avatarCenterX - avatarRadius,
      avatarCenterY - avatarRadius,
      avatarRadius * 2,
      avatarRadius * 2
    );
  } else {
    // Circle Avatar Fallback
    ctx.fillStyle = '#1e2333';
    ctx.fillRect(avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2);

    // Emoji or Logo Initial
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(profile.logoEmoji || '⚡', avatarCenterX, avatarCenterY + 14);
  }
  ctx.restore();

  // Border ring around avatar
  ctx.beginPath();
  ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Business Name & Location
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 42px "Space Grotesk", sans-serif';
  ctx.fillText(profile.businessName, padX + 110, cursorY + 40);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(profile.location || 'South Africa · WhatsApp Verified', padX + 110, cursorY + 74);

  cursorY += 130;

  // Hairline separator
  ctx.strokeStyle = '#232736';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padX, cursorY);
  ctx.lineTo(width - padX, cursorY);
  ctx.stroke();

  cursorY += 50;

  // 4. Main Hero: Total Amount Box
  const heroBoxHeight = 190;
  ctx.fillStyle = '#131622';
  roundRect(ctx, padX, cursorY, width - padX * 2, heroBoxHeight, 32);
  ctx.fill();
  ctx.strokeStyle = isPaid ? '#059669' : '#33384c';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Label: Total Amount / Total Paid
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(isPaid ? 'TOTAL PAID' : 'AMOUNT DUE (ZAR)', padX + 36, cursorY + 52);

  // Status Stamp / Badge inside Hero box
  const statusX = width - padX - 220;
  const statusY = cursorY + 30;
  ctx.fillStyle = isPaid ? '#064e3b' : '#3b2505';
  roundRect(ctx, statusX, statusY, 185, 46, 23);
  ctx.fill();
  ctx.strokeStyle = isPaid ? '#10b981' : '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = isPaid ? '#34d399' : '#fbbf24';
  ctx.font = '700 20px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isPaid ? 'PAID IN FULL' : 'PENDING', statusX + 92, statusY + 30);
  ctx.textAlign = 'left';

  // Big Bold Price
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 76px "Space Grotesk", monospace';
  ctx.fillText(formatZAR(invoice.price), padX + 36, cursorY + 144);

  cursorY += heroBoxHeight + 50;

  // 5. Item & Customer Breakdown Grid
  const detailsY = cursorY;
  
  // Left Column: Client
  ctx.fillStyle = '#64748b';
  ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('BILLED TO', padX, detailsY);

  ctx.fillStyle = '#f1f5f9';
  ctx.font = '700 32px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(invoice.clientName, padX, detailsY + 42);

  if (invoice.clientPhone) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 22px monospace';
    ctx.fillText(invoice.clientPhone, padX, detailsY + 76);
  }

  // Right Column: Date
  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748b';
  ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('DATE ISSUED', width - padX, detailsY);

  ctx.fillStyle = '#f1f5f9';
  ctx.font = '600 26px "Space Grotesk", sans-serif';
  ctx.fillText(new Date(invoice.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }), width - padX, detailsY + 42);
  ctx.textAlign = 'left';

  cursorY += 130;

  // Item Description Box
  ctx.fillStyle = '#161926';
  roundRect(ctx, padX, cursorY, width - padX * 2, 115, 24);
  ctx.fill();
  ctx.strokeStyle = '#262a3c';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('SERVICE / ITEM', padX + 30, cursorY + 38);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
  // Truncate if too long
  const truncatedItem = invoice.item.length > 46 ? invoice.item.slice(0, 44) + '...' : invoice.item;
  ctx.fillText(truncatedItem, padX + 30, cursorY + 80);

  cursorY += 150;

  // 6. Payment Method Section
  ctx.fillStyle = '#10131d';
  const payCardH = format === 'story' ? 240 : 180;
  roundRect(ctx, padX, cursorY, width - padX * 2, payCardH, 24);
  ctx.fill();
  ctx.strokeStyle = '#222738';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.font = '700 22px "Space Grotesk", sans-serif';
  ctx.fillText('PAYMENT DETAILS', padX + 30, cursorY + 42);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 24px monospace';

  if (profile.paymentType === 'payshap' && profile.payshapId) {
    ctx.fillText(`⚡ PayShap ID: ${profile.payshapId}`, padX + 30, cursorY + 86);
    ctx.fillText(`🏦 Bank: ${profile.bankName}  ·  Acc: ${profile.accountHolder}`, padX + 30, cursorY + 126);
  } else {
    ctx.fillText(`🏦 ${profile.bankName}  ·  Acc: ${profile.accountNumber}`, padX + 30, cursorY + 86);
    ctx.fillText(`Branch: ${profile.branchCode}  ·  Holder: ${profile.accountHolder}`, padX + 30, cursorY + 126);
  }

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Reference: ${invoice.clientName.replace(/\s+/g, '') || invoice.id}`, padX + 30, cursorY + 162);

  // 7. Footer
  const footerY = height - 85;
  ctx.fillStyle = '#475569';
  ctx.font = '500 20px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Generated via Seal · WhatsApp-to-Invoice for SA Hustlers', width / 2, footerY);
}

// Helper to draw smooth rounded rectangles on canvas
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
