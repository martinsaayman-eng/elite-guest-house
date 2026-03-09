
import { useMemo } from 'react';
import { Booking, UserContext, AnalyticsSummary, ChartDataPoint } from '../types';
import { ROOMS } from '../constants';

export const useAnalytics = (bookings: Booking[], userContext: UserContext | null) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const analyticsSummary: AnalyticsSummary = useMemo(() => {
    let propertyRooms = ROOMS.filter(r => r.property_id === userContext?.property_id);
    if (propertyRooms.length === 0) propertyRooms = ROOMS;
    
    const propertyRoomIds = new Set(propertyRooms.map(r => r.id));
    const valid = bookings.filter(b => b.status !== 'cancelled' && propertyRoomIds.has(b.room_id));
    
    let totalBilledCents = 0;
    let settledRevenueCents = 0;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Monthly buckets for current year
    const monthlySettledBuckets = Array(12).fill(0);
    const monthlyProjected = Array(12).fill(0);

    // Daily buckets for current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailySettledBuckets = Array(daysInMonth).fill(0);

    // Weekly buckets (last 12 weeks relative to current date)
    const weeklySettledBuckets = Array(12).fill(0);

    valid.forEach(b => {
      const bCharges = b.transactions
        .filter(t => t.type === 'charge' || t.type === 'adjustment')
        .reduce((sum, t) => sum + Math.max(0, t.amount_cents), 0);
      
      const bPayments = Math.abs(b.transactions
        .filter(t => t.type === 'payment' || t.type === 'reversal' || t.type === 'refund')
        .reduce((sum, t) => sum + Math.min(0, t.amount_cents), 0));

      totalBilledCents += bCharges;
      settledRevenueCents += bPayments;

      const checkInDate = new Date(b.check_in);
      if (checkInDate.getFullYear() === currentYear) {
        monthlyProjected[checkInDate.getMonth()] += bCharges;
      }

      if (b.transactions) {
        b.transactions.forEach(tx => {
          const txDate = new Date(tx.created_at);
          const txYear = txDate.getFullYear();
          const txMonth = txDate.getMonth();
          const txDay = txDate.getDate();
          
          if (tx.type === 'payment' || tx.type === 'refund' || tx.type === 'reversal') {
            const val = Math.abs(Math.min(0, tx.amount_cents));

            // Monthly (buckets for current year)
            if (txYear === currentYear) {
              monthlySettledBuckets[txMonth] += val;
            }

            // Daily (buckets for current month)
            if (txYear === currentYear && txMonth === currentMonth) {
              dailySettledBuckets[txDay - 1] += val;
            }

            // Weekly (using a simple week calculation for the last 12 weeks)
            const diffTime = today.getTime() - txDate.getTime();
            const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
            if (diffWeeks >= 0 && diffWeeks < 12) {
              weeklySettledBuckets[11 - diffWeeks] += val;
            }
          }
        });
      }
    });

    const monthlySettled: ChartDataPoint[] = monthlySettledBuckets.map((val, i) => ({
      label: monthNames[i],
      value: val
    }));

    const dailySettled: ChartDataPoint[] = dailySettledBuckets.map((val, i) => ({
      label: (i + 1).toString(),
      value: val
    }));

    const weeklySettled: ChartDataPoint[] = weeklySettledBuckets.map((val, i) => {
      return {
        label: `W${i + 1}`,
        value: val
      };
    });

    const pendingRevenueCents = Math.max(0, totalBilledCents - settledRevenueCents);
    const totalOutstanding = pendingRevenueCents;
    
    const currentOccupied = propertyRooms.filter(r => {
      const roomBookings = bookings.filter(b => b.room_id === r.id && b.status !== 'cancelled');
      return roomBookings.some(b => (todayStr >= b.check_in && todayStr < b.check_out));
    }).length;

    const monthlyExpenses = monthlySettledBuckets.map(revenue => {
      if (revenue === 0) return 0;
      const fixedBase = 800000; 
      const variableRate = 0.35; 
      return fixedBase + Math.round(revenue * variableRate);
    });

    const monthlyProfit = monthlySettledBuckets.map((rev, idx) => rev - monthlyExpenses[idx]);
    
    const maxRevenue = Math.max(...monthlySettledBuckets, ...monthlyProjected, 1);
    const trajectoryScale = monthlySettledBuckets.map(val => (val / maxRevenue) * 100);
    const projectedTrajectoryScale = monthlyProjected.map(val => (val / maxRevenue) * 100);

    const monthlyRevenue = monthlySettledBuckets[currentMonth];
    const totalOwed = totalOutstanding;
    const arrivalsTodayCount = valid.filter(b => b.check_in === todayStr).length;

    return { 
      totalBilledCents, settledRevenueCents, pendingRevenueCents, totalOutstanding,
      occupancyRate: propertyRooms.length > 0 ? (currentOccupied / propertyRooms.length) * 100 : 0, 
      currentOccupied, totalUnits: propertyRooms.length, 
      trajectoryScale, projectedTrajectoryScale,
      monthlySettled, weeklySettled, dailySettled,
      monthlyProjected,
      monthlyExpenses, monthlyProfit,
      arrivalsToday: arrivalsTodayCount,
      monthlyRevenue,
      totalOwed
    };
  }, [bookings, currentYear, currentMonth, todayStr, userContext]);

  return { analyticsSummary };
};
