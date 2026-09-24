import React, { useState } from 'react';
import { Search, Plus, MessageCircle, FileText, UserPlus, Phone } from 'lucide-react';
import { Client } from '../types';
import { formatZAR, openWhatsApp } from '../utils/whatsapp';

interface ClientDirectoryProps {
  clients: Client[];
  onSelectClientForInvoice: (client: Client) => void;
  onAddNewClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
}

export const ClientDirectory: React.FC<ClientDirectoryProps> = ({
  clients,
  onSelectClientForInvoice,
  onAddNewClient,
  onDeleteClient,
}) => {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.notes && c.notes.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newClient: Client = {
      id: `cli-${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim(),
      notes: newNotes.trim() || undefined,
      totalSpent: 0,
      invoiceCount: 0,
      lastInvoiceAt: new Date().toISOString(),
    };

    onAddNewClient(newClient);
    setNewName('');
    setNewPhone('');
    setNewNotes('');
    setShowAddForm(false);
  };

  const handleWhatsAppClient = (phone: string, name: string) => {
    openWhatsApp(phone, `Hi ${name}! Hope you're doing well ✨`);
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Add Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved clients by name or phone..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3.5 py-2 text-xs sm:text-sm font-semibold bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl border border-neutral-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <UserPlus className="w-4 h-4 text-emerald-400" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Manual Add Form Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-neutral-900 border border-emerald-500/30 rounded-xl p-4 space-y-3"
        >
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Add New Client Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Client Name (e.g. Asanda M.)"
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="WhatsApp Number (e.g. 078 123 4567)"
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <input
            type="text"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Client notes (e.g. Nails regular, prefers weekends)"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold bg-emerald-400 text-neutral-950 rounded-lg hover:bg-emerald-300"
            >
              Save Client
            </button>
          </div>
        </form>
      )}

      {/* Clients List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-neutral-900/40 border border-neutral-800/80 rounded-2xl">
            <p className="text-sm text-neutral-400 mb-1">No clients found</p>
            <p className="text-xs text-neutral-600">
              Clients are automatically saved whenever you generate an invoice!
            </p>
          </div>
        ) : (
          filtered.map((client) => (
            <div
              key={client.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <h3 className="font-display font-bold text-base text-white">
                      {client.name}
                    </h3>
                    {client.phone && (
                      <span className="text-xs text-neutral-400 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-neutral-500" />
                        <span>{client.phone}</span>
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-neutral-500 block">Total Spent</span>
                    <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                      {formatZAR(client.totalSpent)}
                    </span>
                  </div>
                </div>

                {client.favoriteItem && (
                  <p className="text-xs text-neutral-400 mb-2">
                    <span className="text-neutral-500">Service:</span> {client.favoriteItem}
                  </p>
                )}

                {client.notes && (
                  <p className="text-[11px] text-neutral-500 italic line-clamp-1 mb-2">
                    "{client.notes}"
                  </p>
                )}
              </div>

              {/* Action row */}
              <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
                <div className="text-[11px] text-neutral-500">
                  {client.invoiceCount} {client.invoiceCount === 1 ? 'order' : 'orders'}
                </div>

                <div className="flex items-center gap-1.5">
                  {client.phone && (
                    <button
                      type="button"
                      onClick={() => handleWhatsAppClient(client.phone, client.name)}
                      className="p-2 text-neutral-400 hover:text-emerald-400 rounded-lg hover:bg-neutral-800 transition-colors"
                      title="Open WhatsApp Chat"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectClientForInvoice(client)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Invoice</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
