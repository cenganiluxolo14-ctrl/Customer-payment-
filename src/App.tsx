/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Users,
  Smartphone,
  Sparkles,
  Rocket,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { BusinessProfile, Client, Invoice, InvoiceStatus } from './types';
import {
  loadClients,
  loadInvoices,
  loadProfile,
  recordClientFromInvoice,
  saveClients,
  saveInvoices,
  saveProfile,
} from './utils/storage';
import { DEMO_PRESETS } from './data/defaultData';
import { TopBar } from './components/TopBar';
import { StatsBanner } from './components/StatsBanner';
import { InvoiceCard } from './components/InvoiceCard';
import { CreateInvoiceModal } from './components/CreateInvoiceModal';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { DebtReminderModal } from './components/DebtReminderModal';
import { StatusCardModal } from './components/StatusCardModal';
import { BusinessProfileModal } from './components/BusinessProfileModal';
import { ClientDirectory } from './components/ClientDirectory';
import { LaunchKitModal } from './components/LaunchKitModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { initAuth } from './utils/googleAuth';
import { User } from 'firebase/auth';
import { HardDrive } from 'lucide-react';

export default function App() {
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadInvoices());
  const [profile, setProfile] = useState<BusinessProfile>(() => loadProfile());
  const [clients, setClients] = useState<Client[]>(() => loadClients());

  // Google Drive & Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isGoogleDriveOpen, setIsGoogleDriveOpen] = useState(false);

  const [activeView, setActiveView] = useState<'invoices' | 'clients'>('invoices');
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [reminderInvoice, setReminderInvoice] = useState<Invoice | null>(null);
  const [statusCardInvoice, setStatusCardInvoice] = useState<Invoice | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLaunchKitOpen, setIsLaunchKitOpen] = useState(false);
  const [preselectedClient, setPreselectedClient] = useState<Client | null>(null);

  // Initialize auth state listener for Google Drive tokens
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        setAccessToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    saveInvoices(invoices);
  }, [invoices]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveClients(clients);
  }, [clients]);

  // Create Invoice Handler (with integrated client auto-save)
  const handleCreateInvoice = (
    newInvData: Omit<Invoice, 'id' | 'createdAt' | 'reminderCount'>,
    shouldSaveClient: boolean
  ) => {
    // Find the highest numeric index among existing invoices to ensure strictly unique increment
    let highestNum = 108;
    const existingIds = new Set(invoices.map((inv) => inv.id));

    invoices.forEach((inv) => {
      const match = inv.id.match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        if (val > highestNum) highestNum = val;
      }
    });

    let nextNumber = highestNum + 1;
    let newId = `INV-${nextNumber}`;
    while (existingIds.has(newId)) {
      nextNumber += 1;
      newId = `INV-${nextNumber}`;
    }

    let clientId = newInvData.clientId;

    if (shouldSaveClient) {
      const updatedClient = recordClientFromInvoice(
        newInvData.clientName,
        newInvData.clientPhone,
        newInvData.price,
        newInvData.item
      );
      clientId = updatedClient.id;
      // Refresh local clients list state
      setClients(loadClients());
    }

    const createdInvoice: Invoice = {
      ...newInvData,
      id: newId,
      clientId,
      createdAt: new Date().toISOString(),
      reminderCount: 0,
    };

    const updatedInvoices = [createdInvoice, ...invoices];
    setInvoices(updatedInvoices);

    // Automatically open preview modal so user can share immediately
    setSelectedInvoice(createdInvoice);
    setPreselectedClient(null);
  };

  // Toggle Paid/Pending
  const handleToggleStatus = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const isNowPaid = inv.status !== 'paid';
          return {
            ...inv,
            status: isNowPaid ? 'paid' : 'pending',
            paidAt: isNowPaid ? new Date().toISOString() : undefined,
          };
        }
        return inv;
      })
    );

    if (selectedInvoice && selectedInvoice.id === invoiceId) {
      setSelectedInvoice((prev) =>
        prev
          ? {
              ...prev,
              status: prev.status !== 'paid' ? 'paid' : 'pending',
              paidAt: prev.status !== 'paid' ? new Date().toISOString() : undefined,
            }
          : null
      );
    }
  };

  // Record a debt reminder sent
  const handleRecordReminder = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            reminderCount: (inv.reminderCount || 0) + 1,
            lastRemindedAt: new Date().toISOString(),
          };
        }
        return inv;
      })
    );
  };

  // Switch to preset from Launch Kit
  const handleSwitchPreset = (presetIndex: number) => {
    const preset = DEMO_PRESETS[presetIndex];
    if (preset) {
      const updatedProfile = {
        ...profile,
        ...preset.business,
      };
      setProfile(updatedProfile);
      saveProfile(updatedProfile);
    }
  };

  // Client Directory trigger for new invoice
  const handleSelectClientForInvoice = (client: Client) => {
    setPreselectedClient(client);
    setActiveView('invoices');
    setIsCreateOpen(true);
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (filter === 'pending' && inv.status !== 'pending' && inv.status !== 'overdue') {
      return false;
    }
    if (filter === 'paid' && inv.status !== 'paid') {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inv.clientName.toLowerCase().includes(q) ||
        inv.item.toLowerCase().includes(q) ||
        inv.id.toLowerCase().includes(q) ||
        (inv.clientPhone && inv.clientPhone.includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col pb-24 sm:pb-12">
      {/* Top Bar (Follows Top Bar Contract) */}
      <TopBar
        profile={profile}
        activeView={activeView}
        currentUser={currentUser}
        onViewChange={(v) => setActiveView(v)}
        onOpenCreate={() => {
          setPreselectedClient(null);
          setIsCreateOpen(true);
        }}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenLaunchKit={() => setIsLaunchKitOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 pt-6 space-y-6 flex-1">
        {/* Brand Kicker & Hustler Status */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-full border border-emerald-500/40 bg-neutral-900 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
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
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-lg text-white">
                  {profile.businessName}
                </h1>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified SA Hustler</span>
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {profile.location || 'East London, South Africa'} ·{' '}
                {profile.paymentType === 'payshap'
                  ? `PayShap: ${profile.payshapId || 'Cell'}`
                  : `${profile.bankName} EFT`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsGoogleDriveOpen(true)}
              className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/30 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
              title="Google Drive Cloud Invoices"
            >
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              <span>{currentUser ? 'Drive Synced' : 'Google Drive'}</span>
              {currentUser && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
            </button>
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl border border-neutral-700 transition-colors whitespace-nowrap"
            >
              {profile.logoUrl ? 'Edit Brand' : 'Upload Logo'}
            </button>
            <button
              onClick={() => setIsLaunchKitOpen(true)}
              className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Launch Kit</span>
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <StatsBanner invoices={invoices} />

        {/* View Switch: Invoices Feed vs Clients Directory */}
        {activeView === 'invoices' ? (
          <div className="space-y-4">
            {/* Filter Tabs & Search Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Segmented Filter Control (Functional interactive filter) */}
              <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    filter === 'all'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  All ({invoices.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('pending')}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
                    filter === 'pending'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>
                    Pending ({invoices.filter((i) => i.status !== 'paid').length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('paid')}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
                    filter === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>
                    Paid ({invoices.filter((i) => i.status === 'paid').length})
                  </span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-xs ml-auto">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search client or item..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Invoices List Feed */}
            {filteredInvoices.length === 0 ? (
              <div className="py-16 text-center bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-base text-white mb-1">
                  No invoices found
                </h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-4">
                  {searchQuery
                    ? 'No invoices match your search query.'
                    : 'Paste a WhatsApp order or fill 3 fields to create your first official slip.'}
                </p>
                <button
                  onClick={() => {
                    setPreselectedClient(null);
                    setIsCreateOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-emerald-400 text-neutral-950 rounded-xl hover:bg-emerald-300 transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Invoice</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredInvoices.map((inv) => (
                  <InvoiceCard
                    key={inv.id}
                    invoice={inv}
                    profile={profile}
                    onSelect={(invoice) => setSelectedInvoice(invoice)}
                    onToggleStatus={handleToggleStatus}
                    onOpenReminder={(invoice) => setReminderInvoice(invoice)}
                    onOpenStatusCard={(invoice) => setStatusCardInvoice(invoice)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Client Directory View */
          <ClientDirectory
            clients={clients}
            onSelectClientForInvoice={handleSelectClientForInvoice}
            onAddNewClient={(newClient) => {
              const updated = [newClient, ...clients];
              setClients(updated);
            }}
            onDeleteClient={(clientId) => {
              setClients((prev) => prev.filter((c) => c.id !== clientId));
            }}
          />
        )}
      </main>

      {/* Floating Bottom Action Bar for Mobile Thumb Ergonomics */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800 z-30">
        <button
          onClick={() => {
            setPreselectedClient(null);
            setIsCreateOpen(true);
          }}
          className="w-full h-12 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>New Invoice (3 Fields)</span>
        </button>
      </div>

      {/* MODALS */}
      {/* 1. Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateInvoice}
        clients={clients}
        profile={profile}
        preselectedClient={preselectedClient}
      />

      {/* 2. Invoice Detail / WhatsApp Slip Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        profile={profile}
        isOpen={Boolean(selectedInvoice)}
        accessToken={accessToken}
        onClose={() => setSelectedInvoice(null)}
        onToggleStatus={handleToggleStatus}
        onOpenReminder={(inv) => {
          setSelectedInvoice(null);
          setReminderInvoice(inv);
        }}
        onOpenStatusCard={(inv) => {
          setSelectedInvoice(null);
          setStatusCardInvoice(inv);
        }}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
      />

      {/* 3. Debt Reminder Modal */}
      <DebtReminderModal
        invoice={reminderInvoice}
        profile={profile}
        isOpen={Boolean(reminderInvoice)}
        onClose={() => setReminderInvoice(null)}
        onRecordReminder={handleRecordReminder}
      />

      {/* 4. WhatsApp Status Image Card Generator Modal */}
      <StatusCardModal
        invoice={statusCardInvoice}
        profile={profile}
        isOpen={Boolean(statusCardInvoice)}
        onClose={() => setStatusCardInvoice(null)}
      />

      {/* 5. Business Profile & Logo Setup Modal */}
      <BusinessProfileModal
        profile={profile}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onSave={(updated) => setProfile(updated)}
      />

      {/* 6. Launch Kit Modal */}
      <LaunchKitModal
        isOpen={isLaunchKitOpen}
        onClose={() => setIsLaunchKitOpen(false)}
        onSwitchProfile={handleSwitchPreset}
      />

      {/* 7. Google Drive Cloud Hub Modal */}
      <GoogleDriveModal
        isOpen={isGoogleDriveOpen}
        onClose={() => setIsGoogleDriveOpen(false)}
        invoices={invoices}
        clients={clients}
        profile={profile}
        currentUser={currentUser}
        accessToken={accessToken}
        onAuthSuccess={(user, token) => {
          setCurrentUser(user);
          setAccessToken(token);
        }}
        onAuthLogout={() => {
          setCurrentUser(null);
          setAccessToken(null);
        }}
        onRestoreData={(restoredInvoices, restoredClients) => {
          setInvoices(restoredInvoices);
          setClients(restoredClients);
        }}
      />
    </div>
  );
}
