
import React, { useMemo, useState } from 'react';
import { Booking, LedgerTransaction, Room } from '../types';
import { GUEST_HOUSE_NAME, GUEST_HOUSE_ADDRESS, GUEST_HOUSE_PHONE, BUSINESS_DETAILS } from '../src/constants';
import PrintableInvoice from './PrintableInvoice';
import { downloadInvoicePDF } from '../src/utils/pdfGenerator';

// Shared utility for consistent currency formatting
const formatPrice = (cents: number) => (cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

/**
 * Calculates a summary of the guest ledger for invoice display.
 * Separates original charges from adjustments to "balance out" the view.
 */
const getGuestSummary = (transactions: LedgerTransaction[]) => {
  // 1. PRIMARY CHARGES (Original stay cost)
  const accommodationCharges = transactions.filter(t => t.source === 'system' && !t.note?.toUpperCase().includes('VAT'));
  const netAccommodation = accommodationCharges.reduce((sum, t) => sum + t.amount_cents, 0);

  // 2. CORRECTIONS / ADJUSTMENTS
  const corrections = transactions.filter(t => t.type === 'adjustment' || t.type === 'reversal');
  const netAdjustments = corrections.reduce((sum, t) => sum + t.amount_cents, 0);

  // 3. VAT
  const vatItems = transactions.filter(t => t.note?.toUpperCase().includes('VAT'));
  const netVat = vatItems.reduce((sum, t) => sum + t.amount_cents, 0);

  // 4. ADDITIONAL SERVICES
  const additionalItems = transactions.filter(t => t.source === 'manual' && t.type === 'charge' && !t.note?.toUpperCase().includes('VAT'));
  const netAdditional = additionalItems.reduce((sum, t) => sum + t.amount_cents, 0);

  // 5. PAYMENTS
  const payments = transactions.filter(t => t.type === 'payment' || t.type === 'refund');
  const totalPaid = Math.abs(payments.reduce((sum, t) => sum + Math.min(0, t.amount_cents), 0));

  // 6. TOTALS
  const displayTotal = netAccommodation + netAdjustments + netVat + netAdditional;
  const ledgerBalance = transactions.reduce((sum, t) => sum + t.amount_cents, 0);

  return {
    netAccommodation,
    netAdjustments,
    corrections,
    additionalItems,
    netVat,
    payments,
    displayTotal, 
    displayPaid: totalPaid,
    displayBalance: ledgerBalance
  };
};

/**
 * High-level financial summary for the guest
 */
const SummaryCard = ({ transactions }: { transactions: LedgerTransaction[] }) => {
  const { displayTotal, displayPaid, displayBalance } = getGuestSummary(transactions);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-8 bg-slate-900 rounded-[2rem] text-white mb-8 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>
      </div>
      <div className="relative z-10">
        <p className="text-[9px] uppercase font-black text-slate-600 tracking-[0.2em] mb-1">Stay Total</p>
        <p className="text-2xl font-black">R{formatPrice(displayTotal)}</p>
      </div>
      <div className="relative z-10">
        <p className="text-[9px] uppercase font-black text-slate-600 tracking-[0.2em] mb-1">Total Paid</p>
        <p className="text-2xl font-black text-emerald-400">R{formatPrice(displayPaid)}</p>
      </div>
      <div className="relative z-10 md:text-right border-t md:border-t-0 md:border-l border-slate-700 pt-4 md:pt-0 md:pl-8">
        <p className="text-[9px] uppercase font-black text-slate-600 tracking-[0.2em] mb-1">Balance Due</p>
        <p className={`text-2xl font-black ${displayBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
          {displayBalance <= 0 ? 'SETTLED' : `R${formatPrice(displayBalance)}`}
        </p>
      </div>
    </div>
  );
};

interface InvoiceModalProps {
  booking: Booking;
  rooms: Room[];
  onClose: () => void;
  onUpdatePaymentStatus: (id: string, status: 'pay_full' | 'partial' | 'unpaid') => void;
  onToggleLock: (id: string, isLocked: boolean, reason?: string) => void;
  onReverseTransaction?: (txId: string, reason: string) => void;
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
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ booking, rooms, onClose, settings }) => {
  const [showPrintable, setShowPrintable] = useState(false);
  const [isQuotation, setIsQuotation] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const transactions = booking?.transactions || [];
  const { 
    netAccommodation, 
    netAdjustments,
    corrections,
    additionalItems, 
    netVat, 
    payments,
    displayTotal,
    displayPaid, 
    displayBalance 
  } = useMemo(() => getGuestSummary(transactions), [transactions]);

  if (!booking) return null;

  const formatDate = (d?: string) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleWhatsAppInvoice = () => {
    const phone = booking.guest_phone?.replace(/\D/g, '');
    if (!phone) {
      alert("No phone number found for this guest.");
      return;
    }
    
    const message = `*INVOICE SUMMARY - ${settings.name}*\n\n` +
      `*Guest:* ${booking.guest_name}\n` +
      `*Ref:* ${booking.id.toUpperCase().slice(0, 8)}\n` +
      `*Dates:* ${booking.check_in} to ${booking.check_out}\n\n` +
      `--------------------------\n` +
      `*Stay Total:* R${formatPrice(displayTotal)}\n` +
      `*Amount Paid:* R${formatPrice(displayPaid)}\n` +
      `*Balance Due:* R${formatPrice(displayBalance)}\n` +
      `--------------------------\n\n` +
      `Thank you for choosing ${settings.name}. For any queries, please contact ${settings.phone}.`;
      
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleEmailInvoice = () => {
    if (!booking.guest_email) {
      alert("No email address found for this guest.");
      return;
    }

    const subject = `Invoice from ${settings.name} - Ref: ${booking.id.toUpperCase().slice(0, 8)}`;
    const body = `Dear ${booking.guest_name},\n\n` +
      `Please find the summary of your stay at ${settings.name} below:\n\n` +
      `Booking Reference: ${booking.id.toUpperCase().slice(0, 8)}\n` +
      `Check-In: ${booking.check_in}\n` +
      `Check-Out: ${booking.check_out}\n\n` +
      `Financial Summary:\n` +
      `Total Charges: R${formatPrice(displayTotal)}\n` +
      `Total Payments: R${formatPrice(displayPaid)}\n` +
      `Net Balance: R${formatPrice(displayBalance)}\n\n` +
      `Thank you for your patronage.\n\n` +
      `Kind regards,\n` +
      `Management\n` +
      `${settings.name}\n` +
      `${settings.phone}`;

    window.location.href = `mailto:${booking.guest_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handlePrint = () => {
    setShowPrintable(true);
  };

  const start = new Date(booking.check_in);
  const end = new Date(booking.check_out);
  const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <>
      {showPrintable && (
        <PrintableInvoice 
          booking={booking} 
          rooms={rooms} 
          business={BUSINESS_DETAILS} 
          onClose={() => setShowPrintable(false)} 
          settings={settings}
          isQuotation={isQuotation}
        />
      )}
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 invoice-container">
      <div id="invoice-printable-area" className="p-10 space-y-10 max-h-[90vh] overflow-y-auto no-scrollbar bg-white">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-10">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center shadow-lg">
               <span className="text-white text-4xl font-black italic">G</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 serif">{settings.name}</h2>
              <div className="mt-1 space-y-1">
                <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">{settings.address}</p>
                <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">Phone: {settings.phone}</p>
                <div className="flex gap-4">
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Reg: {BUSINESS_DETAILS.regNumber}</p>
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">VAT: {settings.vatNumber || BUSINESS_DETAILS.vatNumber}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right space-y-1">
            <div className="flex items-center justify-end gap-2 mb-2 no-print">
              <label className="text-[9px] font-black uppercase text-slate-400">Mode:</label>
              <button 
                onClick={() => setIsQuotation(!isQuotation)}
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${isQuotation ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}
              >
                {isQuotation ? 'Quotation' : 'Invoice'}
              </button>
            </div>
            <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">{isQuotation ? 'Quotation' : 'Tax Invoice'}</h1>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{isQuotation ? 'Quote' : 'Invoice'}: <span className="text-slate-900 font-black">#{booking.id.toUpperCase().slice(0, 8)}</span></p>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Date: <span className="text-slate-900 font-black">{new Date().toLocaleDateString('en-ZA')}</span></p>
          </div>
        </div>

        {/* Totals */}
        <SummaryCard transactions={transactions} />

        {/* Dispatch Actions (Hidden on Print) */}
        <div className="dispatch-actions grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
          <button 
            disabled={isGenerating}
            onClick={async () => {
              setIsGenerating(true);
              await downloadInvoicePDF(booking.id, booking.guest_name);
              setIsGenerating(false);
            }}
            className="flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {isGenerating ? 'Generating...' : 'Download PDF'}
          </button>
          <button 
            onClick={handleWhatsAppInvoice}
            className="flex items-center justify-center gap-3 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.483 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.308 1.656zm6.29-4.171c1.589.943 3.13 1.415 4.75 1.417 5.432.002 9.851-4.417 9.854-9.848.002-2.63-1.023-5.103-2.884-6.965C16.248 2.571 13.774 1.548 11.145 1.547c-5.431 0-9.85 4.419-9.853 9.85-.001 1.738.459 3.438 1.326 4.927l-1.03 3.766 3.856-1.012zm11.724-6.177c-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/></svg>
            WhatsApp
          </button>
          <button 
            onClick={handleEmailInvoice}
            className="flex items-center justify-center gap-3 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Email
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center justify-center gap-3 py-4 bg-slate-100 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-md active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-6 border-b border-slate-100">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Guest Details</h4>
            <div className="space-y-2">
              <p className="text-xl font-black text-slate-900">{booking.guest_name}</p>
              <div className="space-y-1 text-sm text-slate-700 font-medium">
                <p>{booking.guest_email || 'No email on record'}</p>
                <p>{booking.guest_phone || 'No phone on record'}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 text-right">
            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Itinerary</h4>
            <div className="space-y-2 text-base font-bold text-slate-900">
                <p><span className="text-slate-600 font-medium uppercase text-[10px] tracking-widest mr-2">Check-In:</span> {formatDate(booking.check_in)}</p>
                <p><span className="text-slate-600 font-medium uppercase text-[10px] tracking-widest mr-2">Check-Out:</span> {formatDate(booking.check_out)}</p>
                <span className="inline-block mt-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[11px] font-black uppercase tracking-[0.2em] border border-blue-100">
                  {nights} Night Stay
                </span>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="space-y-6 pt-6">
           <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em]">Statement of Account</h4>
           
           <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
             <div className="p-8 space-y-6">
                
                {/* Original Accommodation */}
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Accommodation Charge</p>
                    <p className="text-[9px] text-slate-600 font-medium uppercase tracking-tighter italic">Stay Range: {booking.check_in} — {booking.check_out}</p>
                  </div>
                  <p className="text-base font-black text-slate-900">R{formatPrice(netAccommodation)}</p>
                </div>

                {/* Adjustments */}
                {corrections.length > 0 && (
                  <div className="pt-4 border-t border-slate-50 space-y-4">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Account Adjustments</p>
                    {corrections.map((item) => (
                      <div key={item.id} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-slate-800">Administrative Correction</p>
                          <p className="text-[9px] text-slate-600 font-medium uppercase tracking-tighter">{item.effective_date}</p>
                        </div>
                        <p className={`text-sm font-black ${item.amount_cents < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {item.amount_cents < 0 ? '-' : '+'} R{formatPrice(Math.abs(item.amount_cents))}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Services */}
                {additionalItems.length > 0 && (
                  <div className="pt-4 border-t border-slate-50 space-y-4">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Additional Charges</p>
                    {additionalItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-800">{item.note || 'Service'}</p>
                          <p className="text-[9px] text-slate-600 font-medium uppercase tracking-tighter">{item.effective_date}</p>
                        </div>
                        <p className="text-sm font-black text-slate-800">R{formatPrice(item.amount_cents)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tax */}
                <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">VAT (15%)</p>
                    <p className="text-[9px] text-slate-600 font-medium uppercase tracking-tighter italic">Date: {booking.check_in}</p>
                  </div>
                  <p className="text-base font-black text-slate-800">R{formatPrice(netVat)}</p>
                </div>

                {/* Payments */}
                {payments.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">Payments Received</p>
                    {payments.map((p) => (
                      <div key={p.id} className="flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-emerald-700">{p.note || 'Payment Received'}</p>
                          <p className="text-[9px] text-slate-600 font-medium uppercase tracking-tighter">{p.effective_date}</p>
                        </div>
                        <p className="text-sm font-black text-emerald-600">- R{formatPrice(Math.abs(p.amount_cents))}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* SARS VAT BREAKDOWN */}
                <div className="pt-6 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    <span>Subtotal (Excl. VAT)</span>
                    <span>R{calculateSouthAfricanTax(displayTotal).subtotal}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    <span>VAT (15%)</span>
                    <span>R{calculateSouthAfricanTax(displayTotal).vat}</span>
                  </div>
                </div>

                {/* Final Balance */}
                <div className="bg-slate-900 px-8 py-8 flex justify-between items-center text-white mt-6">
                    <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 leading-none">Net Balance Due</p>
                    <p className="text-[8px] text-slate-700 font-bold uppercase mt-1">Rectified Statement</p>
                    </div>
                    <div className="text-right">
                    <p className={`text-3xl font-black ${displayBalance > 0 ? 'text-white' : 'text-emerald-400'}`}>
                        R{formatPrice(displayBalance)}
                    </p>
                    {displayBalance <= 0 && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-lg border border-emerald-400/20 mt-2 inline-block">
                        Account Settled
                        </span>
                    )}
                    </div>
                </div>
             </div>
           </div>
        </div>

        {/* Footer */}
         <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start gap-10">
           <div className="space-y-4 max-w-sm">
             <p className="text-[10px] text-slate-700 font-medium italic">
               Thank you for your patronage. This document provides a final, balanced statement of your stay at {settings.name}.
             </p>
             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-2">
               <h5 className="text-[9px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-2">Banking Details</h5>
               <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                 <p className="text-slate-600 uppercase font-bold">Bank</p>
                 <p className="text-slate-900 font-black">{settings.bankName || BUSINESS_DETAILS.bankName}</p>
                 <p className="text-slate-600 uppercase font-bold">Account</p>
                 <p className="text-slate-900 font-black">{settings.accountNumber || BUSINESS_DETAILS.accountNumber}</p>
                 <p className="text-slate-600 uppercase font-bold">Holder</p>
                 <p className="text-slate-900 font-black">{settings.accountHolder || settings.name}</p>
                 <p className="text-slate-600 uppercase font-bold">Branch</p>
                 <p className="text-slate-900 font-black">{settings.branchCode || BUSINESS_DETAILS.branchCode}</p>
               </div>
             </div>
           </div>
           <button 
             onClick={onClose} 
             className="w-full md:w-auto px-16 py-6 bg-slate-100 text-slate-900 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-slate-200 transition-all active:scale-95 no-print"
           >
             Close Invoice
           </button>
        </div>
      </div>
    </div>
  </>
  );
};

export default InvoiceModal;
