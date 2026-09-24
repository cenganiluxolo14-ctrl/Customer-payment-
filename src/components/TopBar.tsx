import React from 'react';
import { Sparkles, Users, Rocket, Store, Plus, HardDrive, Cloud } from 'lucide-react';
import { BusinessProfile } from '../types';
import { User } from 'firebase/auth';

interface TopBarProps {
  profile: BusinessProfile;
  activeView: 'invoices' | 'clients';
  currentUser: User | null;
  onViewChange: (view: 'invoices' | 'clients') => void;
  onOpenCreate: () => void;
  onOpenProfile: () => void;
  onOpenLaunchKit: () => void;
  onOpenGoogleDrive: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  profile,
  activeView,
  currentUser,
  onViewChange,
  onOpenCreate,
  onOpenProfile,
  onOpenLaunchKit,
  onOpenGoogleDrive,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewChange('invoices')}
            className="text-left group flex items-center gap-2.5 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-display font-bold text-lg">
              S
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                Seal
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Clean navigation controls */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onViewChange('invoices')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeView === 'invoices'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Invoices
          </button>
          <button
            onClick={() => onViewChange('clients')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeView === 'clients'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Clients</span>
          </button>
          <button
            onClick={onOpenGoogleDrive}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              currentUser
                ? 'text-blue-300 hover:text-white bg-blue-500/10 border border-blue-500/20'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Google Drive Cloud Invoices & Backups"
          >
            <HardDrive className={`w-3.5 h-3.5 ${currentUser ? 'text-blue-400' : 'text-neutral-400'}`} />
            <span>Google Drive</span>
            {currentUser && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5"></span>
            )}
          </button>
          <button
            onClick={onOpenLaunchKit}
            className="px-3 py-1.5 text-xs sm:text-sm font-medium text-neutral-400 hover:text-emerald-400 transition-colors whitespace-nowrap hidden md:flex items-center gap-1.5"
            title="East London Hustle & First 10 Users Kit"
          >
            <Rocket className="w-3.5 h-3.5 text-emerald-400" />
            <span>Launch Kit</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProfile}
            className="p-2 text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5 text-xs font-medium border border-neutral-800"
            title="Business Settings & PayShap Details"
          >
            <span className="text-base">{profile.logoEmoji || '✂️'}</span>
            <span className="hidden md:inline max-w-[120px] truncate text-neutral-300">
              {profile.businessName}
            </span>
          </button>

          <button
            onClick={onOpenCreate}
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] rounded-lg transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">New Invoice</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>
    </header>
  );
};
