import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Printer,
  Smartphone,
  CheckCircle2,
  Clock,
  BellRing,
  QrCode,
  Building2,
  HardDrive,
  Cloud,
  CloudUpload,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { BusinessProfile, Invoice } from '../types';
import {
  copyToClipboard,
  formatZAR,
  generateInvoiceWhatsAppText,
  openWhatsApp,
} from '../utils/whatsapp';
import { uploadInvoiceToDrive } from '../utils/googleDrive';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  profile: BusinessProfile;
  isOpen: boolean;
  accessToken: string | null;
  onClose: () => void;
  onToggleStatus: (invoiceId: string) => void;
  onOpenReminder: (invoice: Invoice) => void;
  onOpenStatusCard: (invoice: Invoice) => void;
  onOpenGoogleDrive: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  profile,
  isOpen,
  accessToken,
  onClose,
  onToggleStatus,
  onOpenReminder,
  onOpenStatusCard,
  onOpenGoogleDrive,
}) => {
  const [tab, setTab] = useState<'slip' | 'whatsapp' | 'payment' | 'drive'>('slip');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedPayShap, setCopiedPayShap] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [driveFileUrl, setDriveFileUrl] = useState<string | null>(null);
  const [driveFileName, setDriveFileName] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);

  if (!isOpen || !invoice) return null;

  const isPaid = invoice.status === 'paid';
  const whatsappMessage = generateInvoiceWhatsAppText(invoice, profile);

  const handleSaveToDrive = async () => {
    if (!accessToken) {
      onOpenGoogleDrive();
      return;
    }

    setIsUploadingToDrive(true);
    setDriveError(null);
    try {
      const file = await uploadInvoiceToDrive(accessToken, invoice, profile);
      setDriveFileUrl(file.webViewLink || null);
      setDriveFileName(file.name);
    } catch (err: unknown) {
      console.error('Error saving invoice to Drive:', err);
      const msg = err instanceof Error ? err.message : 'Failed to upload invoice to Google Drive.';
      setDriveError(msg);
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  const handleCopyWhatsApp = async () => {
    const success = await copyToClipboard(whatsappMessage);
    if (success) {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const handleCopyPayShap = async () => {
    const payText =
      profile.paymentType === 'payshap' && profile.payshapId
        ? profile.payshapId
        : `${profile.bankName} Acc: ${profile.accountNumber} (Ref: ${invoice.clientName})`;
    const success = await copyToClipboard(payText);
    if (success) {
      setCopiedPayShap(true);
      setTimeout(() => setCopiedPayShap(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    openWhatsApp(invoice.clientPhone, whatsappMessage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-300">
              #{invoice.id}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isPaid
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              <span>{isPaid ? 'PAID' : 'PENDING PAYMENT'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggleStatus(invoice.id)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 transition-colors"
            >
              {isPaid ? 'Mark Pending' : 'Mark as Paid ✅'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-neutral-800 flex items-center gap-2 no-print bg-neutral-950/50">
          <button
            onClick={() => setTab('slip')}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-all ${
              tab === 'slip'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Invoice Slip
          </button>
          <button
            onClick={() => setTab('whatsapp')}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-all ${
              tab === 'whatsapp'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            WhatsApp Text
          </button>
          <button
            onClick={() => setTab('payment')}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-all ${
              tab === 'payment'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            PayShap & Bank Details
          </button>
          <button
            onClick={() => setTab('drive')}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'drive'
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Google Drive</span>
            {driveFileUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
          </button>
        </div>

        <div className="p-5 max-h-[72vh] overflow-y-auto">
          {/* TAB 1: INVOICE SLIP (Professional layout with business logo) */}
          {tab === 'slip' && (
            <div className="space-y-5">
              {/* Drive status alert if uploaded */}
              {driveFileUrl && (
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center justify-between no-print">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Saved to your Google Drive 'Seal Invoices' folder</span>
                  </div>
                  <a
                    href={driveFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-white hover:underline flex items-center gap-1 text-[11px] bg-blue-500/20 px-2 py-0.5 rounded"
                  >
                    <span>View in Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 shadow-sm print-card">
                {/* Brand Header with Uploaded Business Logo */}
                <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full border border-neutral-700 bg-neutral-900 flex items-center justify-center overflow-hidden shrink-0">
                      {profile.logoUrl ? (
                        <img
                          src={profile.logoUrl}
                          alt={profile.businessName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">{profile.logoEmoji || '✂️'}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">
                        {profile.businessName}
                      </h3>
                      <p className="text-xs text-neutral-400">
                        {profile.location || 'East London, South Africa'}
                      </p>
                      {profile.phone && (
                        <p className="text-[11px] text-neutral-500 font-mono">
                          WhatsApp: {profile.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-neutral-400 block">INVOICE</span>
                    <span className="font-mono text-sm font-semibold text-white">
                      #{invoice.id}
                    </span>
                    <span className="text-[11px] text-neutral-500 block mt-1">
                      {new Date(invoice.createdAt).toLocaleDateString('en-ZA', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Billed To */}
                <div className="py-4 border-b border-neutral-800 flex justify-between items-center">
                  <div>
                    <span className="text-[11px] font-semibold text-neutral-500 block uppercase tracking-wider">
                      Billed To
                    </span>
                    <span className="text-sm font-bold text-white">{invoice.clientName}</span>
                    {invoice.clientPhone && (
                      <span className="text-xs text-neutral-400 font-mono block">
                        {invoice.clientPhone}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-neutral-500 block uppercase tracking-wider">
                      Payment Status
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        isPaid ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {isPaid ? 'PAID IN FULL ✅' : 'PENDING PAYMENT ⏳'}
                    </span>
                  </div>
                </div>

                {/* Line Item Table */}
                <div className="py-4 border-b border-neutral-800">
                  <div className="flex justify-between text-xs text-neutral-400 font-semibold mb-2">
                    <span>Description</span>
                    <span>Amount</span>
                  </div>
                  <div className="flex justify-between text-sm py-2">
                    <span className="text-neutral-200 font-medium">{invoice.item}</span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {formatZAR(invoice.price)}
                    </span>
                  </div>
                  {invoice.notes && (
                    <p className="text-xs text-neutral-400 italic mt-1 bg-neutral-900/60 p-2 rounded-lg">
                      Note: {invoice.notes}
                    </p>
                  )}
                </div>

                {/* Total */}
                <div className="pt-4 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-neutral-300">Total {isPaid ? 'Paid' : 'Due'}:</span>
                  <span className="font-mono text-2xl font-extrabold text-emerald-400 tabular-nums">
                    {formatZAR(invoice.price)}
                  </span>
                </div>

                {/* Banking details snippet inside card */}
                {!isPaid && (
                  <div className="mt-4 pt-3 border-t border-neutral-800/80 bg-neutral-900/40 p-3 rounded-lg text-xs space-y-1">
                    <div className="text-neutral-400 font-semibold flex items-center gap-1">
                      <span>How to pay:</span>
                    </div>
                    {profile.paymentType === 'payshap' && profile.payshapId ? (
                      <div className="font-mono text-emerald-300">
                        ⚡ PayShap: {profile.payshapId}
                      </div>
                    ) : (
                      <div className="font-mono text-neutral-300">
                        🏦 {profile.bankName} · Acc: {profile.accountNumber} · Code: {profile.branchCode}
                      </div>
                    )}
                    <div className="text-neutral-400 text-[11px]">
                      Ref: {invoice.clientName}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons for Slip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 no-print">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="py-2.5 px-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] text-neutral-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md col-span-2 sm:col-span-1"
                >
                  <Share2 className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenStatusCard(invoice)}
                  className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all col-span-2 sm:col-span-1"
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Status Card</span>
                </button>

                {!isPaid && (
                  <button
                    type="button"
                    onClick={() => onOpenReminder(invoice)}
                    className="py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all col-span-2 sm:col-span-1"
                  >
                    <BellRing className="w-4 h-4" />
                    <span>Remind</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-2.5 px-3 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all col-span-2 sm:col-span-1"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / PDF</span>
                </button>
              </div>

              {/* Save to Drive Quick Action */}
              <div className="pt-1 no-print">
                <button
                  type="button"
                  onClick={handleSaveToDrive}
                  disabled={isUploadingToDrive}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border ${
                    driveFileUrl
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20'
                      : 'bg-neutral-800/80 border-neutral-700 hover:bg-neutral-800 text-white'
                  }`}
                >
                  {isUploadingToDrive ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                      <span>Saving Invoice to Google Drive...</span>
                    </>
                  ) : driveFileUrl ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Saved in Google Drive 'Seal Invoices'</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4 text-blue-400" />
                      <span>
                        {accessToken
                          ? 'Save Clean Copy to Google Drive'
                          : 'Connect Google Drive & Save Copy'}
                      </span>
                    </>
                  )}
                </button>
                {driveError && (
                  <p className="text-[11px] text-red-400 mt-1.5 text-center">{driveError}</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: WHATSAPP TEXT PREVIEW */}
          {tab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-xs text-neutral-200 font-sans whitespace-pre-wrap leading-relaxed select-text shadow-inner">
                {whatsappMessage}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCopyWhatsApp}
                  className="py-2.5 px-3 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Full Text</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="py-2.5 px-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] text-neutral-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Send in WhatsApp</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT / PAYSHAP LINK */}
          {tab === 'payment' && (
            <div className="space-y-4">
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="font-display font-bold text-sm text-white">
                        Direct Payment Link
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        South African instant PayShap / Capitec details
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-emerald-400">
                    {formatZAR(invoice.price)}
                  </span>
                </div>

                {profile.paymentType === 'payshap' && profile.payshapId ? (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-2">
                    <span className="text-xs text-neutral-400 block font-medium">
                      ⚡ PayShap ID / Cell
                    </span>
                    <div className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                      <span className="font-mono text-sm font-bold text-emerald-400">
                        {profile.payshapId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyPayShap}
                        className="text-xs text-neutral-300 hover:text-white px-2 py-1 bg-neutral-800 rounded flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Client can pay instantly from any SA banking app (Capitec, FNB, Standard Bank, Nedbank, TymeBank).
                    </p>
                  </div>
                ) : null}

                {/* Bank Account Info */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-neutral-400">Bank:</span>
                    <span className="font-semibold text-white">{profile.bankName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-neutral-400">Account Number:</span>
                    <span className="font-mono font-semibold text-white">{profile.accountNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-neutral-400">Branch Code:</span>
                    <span className="font-mono text-white">{profile.branchCode}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-800/60">
                    <span className="text-neutral-400">Account Name:</span>
                    <span className="text-white">{profile.accountHolder || profile.businessName}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-400">Reference:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {invoice.clientName.replace(/\s+/g, '')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyPayShap}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                {copiedPayShap ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Payment Details Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Banking & PayShap Details</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 4: GOOGLE DRIVE CLOUD SYNC */}
          {tab === 'drive' && (
            <div className="space-y-4">
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Cloud className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-white">
                        Google Drive Cloud Copy
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        Official HTML invoice file in your personal Google Drive
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-neutral-400">
                    #{invoice.id}
                  </span>
                </div>

                {!accessToken ? (
                  <div className="py-4 text-center space-y-3">
                    <p className="text-xs text-neutral-300">
                      Google Drive is not connected yet. Connect your account to automatically store
                      and access your invoices directly in Google Drive.
                    </p>
                    <button
                      type="button"
                      onClick={onOpenGoogleDrive}
                      className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-bold rounded-xl shadow transition-colors inline-flex items-center gap-2"
                    >
                      <HardDrive className="w-4 h-4 text-blue-500" />
                      <span>Connect Google Drive</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {driveFileUrl ? (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Saved in Google Drive</span>
                          </span>
                          <a
                            href={driveFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-white hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/20 px-2 py-1 rounded"
                          >
                            <span>Open File ↗</span>
                          </a>
                        </div>
                        {driveFileName && (
                          <div className="text-[11px] font-mono text-neutral-300 truncate">
                            {driveFileName}
                          </div>
                        )}
                        <p className="text-[11px] text-neutral-400">
                          Saved in folder: <strong>Seal Invoices</strong> on your Google Drive.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-400 space-y-1">
                        <p className="text-neutral-300 font-medium">Invoice not yet saved to Drive</p>
                        <p className="text-[11px]">
                          Uploading will create a print-ready standalone HTML copy in your 'Seal Invoices' folder on Google Drive.
                        </p>
                      </div>
                    )}

                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={handleSaveToDrive}
                        disabled={isUploadingToDrive}
                        className="w-full py-2.5 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        {isUploadingToDrive ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Uploading to Google Drive...</span>
                          </>
                        ) : (
                          <>
                            <CloudUpload className="w-4 h-4" />
                            <span>{driveFileUrl ? 'Update / Re-upload to Drive' : 'Save Invoice to Google Drive'}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={onOpenGoogleDrive}
                        className="w-full py-2 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-neutral-800"
                      >
                        <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                        <span>Manage All Google Drive Files & Backups</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
