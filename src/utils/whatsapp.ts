import { BusinessProfile, Invoice } from '../types';

export function formatZAR(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function cleanPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '27' + cleaned.slice(1);
  } else if (!cleaned.startsWith('27') && cleaned.length === 9) {
    cleaned = '27' + cleaned;
  }
  return cleaned;
}

export function generateInvoiceWhatsAppText(invoice: Invoice, profile: BusinessProfile): string {
  const isPaid = invoice.status === 'paid';
  const header = isPaid ? '🧾 *OFFICIAL RECEIPT (PAID)*' : '🧾 *INVOICE*';
  
  let paymentDetails = '';
  if (profile.paymentType === 'payshap' && profile.payshapId) {
    paymentDetails = `⚡ *PayShap ID / Cell:* ${profile.payshapId}\n🏦 *Bank:* ${profile.bankName}\n👤 *Acc Name:* ${profile.accountHolder || profile.businessName}`;
  } else {
    paymentDetails = `🏦 *Bank:* ${profile.bankName}\n💳 *Account:* ${profile.accountNumber}\n🏷️ *Branch:* ${profile.branchCode}\n👤 *Name:* ${profile.accountHolder || profile.businessName}`;
  }

  const message = [
    `${header}`,
    `*${profile.businessName.toUpperCase()}*`,
    profile.location ? `📍 ${profile.location}` : '',
    `━━━━━━━━━━━━━━━━━━━━`,
    `Invoice: *#${invoice.id}*`,
    `Date: ${new Date(invoice.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    `Client: *${invoice.clientName}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📦 *Item / Service:*`,
    `${invoice.item}`,
    `\n💰 *Total ${isPaid ? 'Paid' : 'Due'}:* *${formatZAR(invoice.price)}*`,
    invoice.notes ? `📝 _${invoice.notes}_` : '',
    `━━━━━━━━━━━━━━━━━━━━`,
    isPaid
      ? `✅ *Status:* PAID IN FULL\n🙏 Thank you for your support!`
      : `💳 *HOW TO PAY:*\n${paymentDetails}\n🏷️ *Reference:* ${invoice.clientName.replace(/\s+/g, '') || invoice.id}\n\n🙏 Please reply with Proof of Payment once popped!`,
  ]
    .filter(Boolean)
    .join('\n');

  return message;
}

export function generateReminderWhatsAppText(
  invoice: Invoice,
  profile: BusinessProfile,
  tone: 'polite' | 'standard' | 'firm' = 'polite'
): string {
  const payshapLine = profile.payshapId
    ? `⚡ PayShap ID: ${profile.payshapId}`
    : `🏦 ${profile.bankName}: ${profile.accountNumber} (Ref: ${invoice.clientName})`;

  if (tone === 'polite') {
    return (
      `Hi ${invoice.clientName} 🙏 Just a quick friendly reminder for *${formatZAR(invoice.price)}* ` +
      `for *${invoice.item}* from *${profile.businessName}*.\n\n` +
      `Whenever you have a moment, here are the details:\n` +
      `${payshapLine}\n\n` +
      `Please let me know once popped. Much appreciated! ✨`
    );
  }

  if (tone === 'standard') {
    return (
      `Hello ${invoice.clientName},\n` +
      `This is a reminder regarding Invoice #${invoice.id} for *${formatZAR(invoice.price)}* (${invoice.item}).\n\n` +
      `Payment Details:\n` +
      `${payshapLine}\n` +
      `Reference: ${invoice.clientName}\n\n` +
      `Kindly send the Proof of Payment to confirm. Thank you, ${profile.businessName}.`
    );
  }

  // firm
  return (
    `Hi ${invoice.clientName}, following up on the outstanding balance of *${formatZAR(invoice.price)}* ` +
    `for ${invoice.item}.\n\n` +
    `Please settle via:\n${payshapLine}\nRef: ${invoice.clientName}\n\n` +
    `Thank you for settling this promptly.`
  );
}

export function openWhatsApp(phone: string | undefined, message: string): void {
  const encodedText = encodeURIComponent(message);
  let url = '';

  if (phone && phone.trim()) {
    const formatted = cleanPhone(phone);
    url = `https://wa.me/${formatted}?text=${encodedText}`;
  } else {
    // General share URL
    url = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy: ', err);
    return false;
  }
}
