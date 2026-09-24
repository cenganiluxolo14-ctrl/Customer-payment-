import React, { useRef, useState } from 'react';
import { X, Upload, Trash2, Check, Store, ShieldCheck } from 'lucide-react';
import { BusinessProfile } from '../types';
import { DEMO_PRESETS } from '../data/defaultData';

interface BusinessProfileModalProps {
  profile: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: BusinessProfile) => void;
}

const SA_BANKS = [
  { name: 'Capitec Bank', code: '470010' },
  { name: 'First National Bank (FNB)', code: '250655' },
  { name: 'Standard Bank', code: '051001' },
  { name: 'Nedbank', code: '198765' },
  { name: 'TymeBank', code: '678910' },
  { name: 'ABSA', code: '632005' },
];

const EMOJI_OPTIONS = ['✂️', '💅', '👟', '📸', '🎂', '👑', '💎', '🔥', '💈', '👗'];

export const BusinessProfileModal: React.FC<BusinessProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<BusinessProfile>({ ...profile });
  const [savedNotice, setSavedNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Please upload an image smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData((prev) => ({ ...prev, logoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logoUrl: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyPreset = (preset: (typeof DEMO_PRESETS)[0]) => {
    setFormData((prev) => ({
      ...prev,
      ...preset.business,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-white">Business & Payment Setup</h2>
              <p className="text-xs text-neutral-400">
                Added automatically to all WhatsApp invoices and payment links
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

        {/* Quick Industry Presets */}
        <div className="px-5 pt-3 pb-1 border-b border-neutral-800/60 bg-neutral-950/40">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1.5">
            <span>Quick switch hustle preset:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {DEMO_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="px-2.5 py-1 text-xs rounded-lg bg-neutral-800 border border-neutral-700/60 hover:border-emerald-500/50 text-neutral-300 hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5"
              >
                <span>{p.business.logoEmoji}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Business Logo Upload Section (User Request) */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Business Logo / Avatar
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full border-2 border-emerald-500/50 bg-neutral-900 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt={formData.businessName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">{formData.logoEmoji || '✂️'}</span>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload-input"
                />
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="logo-upload-input"
                    className="px-3 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg cursor-pointer border border-neutral-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{formData.logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                  </label>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-neutral-800 rounded-lg transition-colors"
                      title="Remove uploaded logo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500">
                  Included on all invoice slips & WhatsApp status graphics. PNG or JPG.
                </p>
              </div>
            </div>

            {/* Quick emoji fallback selection */}
            <div className="mt-3 pt-3 border-t border-neutral-800/80">
              <span className="text-[10px] text-neutral-400 block mb-1">
                Or pick an emoji icon:
              </span>
              <div className="flex items-center gap-1.5">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, logoEmoji: emoji }))}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                      formData.logoEmoji === emoji
                        ? 'bg-emerald-500/20 border border-emerald-500/60 scale-110'
                        : 'bg-neutral-900 border border-neutral-800 hover:bg-neutral-800'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Business Core Info */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Business Name <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. Slayed by Thando"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Your WhatsApp Number <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="083 456 7890"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Location (Town / Suburb)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. East London, Eastern Cape"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* South African Payment Details */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>SA Payment & PayShap Setup</span>
              </label>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentType: 'payshap' })}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-left ${
                  formData.paymentType === 'payshap'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                ⚡ PayShap (Instant)
                <span className="block text-[10px] font-normal text-neutral-400">
                  Instant free/low-fee payments via phone number
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentType: 'eft' })}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-left ${
                  formData.paymentType === 'eft'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                🏦 Standard EFT / Capitec
                <span className="block text-[10px] font-normal text-neutral-400">
                  Bank account & branch code
                </span>
              </button>
            </div>

            {/* PayShap Identifier */}
            {formData.paymentType === 'payshap' && (
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  PayShap ID / Cell Number (e.g. 0834567890@shaper or cell)
                </label>
                <input
                  type="text"
                  value={formData.payshapId}
                  onChange={(e) => setFormData({ ...formData, payshapId: e.target.value })}
                  placeholder="0834567890@shaper"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Bank Name Dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Bank Name
                </label>
                <select
                  value={formData.bankName}
                  onChange={(e) => {
                    const selected = SA_BANKS.find((b) => b.name === e.target.value);
                    setFormData({
                      ...formData,
                      bankName: e.target.value,
                      branchCode: selected ? selected.code : formData.branchCode,
                    });
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {SA_BANKS.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                  placeholder="e.g. T MAZWI"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Account Number & Branch Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="1589324012"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Branch Code
                </label>
                <input
                  type="text"
                  value={formData.branchCode}
                  onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                  placeholder="470010"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs sm:text-sm font-bold bg-emerald-400 hover:bg-emerald-300 text-neutral-950 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              {savedNotice ? (
                <>
                  <Check className="w-4 h-4 text-neutral-950" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Business Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
