import { BusinessProfile, Client, Invoice } from '../types';
import { DEFAULT_PROFILE, INITIAL_CLIENTS, INITIAL_INVOICES } from '../data/defaultData';

const INVOICES_KEY = 'seal_invoices_v1';
const PROFILE_KEY = 'seal_profile_v1';
const CLIENTS_KEY = 'seal_clients_v1';

export function loadInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(INVOICES_KEY);
    if (!raw) return INITIAL_INVOICES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_INVOICES;

    // Deduplicate any IDs in case collision occurred in previous versions
    const seenIds = new Set<string>();
    let maxNum = 108;
    parsed.forEach((inv) => {
      const match = typeof inv?.id === 'string' ? inv.id.match(/\d+/) : null;
      if (match) {
        const val = parseInt(match[0], 10);
        if (val > maxNum) maxNum = val;
      }
    });

    const sanitized = parsed.map((inv: Invoice) => {
      let id = inv.id;
      if (!id || seenIds.has(id)) {
        maxNum += 1;
        id = `INV-${maxNum}`;
      }
      seenIds.add(id);
      return { ...inv, id };
    });

    return sanitized;
  } catch (e) {
    console.error('Error loading invoices:', e);
    return INITIAL_INVOICES;
  }
}

export function saveInvoices(invoices: Invoice[]): void {
  try {
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  } catch (e) {
    console.error('Error saving invoices:', e);
  }
}

export function loadProfile(): BusinessProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error loading profile:', e);
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: BusinessProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving profile:', e);
  }
}

export function loadClients(): Client[] {
  try {
    const raw = localStorage.getItem(CLIENTS_KEY);
    if (!raw) return INITIAL_CLIENTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CLIENTS;
  } catch (e) {
    console.error('Error loading clients:', e);
    return INITIAL_CLIENTS;
  }
}

export function saveClients(clients: Client[]): void {
  try {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  } catch (e) {
    console.error('Error saving clients:', e);
  }
}

/**
 * Automatically creates or updates a client profile when an invoice is issued.
 */
export function recordClientFromInvoice(
  clientName: string,
  clientPhone: string,
  amount: number,
  item: string
): Client {
  const clients = loadClients();
  const trimmedName = clientName.trim();
  const trimmedPhone = clientPhone.trim();

  // Match by phone first, or by name (case-insensitive)
  const existingIndex = clients.findIndex((c) => {
    if (trimmedPhone && c.phone && c.phone === trimmedPhone) return true;
    return c.name.toLowerCase() === trimmedName.toLowerCase();
  });

  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    const existing = clients[existingIndex];
    const updated: Client = {
      ...existing,
      name: trimmedName || existing.name,
      phone: trimmedPhone || existing.phone,
      totalSpent: (existing.totalSpent || 0) + (amount || 0),
      invoiceCount: (existing.invoiceCount || 0) + 1,
      lastInvoiceAt: now,
      favoriteItem: item || existing.favoriteItem,
    };
    clients[existingIndex] = updated;
    saveClients(clients);
    return updated;
  } else {
    const newClient: Client = {
      id: `cli-${Date.now()}`,
      name: trimmedName,
      phone: trimmedPhone,
      totalSpent: amount || 0,
      invoiceCount: 1,
      lastInvoiceAt: now,
      favoriteItem: item,
    };
    const updatedClients = [newClient, ...clients];
    saveClients(updatedClients);
    return newClient;
  }
}
