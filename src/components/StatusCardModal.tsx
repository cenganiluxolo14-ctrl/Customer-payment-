import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Share2, Copy, Check, Smartphone, Square } from 'lucide-react';
import { BusinessProfile, Invoice } from '../types';
import { drawInvoiceStatusCard } from '../utils/canvasRenderer';

interface StatusCardModalProps {
  invoice: Invoice | null;
  profile: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const StatusCardModal: React.FC<StatusCardModalProps> = ({
  invoice,
  profile,
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<'square' | 'story'>('square');
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !invoice || !canvasRef.current) return;

    // Preload logo image if available
    if (profile.logoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (canvasRef.current) {
          drawInvoiceStatusCard(canvasRef.current, invoice, profile, format, img);
        }
      };
      img.onerror = () => {
        if (canvasRef.current) {
          drawInvoiceStatusCard(canvasRef.current, invoice, profile, format, null);
        }
      };
      img.src = profile.logoUrl;
    } else {
      drawInvoiceStatusCard(canvasRef.current, invoice, profile, format, null);
    }
  }, [isOpen, invoice, profile, format]);

  if (!isOpen || !invoice) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    setDownloading(true);

    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Invoice-${invoice.id}-${invoice.clientName.replace(/\s+/g, '_')}.png`;
    link.href = dataUrl;
    link.click();

    setTimeout(() => setDownloading(false), 800);
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File(
          [blob],
          `Invoice-${invoice.id}-${invoice.clientName}.png`,
          { type: 'image/png' }
        );

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Invoice #${invoice.id} - ${profile.businessName}`,
            text: `Invoice #${invoice.id} for ${invoice.clientName} (R${invoice.price})`,
            files: [file],
          });
        } else {
          // Fallback to downloading
          handleDownload();
        }
      }, 'image/png');
    } catch (err) {
      console.warn('Native share cancelled or failed, falling back to download', err);
      handleDownload();
    }
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;

    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } else {
          handleDownload();
        }
      }, 'image/png');
    } catch (err) {
      console.warn('Image clipboard copy failed', err);
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-white">
              WhatsApp Status Graphic Card
            </h2>
            <p className="text-xs text-neutral-400">
              High-resolution graphic card tailored for WhatsApp Status & DMs
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Format selection: Square (1:1) vs Story (9:16) */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300">Aspect Ratio:</span>
            <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setFormat('square')}
                className={`px-3 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
                  format === 'square'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>Square (1:1 Feed)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('story')}
                className={`px-3 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
                  format === 'story'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Story (9:16 Status)</span>
              </button>
            </div>
          </div>

          {/* Canvas Preview Container */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center justify-center overflow-hidden">
            <canvas
              ref={canvasRef}
              className="max-h-[380px] w-auto max-w-full rounded-lg shadow-lg border border-neutral-800/80 object-contain"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
            <span>✨ Automatically styled with your logo & PayShap details</span>
            <span>1080px ultra-crisp output</span>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyImage}
              className="py-2.5 px-3 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied Image!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Image</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{downloading ? 'Downloading...' : 'Save PNG'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="py-2.5 px-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] text-neutral-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <Share2 className="w-4 h-4" />
              <span>Share to WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
