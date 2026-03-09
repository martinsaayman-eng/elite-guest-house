
import { Booking, Room } from '../../types';

export interface OperationalIssue {
  id: string;
  type: 'OPERATIONS' | 'REVENUE' | 'CRITICAL';
  message: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * OPERATIONS SAFETY SCANNER
 * This function detects non-financial mistakes that hurt the business.
 */
export const scanForOperationalFaults = (bookings: Booking[], rooms: Room[], todayDate = new Date()): OperationalIssue[] => {
  const issues: OperationalIssue[] = [];
  
  // Use local date string to avoid UTC shifts
  const todayStr = todayDate.toLocaleDateString('en-CA'); // YYYY-MM-DD

  bookings.forEach(booking => {
    if (booking.status === 'cancelled') return;

    // 1. DETECT: FORGOTTEN CHECK-OUTS
    // If the checkout date has passed but the guest is still "checked-in"
    if (booking.check_out < todayStr && booking.check_in_status === 'checked-in') {
      issues.push({
        id: booking.id,
        type: 'OPERATIONS',
        message: `${booking.guest_name} was due to leave on ${booking.check_out} but is still marked as Checked-In.`,
        severity: 'MEDIUM'
      });
    }

    // 2. DETECT: NO PAYMENTS ON ARRIVAL
    // In SA, many guest houses require a deposit. This flags arrivals with R0 paid.
    const totalPaid = (booking.transactions || [])
      .filter(tx => tx.type === 'payment' || tx.type === 'reversal')
      .reduce((sum, tx) => sum + Math.abs(tx.amount_cents < 0 ? tx.amount_cents : 0), 0);

    if (booking.check_in === todayStr && totalPaid === 0) {
      issues.push({
        id: booking.id,
        type: 'REVENUE',
        message: `Arrival Today: ${booking.guest_name} has not made any payments yet.`,
        severity: 'HIGH'
      });
    }
  });

  // 3. DETECT: DOUBLE BOOKINGS (Advanced)
  // We check if two bookings share the same room on the same dates
  for (let i = 0; i < bookings.length; i++) {
    for (let j = i + 1; j < bookings.length; j++) {
      const b1 = bookings[i];
      const b2 = bookings[j];

      if (b1.room_id === b2.room_id && b1.status !== 'cancelled' && b2.status !== 'cancelled') {
        // Check if dates overlap
        if (b1.check_in < b2.check_out && b1.check_out > b2.check_in) {
          issues.push({
            id: `${b1.id}-${b2.id}`,
            type: 'CRITICAL',
            message: `DOUBLE BOOKING: ${b1.guest_name} and ${b2.guest_name} are both assigned to the same room (${b1.room_id}).`,
            severity: 'CRITICAL'
          });
        }
      }
    }
  }

  return issues;
};
