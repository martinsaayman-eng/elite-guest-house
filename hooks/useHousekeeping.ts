
import { useState, useEffect, useMemo } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Booking, HousekeepingStatus } from '../types';
import { ROOMS } from '../src/constants';

export const useHousekeeping = (bookings: Booking[], supabase: SupabaseClient | null) => {
  const [housekeeping, setHousekeeping] = useState<Record<string, HousekeepingStatus>>({});
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const saved = localStorage.getItem('housekeeping');
    if (saved) {
      setHousekeeping(JSON.parse(saved));
    } else {
      const initial: Record<string, HousekeepingStatus> = {};
      ROOMS.forEach(r => initial[r.id] = 'clean');
      setHousekeeping(initial);
    }
  }, []);

  useEffect(() => {
    // In the new schema, we don't have autoDirtyApplied flag on booking. 
    // We'll track it locally or assume it's checked out if date passed and status is not dirty.
    const bookingsToDirty = bookings.filter(b => 
      b.check_out <= todayStr && 
      b.status === 'confirmed' && 
      b.check_in_status !== 'checked-out'
    );

    if (bookingsToDirty.length > 0) {
      setHousekeeping(prev => {
        const next = { ...prev };
        let changed = false;
        bookingsToDirty.forEach(b => { 
          if (next[b.room_id] !== 'dirty') {
            next[b.room_id] = 'dirty';
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem('housekeeping', JSON.stringify(next));
          return next;
        }
        return prev;
      });
    }
  }, [bookings, todayStr]);

  const resetHousekeeping = () => {
    const initial: Record<string, HousekeepingStatus> = {};
    ROOMS.forEach(r => initial[r.id] = 'clean');
    setHousekeeping(initial);
    localStorage.setItem('housekeeping', JSON.stringify(initial));
  };

  const updateHousekeeping = (roomId: string, status: HousekeepingStatus) => {
    setHousekeeping(prev => {
      const next = { ...prev, [roomId]: status };
      localStorage.setItem('housekeeping', JSON.stringify(next));
      return next;
    });
  };

  const pendingTurnovers = useMemo(() => 
    ROOMS.filter(r => housekeeping[r.id] === 'dirty'), 
  [housekeeping]);

  return { housekeeping, updateHousekeeping, resetHousekeeping, pendingTurnovers };
};
