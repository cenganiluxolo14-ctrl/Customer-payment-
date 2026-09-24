import React, { useState } from 'react';
import { X, Send, Copy, Check, BellRing } from 'lucide-react';
import { BusinessProfile, Invoice } from '../types';
import {
  copyToClipboard,
  formatZAR,
  generateReminderWhatsAppText,
  openWhatsApp,
} from '../utils/whatsapp';

interface DebtReminderModalProps {
  invoice: Invoice | null;
  profile: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
  onRecordReminder: (invoiceId: string) => void;
}

export const DebtReminderModal: React.FC<DebtReminderModalProps> = ({
  invoice,
  profile,
  isOpen,
  onClose,
  onRecordReminder,
}) => {
  const [tone, setTone] = useState<'polite' | 'standard' | 'firm'>('polite');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !invoice) return null;

  const reminderMessage = generateReminderWhatsAppText(invoice, profile, tone);

  const handleCopy = async () => {
    const success = await copyToClipboard(reminderMessage);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendWhatsApp = () => {
    onRecordReminder(invoice.id);
    openWhatsApp(invoice.clientPhone, reminderMessage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-white">Send Friendly Reminder</h2>
              <p className="text-xs text-neutral-400">
                To {invoice.clientName} · {formatZAR(invoice.price)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">
              Message Tone
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTone('polite')}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium text-center border transition-all ${
                  tone === 'polite'
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-semibold'
                    : 'bg-neutral-800/60 border-neutral-700/50 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                🙏 Polite & Warm
              </button>
              <button
                type="button"
                onClick={() => setTone('standard')}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium text-center border transition-all ${
                  tone === 'standard'
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-semibold'
                    : 'bg-neutral-800/60 border-neutral-700/50 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                🧾 Standard
              </button>
              <button
                type="button"
                onClick={() => setTone('firm')}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium text-center border transition-all ${
                  tone === 'firm'
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-semibold'
                    : 'bg-neutral-800/60 border-neutral-700/50 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                ⚡ Firm Follow-up
              </button>
            </div>
          </div>

          {/* Preview of pre-written WhatsApp message */}
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
              <span>WhatsApp Message Preview</span>
              {invoice.reminderCount > 0 && (
                <span className="text-[11px] text-amber-400">
                  Reminded {invoice.reminderCount}x already
                </span>
              )}
            </div>
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs text-neutral-200 font-sans whitespace-pre-wrap leading-relaxed select-text">
              {reminderMessage}
            </div>
          </div>

          {/* Client contact info */}
          <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
            <span>Client WhatsApp:</span>
            <span className="font-mono text-neutral-200 font-medium">
              {invoice.clientPhone || 'No phone set (shares to WhatsApp app)'}
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="py-2.5 px-3 rounded-xl border border-neutral-700 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-neutral-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
