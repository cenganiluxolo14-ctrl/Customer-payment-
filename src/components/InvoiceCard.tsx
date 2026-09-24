import React from 'react';
import { Share2, BellRing, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { BusinessProfile, Invoice } from '../types';
import { formatZAR, generateInvoiceWhatsAppText, openWhatsApp } from '../utils/whatsapp';

interface InvoiceCardProps {
  invoice: Invoice;
  profile: BusinessProfile;
  onSelect: (invoice: Invoice) => void;
  onToggleStatus: (invoiceId: string) => void;
  onOpenReminder: (invoice: Invoice) => void;
  onOpenStatusCard: (invoice: Invoice) => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  profile,
  onSelect,
  onToggleStatus,
  onOpenReminder,
  onOpenStatusCard,
}) => {
  const isPaid = invoice.status === 'paid';

  const handleQuickWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = generateInvoiceWhatsAppText(invoice, profile);
    openWhatsApp(invoice.clientPhone, msg);
  };

  const handleQuickRemind = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenReminder(invoice);
  };

  const handleQuickToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleStatus(invoice.id);
  };

  return (
    <div
      onClick={() => onSelect(invoice)}
      className="group bg-neutral-900/90 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700/80 rounded-xl p-4 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Client & Item Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display font-bold text-base text-white truncate">
              {invoice.clientName}
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                isPaid
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isPaid ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>PAID</span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3" />
                  <span>PENDING</span>
                </>
              )}
            </span>
          </div>

          <p className="text-xs text-neutral-300 font-medium line-clamp-1 mb-2">
            {invoice.item}
          </p>

          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <span className="font-mono">#{invoice.id}</span>
            <span aria-hidden="true">·</span>
            <span>
              {new Date(invoice.createdAt).toLocaleDateString('en-ZA', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
            {invoice.clientPhone && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{invoice.clientPhone}</span>
              </>
            )}
            {invoice.reminderCount > 0 && !isPaid && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-400 font-medium">
                  Reminded {invoice.reminderCount}x
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Big Price & Quick Chevron */}
        <div className="text-right shrink-0">
          <div className="font-mono font-bold text-lg sm:text-xl tabular-nums text-white">
            {formatZAR(invoice.price)}
          </div>
          <button
            type="button"
            onClick={handleQuickToggle}
            className="text-[11px] text-neutral-400 hover:text-emerald-400 transition-colors mt-0.5 block ml-auto"
          >
            {isPaid ? 'Mark Unpaid' : 'Mark Paid ✅'}
          </button>
        </div>
      </div>

      {/* Hairline Divider & Thumb Action Row */}
      <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleQuickWhatsApp}
            className="min-h-[36px] px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Send Slip</span>
          </button>

          {!isPaid && (
            <button
              type="button"
              onClick={handleQuickRemind}
              className="min-h-[36px] px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Remind</span>
            </button>
          )}
        </div>

        <div className="flex items-center text-xs text-neutral-400 group-hover:text-white transition-colors">
          <span>View</span>
          <ChevronRight className="w-4 h-4 ml-0.5" />
        </div>
      </div>
    </div>
  );
};
