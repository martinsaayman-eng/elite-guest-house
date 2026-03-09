
import React, { useState } from 'react';
import { Booking, Room } from '../types';
import { GUEST_HOUSE_NAME, BUSINESS_DETAILS, GUEST_HOUSE_ADDRESS } from '../constants';
import { downloadInvoicePDF } from '../src/utils/pdfGenerator';

/**
 * SARS COMPLIANT INVOICE CALCULATION 
 * Calculates the 15% VAT breakdown from a total amount.
 */
const calculateSouthAfricanTax = (totalCents: number) => {
  // SARS uses 15% VAT. 
  // To find the VAT amount inside a price, we use the "VAT Fraction" (15/115)
  const vatAmountCents = Math.round(totalCents * (15 / 115));
  const amountExcludingVatCents = totalCents - vatAmountCents;

  return {
    total: (totalCents / 100).toFixed(2),
    vat: (vatAmountCents / 100).toFixed(2),
    subtotal: (amountExcludingVatCents / 100).toFixed(2)
  };
};

interface PrintableInvoiceProps {
  booking: Booking;
  rooms: Room[];
  business: typeof BUSINESS_DETAILS;
  onClose: () => void;
  settings: { 
    name: string, 
    address: string, 
    phone: string, 
    vatNumber: string,
    bankName?: string,
    accountHolder?: string,
    accountNumber?: string,
    branchCode?: string
  };
  isQuotation?: boolean;
}

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ booking, rooms, business, onClose, settings, isQuotation }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const room = rooms.find(r => r.id === booking.room_id);
  
  // Calculate totals
  const totalCharges = (booking.transactions || [])
    .filter(t => t.type === 'charge' || t.type === 'adjustment')
    .reduce((sum, t) => sum + (t.amount_cents > 0 ? t.amount_cents : 0), 0);
    
  const totalPaid = (booking.transactions || [])
    .filter(t => t.type === 'payment' || t.type === 'refund' || t.type === 'reversal')
    .reduce((sum, t) => sum + Math.abs(t.amount_cents < 0 ? t.amount_cents : 0), 0);

  const balanceDue = (booking.transactions || []).reduce((sum, t) => sum + t.amount_cents, 0);

  return (
    <div className="fixed inset-0 bg-white z-[200] p-10 overflow-y-auto text-slate-800 font-sans">
      {/* Hide this button when printing */}
      <div className="flex justify-between mb-10 print:hidden">
        <button onClick={onClose} className="px-6 py-2 bg-slate-100 rounded-xl font-bold hover:bg-slate-200 transition-all">← Back to App</button>
        <div className="flex gap-4">
          <button 
            disabled={isGenerating}
            onClick={async () => {
              setIsGenerating(true);
              await downloadInvoicePDF(booking.id, booking.guest_name);
              setIsGenerating(false);
            }} 
            className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Download PDF'}
          </button>
          <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">Print</button>
        </div>
      </div>

      <div id="invoice-printable-area" className="max-w-4xl mx-auto border p-10 rounded-sm shadow-sm bg-white">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">{settings.name}</h1>
            <p className="text-sm text-slate-500 mt-2 whitespace-pre-line">{settings.address}</p>
            <p className="text-sm font-bold mt-2">Reg: {business.regNumber}</p>
            {(settings.vatNumber || business.vatNumber) && <p className="text-sm font-bold">VAT: {settings.vatNumber || business.vatNumber}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black text-slate-400 uppercase">{isQuotation ? 'Quotation' : 'Tax Invoice'}</h2>
            <p className="font-bold mt-2">{isQuotation ? 'Quote' : 'Invoice'} #: {booking.id.toUpperCase().slice(0, 8)}</p>
            <p className="text-sm">Date: {new Date().toLocaleDateString('en-ZA')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 my-10">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">Bill To:</p>
            <p className="text-xl font-bold">{booking.guest_name}</p>
            <p className="text-sm">{booking.guest_phone}</p>
            <p className="text-sm">{booking.guest_email}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-slate-400">Stay Details:</p>
            <p className="text-sm font-bold">Unit: {room?.name}</p>
            <p className="text-sm italic">{booking.check_in} to {booking.check_out}</p>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="py-4 text-[10px] font-black uppercase">Description</th>
              <th className="py-4 text-[10px] font-black uppercase">Date</th>
              <th className="py-4 text-right text-[10px] font-black uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(booking.transactions || []).map((tx) => (
              <tr key={tx.id} className="border-b border-slate-100">
                <td className="py-4 text-sm font-medium">{tx.note}</td>
                <td className="py-4 text-sm text-slate-500">{new Date(tx.created_at).toLocaleDateString('en-ZA')}</td>
                <td className={`py-4 text-right font-bold ${tx.amount_cents < 0 ? 'text-emerald-600' : ''}`}>
                  {tx.amount_cents < 0 ? '-' : ''}R{(Math.abs(tx.amount_cents) / 100).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-10 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal (Excl. VAT):</span>
              <span className="font-bold font-mono">R{calculateSouthAfricanTax(totalCharges).subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>VAT (15%):</span>
              <span className="font-bold font-mono">R{calculateSouthAfricanTax(totalCharges).vat}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
              <span>Total Charges:</span>
              <span className="font-bold font-mono">R{(totalCharges / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Total Paid:</span>
              <span className="font-bold font-mono">-R{(totalPaid / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl border-t-2 border-slate-900 pt-2">
              <span className="font-black uppercase">Balance Due:</span>
              <span className="font-black font-mono">R{(balanceDue / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-20 p-6 bg-slate-50 rounded-xl">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Banking Details for Payment:</p>
          <div className="grid grid-cols-2 gap-4 text-[11px]">
            <p><strong>Bank:</strong> {settings.bankName || business.bankName}</p>
            <p><strong>Account:</strong> {settings.accountNumber || business.accountNumber}</p>
            <p><strong>Holder:</strong> {settings.accountHolder || settings.name}</p>
            <p><strong>Branch:</strong> {settings.branchCode || business.branchCode}</p>
            <p><strong>Ref:</strong> {booking.id.toUpperCase().slice(0, 8)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableInvoice;
