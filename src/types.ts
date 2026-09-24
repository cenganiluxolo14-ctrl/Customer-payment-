export type InvoiceStatus = 'pending' | 'paid' | 'overdue';

export interface Client {
  id: string;
  name: string;
  phone: string;
  notes?: string;
  totalSpent: number;
  invoiceCount: number;
  lastInvoiceAt: string;
  favoriteItem?: string;
}

export interface Invoice {
  id: string;
  clientName: string;
  clientPhone: string;
  clientId?: string;
  item: string;
  price: number;
  status: InvoiceStatus;
  createdAt: string;
  dueDate: string;
  notes?: string;
  paidAt?: string;
  lastRemindedAt?: string;
  reminderCount: number;
}

export type PaymentMethodType = 'payshap' | 'capitec' | 'eft' | 'ozow';

export interface BusinessProfile {
  businessName: string;
  ownerName: string;
  phone: string;
  location: string;
  paymentType: PaymentMethodType;
  payshapId: string;
  bankName: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  accountHolder: string;
  tagline: string;
  accentColor: string;
  logoEmoji: string;
  logoUrl?: string;
}

export interface ParsedWhatsAppMessage {
  clientName: string;
  item: string;
  price: number;
  clientPhone?: string;
  confidence: number;
  rawText: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
}

