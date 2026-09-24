import React, { useState } from 'react';
import { X, Wand2, UserCheck, Search, Check, Sparkles } from 'lucide-react';
import { BusinessProfile, Client, Invoice } from '../types';
import { parseWhatsAppText } from '../utils/parser';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'reminderCount'>, saveClient: boolean) => void;
  clients: Client[];
  profile: BusinessProfile;
  preselectedClient?: Client | null;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  clients,
  profile,
  preselectedClient,
}) => {
  const [whatsappPaste, setWhatsappPaste] = useState('');
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);

  // Form Fields
  const [clientName, setClientName] = useState(preselectedClient ? preselectedClient.name : '');
  const [clientPhone, setClientPhone] = useState(preselectedClient ? preselectedClient.phone : '');
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(preselectedClient?.id);
  const [item, setItem] = useState(preselectedClient?.favoriteItem || '');
  const [price, setPrice] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [saveClient, setSaveClient] = useState(true);

  // Client Picker Search / Drawer
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleParseWhatsApp = () => {
    if (!whatsappPaste.trim()) return;
    const parsed = parseWhatsAppText(whatsappPaste);

    if (parsed.clientName && parsed.clientName !== 'Client') {
      setClientName(parsed.clientName);
    }
    if (parsed.item && parsed.item !== 'Custom Order') {
      setItem(parsed.item);
    }
    if (parsed.price > 0) {
      setPrice(parsed.price.toString());
    }
    if (parsed.clientPhone) {
      setClientPhone(parsed.clientPhone);
    }

    // Check if client name matches an existing client
    const match = clients.find(
      (c) => c.name.toLowerCase() === parsed.clientName.toLowerCase()
    );
    if (match) {
      setSelectedClientId(match.id);
      if (!parsed.clientPhone && match.phone) {
        setClientPhone(match.phone);
      }
    }

    setPasteNotice(`Detected: ${parsed.clientName} · R${parsed.price} · ${parsed.item}`);
    setTimeout(() => setPasteNotice(null), 4000);
  };

  const handleSelectClient = (client: Client) => {
    setClientName(client.name);
    setClientPhone(client.phone || '');
    setSelectedClientId(client.id);
    if (client.favoriteItem && !item) {
      setItem(client.favoriteItem);
    }
    setShowClientPicker(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !item.trim() || !price) {
      return;
    }

    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
    if (numericPrice <= 0) return;

    onSubmit(
      {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientId: selectedClientId,
        item: item.trim(),
        price: numericPrice,
        status: 'pending',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        notes: notes.trim() || undefined,
      },
      saveClient
    );

    onClose();
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
      c.phone.includes(clientSearchQuery)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-white">Create Quick Invoice</h2>
            <p className="text-xs text-neutral-400">
              Only 3 fields needed to generate an official WhatsApp invoice
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Smart WhatsApp Text Paste Bar */}
          <div className="bg-neutral-950/60 border border-emerald-500/20 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <Wand2 className="w-3.5 h-3.5" />
                <span>Smart WhatsApp Text Paste</span>
              </label>
              <span className="text-[10px] text-neutral-400">Copies straight from WhatsApp</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={whatsappPaste}
                onChange={(e) => setWhatsappPaste(e.target.value)}
                placeholder="e.g. 'Thandi R450 knotless braids 0781234567'"
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleParseWhatsApp}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded-lg transition-colors whitespace-nowrap"
              >
                Auto-fill
              </button>
            </div>
            {pasteNotice && (
              <p className="text-[11px] text-emerald-400 mt-2 font-medium">✓ {pasteNotice}</p>
            )}
          </div>

          {/* Quick-Select Existing Client Bar (User Request Feature) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                1. Client Name <span className="text-emerald-400">*</span>
              </label>
              {clients.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClientPicker(!showClientPicker)}
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{showClientPicker ? 'Hide Saved Clients' : 'Choose Existing Client'}</span>
                </button>
              )}
            </div>

            {/* Quick chips of recent clients */}
            {clients.length > 0 && !showClientPicker && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-2 scrollbar-none">
                <span className="text-[10px] text-neutral-400 whitespace-nowrap shrink-0">Recent:</span>
                {clients.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectClient(c)}
                    className={`px-2 py-0.5 text-xs rounded-md border transition-colors whitespace-nowrap ${
                      clientName === c.name
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-medium'
                        : 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {/* Client Picker Dropdown drawer */}
            {showClientPicker && (
              <div className="mb-3 p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
                  <input
                    type="text"
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    placeholder="Search saved clients by name or phone..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {filteredClients.length === 0 ? (
                    <p className="text-xs text-neutral-500 py-1 text-center">No matching clients</p>
                  ) : (
                    filteredClients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => handleSelectClient(client)}
                        className="px-2.5 py-1.5 rounded-lg hover:bg-neutral-800 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <div className="font-medium text-neutral-200">{client.name}</div>
                          <div className="text-[11px] text-neutral-500">
                            {client.phone ? client.phone : 'No phone'} · {client.invoiceCount} orders
                          </div>
                        </div>
                        {clientName === client.name && (
                          <Check className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value);
                  setSelectedClientId(undefined);
                }}
                placeholder="Client Name (e.g. Ayanda N.)"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="WhatsApp Phone (e.g. 078 123 4567)"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Field 2: Item / Service */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              2. What did they buy / book? <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="e.g. Knotless Braids Mid-Back / Lash Set / Nike Sneakers"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Field 3: Price in Rands (ZAR) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              3. Amount Due (South African Rands) <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <span className="text-emerald-400 font-bold font-mono text-base">R</span>
              </div>
              <input
                type="number"
                step="any"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="450"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2.5 text-lg font-bold font-mono tabular-nums text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Optional notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Notes or special instructions (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Booked for Friday 10am, deposit required"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Auto-save client toggle */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
              <input
                type="checkbox"
                checked={saveClient}
                onChange={(e) => setSaveClient(e.target.checked)}
                className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-0 focus:ring-offset-0"
              />
              <span>Remember this client & contact info for next time</span>
            </label>
          </div>

          {/* Actions */}
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
              <Sparkles className="w-4 h-4" />
              <span>Generate Invoice Slip</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
