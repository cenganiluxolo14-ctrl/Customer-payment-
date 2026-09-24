import React from 'react';
import { formatZAR } from '../utils/whatsapp';
import { Invoice } from '../types';

interface StatsBannerProps {
  invoices: Invoice[];
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ invoices }) => {
  const totalPaid = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.price, 0);

  const totalPending = invoices
    .filter((inv) => inv.status === 'pending' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.price, 0);

  const pendingCount = invoices.filter(
    (inv) => inv.status === 'pending' || inv.status === 'overdue'
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Pending / Debt to collect */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 transition-all">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
          <span>Uncollected Debt</span>
          <span className="font-mono text-amber-400 font-medium">
            {pendingCount} {pendingCount === 1 ? 'client' : 'clients'}
          </span>
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">
          {formatZAR(totalPending)}
        </div>
        <p className="text-[11px] text-neutral-500 mt-1">
          Outstanding money waiting to be settled
        </p>
      </div>

      {/* Paid / Collected this month */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 transition-all">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
          <span>Collected Revenue</span>
          <span className="font-mono text-emerald-400 font-medium">
            {invoices.filter((i) => i.status === 'paid').length} paid
          </span>
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
          {formatZAR(totalPaid)}
        </div>
        <p className="text-[11px] text-neutral-500 mt-1">
          Settled via PayShap, Capitec or EFT
        </p>
      </div>

      {/* Total Invoices */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 transition-all">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
          <span>Total Invoiced</span>
          <span className="font-mono text-neutral-400 font-medium">
            {invoices.length} slips
          </span>
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-neutral-100">
          {formatZAR(totalPaid + totalPending)}
        </div>
        <p className="text-[11px] text-neutral-500 mt-1">
          Lifetime turnover recorded on Seal
        </p>
      </div>
    </div>
  );
};
