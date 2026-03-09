
import React from 'react';
import { SupabaseClient, Session } from '@supabase/supabase-js';
import { Booking, LedgerTransaction, UserRole } from '../types';

export const usePayments = (
  bookings: Booking[], 
  supabase: SupabaseClient | null, 
  session: Session | null,
  fetchBookings: () => void, 
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>,
  userRoles: UserRole[] = []
) => {

  /**
   * REFINED FINANCIAL AUDIT LOGIC
   * total_charged: The final net amount the guest is expected to pay (including corrections).
   * total_paid: The actual cash/liquid funds received.
   * outstanding: The bottom-line balance.
   */
  const getFinancials = (b: Booking) => {
    // 1. Final Net Billed (Charges + Corrections)
    // We treat adjustments as part of the billing lifecycle, not the payment lifecycle.
    const total_charged = b.transactions
      .filter(t => t.type === 'charge' || t.type === 'adjustment' || t.type === 'reversal')
      .reduce((sum, t) => sum + t.amount_cents, 0);
    
    // 2. Pure Collections (Actual Payments only)
    const total_paid = Math.abs(b.transactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount_cents, 0));

    // 3. Absolute Mathematical Balance
    const outstanding = b.transactions.reduce((sum, t) => sum + t.amount_cents, 0);

    let payment_status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
    
    if (outstanding <= 0) {
      payment_status = 'paid';
    } else if (total_paid > 0) {
      payment_status = 'partial';
    }

    return { total_charged, total_paid, outstanding, payment_status };
  };

  const createTransaction = (
    booking: Booking, 
    type: LedgerTransaction['type'], 
    amount_cents: number, 
    note: string, 
    source: LedgerTransaction['source'] = 'manual',
    reverses_id?: string
  ): LedgerTransaction => {
    return {
      id: crypto.randomUUID(),
      booking_id: booking.id,
      tenant_id: booking.tenant_id,
      property_id: booking.property_id,
      amount_cents,
      type,
      currency: 'ZAR',
      effective_date: new Date().toISOString().split('T')[0],
      source,
      note,
      created_at: new Date().toISOString(),
      created_by: session?.user?.id || 'system-auto',
      role_at_time: (userRoles[0] || 'staff') as any,
      is_locked: false,
      reverses_transaction_id: reverses_id
    };
  };

  const saveTransactions = async (bookingId: string, newTransactions: LedgerTransaction[]) => {
    const b = bookings.find(x => x.id === bookingId);
    if (!b) return;

    const updatedTransactions = [...b.transactions, ...newTransactions];

    if (supabase) {
      await supabase.from('bookings').update({
        transactions: updatedTransactions
      }).eq('id', bookingId);
      await fetchBookings();
    } else {
      setBookings(prev => {
        const next = prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, transactions: updatedTransactions } 
            : booking
        );
        localStorage.setItem('bookings', JSON.stringify(next));
        return next;
      });
    }
  };

  const addPayment = async (bookingId: string, amount: number, note: string) => {
    const b = bookings.find(x => x.id === bookingId);
    if (!b || b.is_locked) return;
    const amountCents = Math.round(amount * 100);
    const tx = createTransaction(b, 'payment', -Math.abs(amountCents), note);
    await saveTransactions(bookingId, [tx]);
  };

  const addCharge = async (bookingId: string, amount: number, note: string) => {
    const b = bookings.find(x => x.id === bookingId);
    if (!b || b.is_locked) return;
    const amountCents = Math.round(amount * 100);
    const tx = createTransaction(b, 'charge', amountCents, note);
    await saveTransactions(bookingId, [tx]);
  };

  const addAdjustment = async (bookingId: string, amount: number, note: string) => {
    const b = bookings.find(x => x.id === bookingId);
    if (!b || b.is_locked) return;
    const amountCents = Math.round(amount * 100);
    // Adjustments are recorded as they are (positive adds to bill, negative subtracts)
    const tx = createTransaction(b, 'adjustment', amountCents, note, 'correction');
    await saveTransactions(bookingId, [tx]);
  };

  const reverseTransaction = async (txId: string, reason: string) => {
    const b = bookings.find(bk => bk.transactions.some(t => t.id === txId));
    if (!b || b.is_locked) return;

    const originalTx = b.transactions.find(t => t.id === txId);
    if (!originalTx) return;

    const reversalTx = createTransaction(
      b, 
      'reversal', 
      -originalTx.amount_cents, 
      `Reversal: ${reason} (Original Ref: ${txId.slice(0,8)})`,
      'correction',
      txId
    );
    await saveTransactions(b.id, [reversalTx]);
  };

  const writeOffBalance = async (bookingId: string, reason: string) => {
    const b = bookings.find(x => x.id === bookingId);
    if (!b || b.is_locked) return;

    const { outstanding } = getFinancials(b);
    if (outstanding === 0) return;

    const adjustmentTx = createTransaction(
      b, 
      'adjustment', 
      -outstanding, 
      `Write-off: ${reason}`,
      'manual'
    );
    await saveTransactions(bookingId, [adjustmentTx]);
  };

  const handleUpdatePaymentStatus = async (bookingId: string, action: 'pay_full' | 'unpaid' | 'partial', note: string | null = null) => {
    const b = bookings.find(x => x.id === bookingId);
    if (!b || b.is_locked) return;
    if (action === 'partial') return;

    const { outstanding } = getFinancials(b);

    if (action === 'pay_full' && outstanding > 0) {
      await addPayment(bookingId, outstanding / 100, note || 'Balance settled');
    } else if (action === 'unpaid') {
      const netPaymentEffect = b.transactions
        .filter(t => t.type === 'payment')
        .reduce((sum, t) => sum + t.amount_cents, 0);

      if (netPaymentEffect !== 0) {
        const tx = createTransaction(b, 'reversal', -netPaymentEffect, note || 'Accounting Reversal', 'correction');
        await saveTransactions(bookingId, [tx]);
      }
    }
  };

  return { 
    addPayment, 
    addCharge, 
    addAdjustment,
    reverseTransaction, 
    writeOffBalance,
    handleUpdatePaymentStatus, 
    getFinancials
  };
};
