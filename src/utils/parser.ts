import { ParsedWhatsAppMessage } from '../types';

/**
 * Intelligent parser for WhatsApp chat logs and informal sales messages.
 * Handles common South African sales phrases:
 * - "Invoice Thandi 200 braids"
 * - "Ayanda 450 lash refill + brows"
 * - "Thabo R1200 photoshoot 2hrs 0781234567"
 * - "R350 gel nails Khanya 0718889999"
 * - "Please invoice Siphokazi R500 sneaker deposit"
 */
export function parseWhatsAppText(rawInput: string): ParsedWhatsAppMessage {
  const clean = rawInput.trim();
  if (!clean) {
    return {
      clientName: '',
      item: '',
      price: 0,
      confidence: 0,
      rawText: rawInput,
    };
  }

  // 1. Extract South African Phone Number if present (0[678][0-9]{8} or +27[678][0-9]{8})
  let clientPhone: string | undefined = undefined;
  const phoneRegex = /(\+?27\s?[678][0-9](\s?[0-9]{3}){2}|0[678][0-9](\s?[0-9]{3}){2}|0[678][0-9]{8})/i;
  const phoneMatch = clean.match(phoneRegex);
  let textWithoutPhone = clean;
  if (phoneMatch) {
    clientPhone = phoneMatch[0].replace(/\s+/g, '');
    textWithoutPhone = clean.replace(phoneMatch[0], ' ').trim();
  }

  // 2. Extract Price (e.g. R450, R 450.00, 450, 1,200, 1200)
  let price = 0;
  let priceMatchString = '';
  // Look for "R" followed by digits, or standalone number usually >= 20
  const zarRegex = /(?:R\s?|ZAR\s?)([\d\s,]+(?:\.\d{1,2})?)/i;
  const zarMatch = textWithoutPhone.match(zarRegex);

  if (zarMatch) {
    priceMatchString = zarMatch[0];
    const numStr = zarMatch[1].replace(/[\s,]/g, '');
    price = parseFloat(numStr) || 0;
  } else {
    // Look for naked numbers, e.g. "Thandi 200 braids" or "Ayanda braids 450"
    const numberTokens = textWithoutPhone.match(/\b\d+(?:\.\d{2})?\b/g);
    if (numberTokens && numberTokens.length > 0) {
      // Pick the number most likely to be a price (not part of phone or tiny qty unless only number)
      const candidate = numberTokens[0];
      priceMatchString = candidate;
      price = parseFloat(candidate) || 0;
    }
  }

  let remainingText = textWithoutPhone;
  if (priceMatchString) {
    remainingText = remainingText.replace(priceMatchString, ' ').trim();
  }

  // 3. Remove conversational filler phrases
  remainingText = remainingText
    .replace(/^invoice\s+for\s+/i, '')
    .replace(/^invoice\s+/i, '')
    .replace(/^please\s+invoice\s+/i, '')
    .replace(/^make\s+invoice\s+for\s+/i, '')
    .replace(/^bill\s+/i, '')
    .replace(/^quote\s+/i, '')
    .trim();

  // 4. Extract Client Name & Item Description
  // Typically: "<Client Name> <Item>" or "<Client Name> - <Item>" or "<Item> for <Client>"
  let clientName = '';
  let item = '';

  const forMatch = remainingText.match(/(.+?)\s+for\s+(.+)/i);
  const dashMatch = remainingText.match(/(.+?)\s*[-:]\s*(.+)/);

  if (dashMatch) {
    clientName = dashMatch[1].trim();
    item = dashMatch[2].trim();
  } else if (forMatch) {
    // "Knotless braids for Thandi" -> item = Knotless braids, clientName = Thandi
    item = forMatch[1].trim();
    clientName = forMatch[2].trim();
  } else {
    const tokens = remainingText.split(/\s+/).filter(Boolean);
    if (tokens.length === 1) {
      clientName = tokens[0];
      item = 'Service / Goods';
    } else if (tokens.length >= 2) {
      // First 1 or 2 tokens might be name if capitalized or short
      if (tokens.length === 2) {
        clientName = tokens[0];
        item = tokens[1];
      } else {
        // e.g. "Thandi knotless box braids"
        clientName = tokens[0];
        item = tokens.slice(1).join(' ');
      }
    }
  }

  // Capitalize nicely
  if (clientName) {
    clientName = clientName.charAt(0).toUpperCase() + clientName.slice(1);
  }
  if (item) {
    item = item.charAt(0).toUpperCase() + item.slice(1);
  }

  let confidence = 0;
  if (clientName) confidence += 0.35;
  if (price > 0) confidence += 0.45;
  if (item && item !== 'Service / Goods') confidence += 0.2;

  return {
    clientName: clientName || 'Client',
    item: item || 'Custom Order',
    price,
    clientPhone,
    confidence,
    rawText: rawInput,
  };
}
