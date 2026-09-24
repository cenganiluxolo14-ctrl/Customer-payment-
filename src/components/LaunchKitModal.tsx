import React, { useState } from 'react';
import { X, Copy, Check, Rocket, MessageSquare, Zap, Target } from 'lucide-react';
import { copyToClipboard } from '../utils/whatsapp';

interface LaunchKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchProfile: (presetIndex: number) => void;
}

export const LaunchKitModal: React.FC<LaunchKitModalProps> = ({
  isOpen,
  onClose,
  onSwitchProfile,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = async (id: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const dmScript1 = `Hey! 👋 Saw your WhatsApp Status work, absolutely love your style. 

I actually built a quick WhatsApp tool for East London hustlers that turns orders into clean PayShap invoice slips like this in 10 seconds.

I made a sample one for your brand — check it out! Want me to add your real logo and Capitec/PayShap details for free so you can start sending them to clients? 🙏`;

  const dmScript2 = `Hi Sis/Bro! Quick question: when clients buy on WhatsApp, do you ever have to chase people for payments? 

I made this app (Seal) that auto-writes polite WhatsApp debt reminders and PayShap payment links so clients pay faster. 

I'm giving 10 East London sellers free unlimited access this month to test it. Can I send you the link? ✨`;

  const groupInviteScript = `Hey family! 🎉 Welcome to the Seal East London Hustlers VIP group. 

Drop your business name, WhatsApp number and what you sell below. 

Whenever you need a custom invoice slip or payment link generated, drop it in the app or ask here. Let's make this paper! 💰🔥`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-white">
                East London Launch Kit · First 10 Users
              </h2>
              <p className="text-xs text-neutral-400">
                How to get your first 10 paying sellers in East London / South Africa this week
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

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Step 1: Real Local Businesses */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Target className="w-4 h-4" />
              <span>Step 1: Test Invoices for 5 Real Businesses</span>
            </div>
            <p className="text-xs text-neutral-300">
              Click any local business below to preview how their invoices and WhatsApp Status cards look right now:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onSwitchProfile(0);
                  onClose();
                }}
                className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 text-left transition-colors"
              >
                <span className="text-base block mb-0.5">✂️ Hair & Braids</span>
                <span className="text-xs font-bold text-white block">Slayed by Thando</span>
                <span className="text-[10px] text-neutral-400">Mdantsane / EL</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSwitchProfile(1);
                  onClose();
                }}
                className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-pink-500/50 text-left transition-colors"
              >
                <span className="text-base block mb-0.5">💅 Nails & Lashes</span>
                <span className="text-xs font-bold text-white block">Luxe Lashes EL</span>
                <span className="text-[10px] text-neutral-400">Beacon Bay</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSwitchProfile(2);
                  onClose();
                }}
                className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 text-left transition-colors"
              >
                <span className="text-base block mb-0.5">👟 Sneakers / Thrift</span>
                <span className="text-xs font-bold text-white block">EL Kick Vault</span>
                <span className="text-[10px] text-neutral-400">East London CBD</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSwitchProfile(3);
                  onClose();
                }}
                className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 text-left transition-colors"
              >
                <span className="text-base block mb-0.5">📸 Photography</span>
                <span className="text-xs font-bold text-white block">Nathi Visuals</span>
                <span className="text-[10px] text-neutral-400">Nahoon / EL</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSwitchProfile(4);
                  onClose();
                }}
                className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-teal-500/50 text-left transition-colors"
              >
                <span className="text-base block mb-0.5">🎂 Custom Cakes</span>
                <span className="text-xs font-bold text-white block">Sweet Tooth Treats</span>
                <span className="text-[10px] text-neutral-400">Vincent / EL</span>
              </button>
            </div>
          </div>

          {/* Step 2: Pitch DMs */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <MessageSquare className="w-4 h-4" />
              <span>Step 2: Copy-Paste WhatsApp DM Scripts</span>
            </div>

            {/* Script 1 */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  Pitch 1: "I made this for you" (High Conversion)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('script1', dmScript1)}
                  className="px-2.5 py-1 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-300 flex items-center gap-1"
                >
                  {copiedId === 'script1' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'script1' ? 'Copied!' : 'Copy DM'}</span>
                </button>
              </div>
              <p className="text-xs text-neutral-300 font-sans whitespace-pre-wrap bg-neutral-900/70 p-2.5 rounded-lg border border-neutral-800">
                {dmScript1}
              </p>
            </div>

            {/* Script 2 */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  Pitch 2: The Unpaid Debt Pain Point
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('script2', dmScript2)}
                  className="px-2.5 py-1 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-300 flex items-center gap-1"
                >
                  {copiedId === 'script2' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'script2' ? 'Copied!' : 'Copy DM'}</span>
                </button>
              </div>
              <p className="text-xs text-neutral-300 font-sans whitespace-pre-wrap bg-neutral-900/70 p-2.5 rounded-lg border border-neutral-800">
                {dmScript2}
              </p>
            </div>

            {/* Script 3 */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  Pitch 3: WhatsApp Group Welcome for First 10 Users
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('script3', groupInviteScript)}
                  className="px-2.5 py-1 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-300 flex items-center gap-1"
                >
                  {copiedId === 'script3' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'script3' ? 'Copied!' : 'Copy Invite'}</span>
                </button>
              </div>
              <p className="text-xs text-neutral-300 font-sans whitespace-pre-wrap bg-neutral-900/70 p-2.5 rounded-lg border border-neutral-800">
                {groupInviteScript}
              </p>
            </div>
          </div>

          {/* Pricing Model */}
          <div className="bg-gradient-to-br from-emerald-950/30 to-neutral-950 border border-emerald-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>How You Charge & Monetize Week 1</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="bg-neutral-900/80 p-3 rounded-lg border border-neutral-800">
                <span className="text-neutral-400 block mb-0.5">Free Tier</span>
                <span className="text-base font-bold text-white">3 Invoices / Month</span>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Lets any hustler test it immediately with 0 risk.
                </p>
              </div>
              <div className="bg-neutral-900/80 p-3 rounded-lg border border-emerald-500/40">
                <span className="text-emerald-400 font-semibold block mb-0.5">Pro Hustler Tier</span>
                <span className="text-base font-bold text-emerald-300">R49 / Month</span>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Unlimited invoices + uploaded logo + automated debt reminders + PayShap link. Or R5 per paid slip!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
