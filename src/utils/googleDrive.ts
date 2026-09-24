import { BusinessProfile, Client, DriveFile, Invoice } from '../types';
import { formatZAR } from './whatsapp';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_NAME = 'Seal Invoices';

/**
 * Searches for or creates a dedicated 'Seal Invoices' folder on Google Drive.
 */
export async function getOrCreateAppFolder(accessToken: string): Promise<string> {
  const query = `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const url = `${DRIVE_API_URL}/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to check Drive folder: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // Folder does not exist, create it
  const createRes = await fetch(`${DRIVE_API_URL}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Invoices and backups automatically synced by Seal WhatsApp Invoicing',
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Failed to create 'Seal Invoices' folder: ${createRes.status} ${errorText}`);
  }

  const createdFolder = await createRes.json();
  return createdFolder.id;
}

/**
 * Generates an executive, print-ready, standalone HTML document for the invoice.
 */
export function generateInvoiceHtml(invoice: Invoice, profile: BusinessProfile): string {
  const isPaid = invoice.status === 'paid';
  const formattedDate = new Date(invoice.createdAt).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const dueDateStr = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : formattedDate;

  const paymentSnippet =
    profile.paymentType === 'payshap' && profile.payshapId
      ? `<div style="margin-top: 8px; font-family: monospace; font-size: 13px; color: #059669;">
          <strong>⚡ PayShap ID:</strong> ${profile.payshapId}
         </div>`
      : `<div style="margin-top: 8px; font-family: monospace; font-size: 13px; color: #374151;">
          <strong>Bank:</strong> ${profile.bankName}<br>
          <strong>Account Number:</strong> ${profile.accountNumber}<br>
          <strong>Branch Code:</strong> ${profile.branchCode}<br>
          <strong>Account Name:</strong> ${profile.accountHolder || profile.businessName}
         </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${invoice.id} - ${profile.businessName}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f9fafb;
      color: #111827;
      padding: 40px 20px;
      line-height: 1.5;
    }
    .invoice-card {
      max-width: 650px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 36px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f3f4f6;
      padding-bottom: 24px;
      margin-bottom: 24px;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-badge {
      width: 52px;
      height: 52px;
      background: #ecfdf5;
      color: #059669;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      font-weight: bold;
    }
    .biz-name {
      font-size: 20px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.02em;
    }
    .biz-sub {
      font-size: 12px;
      color: #6b7280;
    }
    .meta-box {
      text-align: right;
    }
    .invoice-number {
      font-size: 18px;
      font-weight: 800;
      font-family: monospace;
      color: #059669;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 6px;
      background: ${isPaid ? '#d1fae5' : '#fef3c7'};
      color: ${isPaid ? '#065f46' : '#92400e'};
    }
    .billed-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
    }
    .billed-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #6b7280;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .billed-name {
      font-size: 15px;
      font-weight: 700;
      color: #1f2937;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .items-table th {
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .items-table th.amount {
      text-align: right;
    }
    .items-table td {
      padding: 16px 0;
      font-size: 14px;
      border-bottom: 1px solid #f3f4f6;
    }
    .items-table td.amount {
      text-align: right;
      font-weight: 700;
      font-family: monospace;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 16px 0;
      border-bottom: 2px solid #111827;
      margin-bottom: 24px;
    }
    .total-label {
      font-size: 16px;
      font-weight: 700;
    }
    .total-value {
      font-size: 26px;
      font-weight: 900;
      color: #059669;
      font-family: monospace;
    }
    .payment-box {
      background: #f3f4f6;
      border-radius: 12px;
      padding: 18px;
      font-size: 13px;
      margin-bottom: 24px;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      margin-top: 32px;
    }
    @media print {
      body { background: white; padding: 0; }
      .invoice-card { box-shadow: none; border: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div class="logo-container">
        <div class="logo-badge">${profile.logoEmoji || '✂️'}</div>
        <div>
          <div class="biz-name">${profile.businessName}</div>
          <div class="biz-sub">${profile.location || 'East London, South Africa'} ${profile.phone ? '· ' + profile.phone : ''}</div>
        </div>
      </div>
      <div class="meta-box">
        <div style="font-size: 11px; color: #6b7280; font-weight: 700;">OFFICIAL INVOICE</div>
        <div class="invoice-number">#${invoice.id}</div>
        <div class="status-badge">${isPaid ? 'PAID IN FULL ✅' : 'PENDING PAYMENT'}</div>
      </div>
    </div>

    <div class="billed-section">
      <div>
        <div class="billed-title">Billed To</div>
        <div class="billed-name">${invoice.clientName}</div>
        ${invoice.clientPhone ? `<div style="font-size: 12px; color: #6b7280; font-family: monospace;">${invoice.clientPhone}</div>` : ''}
      </div>
      <div style="text-align: right;">
        <div class="billed-title">Issue Date</div>
        <div style="font-size: 13px; font-weight: 600;">${formattedDate}</div>
        ${!isPaid ? `<div style="font-size: 11px; color: #b45309; margin-top: 4px;">Due: ${dueDateStr}</div>` : ''}
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="amount">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${invoice.item}</strong>
            ${invoice.notes ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px; font-style: italic;">Note: ${invoice.notes}</div>` : ''}
          </td>
          <td class="amount">${formatZAR(invoice.price)}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-row">
      <div class="total-label">Total ${isPaid ? 'Paid' : 'Due'}:</div>
      <div class="total-value">${formatZAR(invoice.price)}</div>
    </div>

    ${
      !isPaid
        ? `<div class="payment-box">
            <strong style="color: #111827; font-size: 13px; display: block; margin-bottom: 4px;">💳 Payment Instructions:</strong>
            ${paymentSnippet}
            <div style="margin-top: 8px; font-size: 12px; color: #4b5563;">
              <strong>Reference:</strong> ${invoice.clientName.replace(/\s+/g, '')}
            </div>
            <div style="margin-top: 6px; font-size: 11px; color: #6b7280;">
              Please send Proof of Payment on WhatsApp once processed. Thank you!
            </div>
          </div>`
        : `<div class="payment-box" style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46;">
            <strong>✅ Thank you for your business!</strong><br>
            This receipt confirms payment of ${formatZAR(invoice.price)} received in full.
          </div>`
    }

    <div class="footer">
      Generated with Seal · South Africa's WhatsApp Invoicing Platform for Hustlers
    </div>
  </div>
</body>
</html>`;
}

/**
 * Uploads an individual invoice as a clean standalone HTML document to Google Drive.
 */
export async function uploadInvoiceToDrive(
  accessToken: string,
  invoice: Invoice,
  profile: BusinessProfile
): Promise<DriveFile> {
  const folderId = await getOrCreateAppFolder(accessToken);
  const htmlContent = generateInvoiceHtml(invoice, profile);
  const cleanClientName = invoice.clientName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Invoice-${invoice.id}-${cleanClientName}.html`;

  const metadata = {
    name: fileName,
    mimeType: 'text/html',
    parents: [folderId],
    description: `Seal Invoice #${invoice.id} for ${invoice.clientName} - ${formatZAR(invoice.price)}`,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
    htmlContent +
    closeDelimiter;

  const response = await fetch(
    `${DRIVE_UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,createdTime,modifiedTime`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload invoice to Drive: ${response.status} ${errorText}`);
  }

  const uploadedFile = await response.json();
  return uploadedFile as DriveFile;
}

/**
 * Backs up all invoices and client records as a JSON file to Google Drive.
 */
export async function uploadBackupToDrive(
  accessToken: string,
  invoices: Invoice[],
  clients: Client[],
  profile: BusinessProfile
): Promise<DriveFile> {
  const folderId = await getOrCreateAppFolder(accessToken);
  const todayStr = new Date().toISOString().slice(0, 10);
  const fileName = `Seal_Backup_${todayStr}_${Date.now().toString().slice(-4)}.json`;

  const backupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    profile,
    invoiceCount: invoices.length,
    clientCount: clients.length,
    invoices,
    clients,
  };

  const jsonContent = JSON.stringify(backupData, null, 2);

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    parents: [folderId],
    description: `Full backup of Seal invoices & clients (${invoices.length} invoices, ${clients.length} clients)`,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    jsonContent +
    closeDelimiter;

  const response = await fetch(
    `${DRIVE_UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,createdTime,modifiedTime`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to backup to Drive: ${response.status} ${errorText}`);
  }

  return (await response.json()) as DriveFile;
}

/**
 * Lists all invoice and backup files in the 'Seal Invoices' folder on Google Drive.
 */
export async function listDriveFiles(accessToken: string): Promise<{ files: DriveFile[]; folderLink?: string }> {
  const folderId = await getOrCreateAppFolder(accessToken);

  // Also grab the webViewLink for the folder itself
  let folderLink = `https://drive.google.com/drive/folders/${folderId}`;
  try {
    const folderRes = await fetch(`${DRIVE_API_URL}/files/${folderId}?fields=webViewLink`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (folderRes.ok) {
      const folderData = await folderRes.json();
      if (folderData.webViewLink) folderLink = folderData.webViewLink;
    }
  } catch (err) {
    console.warn('Could not fetch folder webViewLink:', err);
  }

  const query = `'${folderId}' in parents and trashed = false`;
  const url = `${DRIVE_API_URL}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,iconLink)&orderBy=createdTime desc&pageSize=50`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list files from Drive: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return {
    files: (data.files || []) as DriveFile[],
    folderLink,
  };
}

/**
 * Deletes a file from Google Drive.
 * (MANDATORY: MUST be preceded by a user confirmation UI modal before being invoked)
 */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<void> {
  const response = await fetch(`${DRIVE_API_URL}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const errorText = await response.text();
    throw new Error(`Failed to delete file from Drive: ${response.status} ${errorText}`);
  }
}

/**
 * Downloads a file's raw content (e.g. for backup restore or preview).
 */
export async function fetchDriveFileContent(accessToken: string, fileId: string): Promise<string> {
  const response = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to download file from Drive: ${response.status} ${errorText}`);
  }

  return await response.text();
}
