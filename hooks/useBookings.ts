
import { useState, useEffect, useCallback } from 'react';
import { SupabaseClient, Session } from '@supabase/supabase-js';
import { Booking, UserContext } from '../types';

export const useBookings = (
  session: Session | null, 
  isConfigured: boolean, 
  supabase: SupabaseClient | null,
  userContext: UserContext | null
) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!userContext) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    if (supabase && session) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('tenant_id', userContext.tenant_id)
          .eq('property_id', userContext.property_id)
          .order('check_in', { ascending: true });
        
        if (error) throw error;
        setBookings(data || []);
      } catch (e) {
        console.error("Fetch bookings failed:", e);
      } finally {
        setLoading(false);
      }
    } else {
      // Local Storage Mode
      const saved = localStorage.getItem('bookings');
      if (saved) {
        try {
          const all: Booking[] = JSON.parse(saved);
          const filtered = all.filter(b => 
            b.property_id === userContext.property_id || !b.property_id
          );
          setBookings(filtered);
        } catch (e) {
          console.error("Local parse failed", e);
          setBookings([]);
        }
      } else {
        setBookings([]);
        if (!isConfigured) {
          localStorage.setItem('bookings', JSON.stringify([]));
        }
      }
      setLoading(false);
    }
  }, [supabase, session, isConfigured, userContext]);

  useEffect(() => {
    if (!supabase || !session || !userContext) return;
    
    const channel = supabase
      .channel(`context:${userContext.tenant_id}:${userContext.property_id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings',
        filter: `tenant_id=eq.${userContext.tenant_id}`
      }, () => {
        fetchBookings();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [supabase, session, fetchBookings, userContext]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const checkOverlap = (newBooking: Booking, existingBookings: Booking[]) => {
    return existingBookings.some(existing => {
      // Ignore self, cancelled bookings, and different rooms
      if (existing.id === newBooking.id || existing.status === 'cancelled' || existing.room_id !== newBooking.room_id) {
        return false;
      }
      // Standard interval overlap: (StartA < EndB) AND (EndA > StartB)
      return (newBooking.check_in < existing.check_out) && (newBooking.check_out > existing.check_in);
    });
  };

  const handleConfirmBooking = async (booking: Booking | Booking[], ignoreExisting: boolean = false) => {
    if (!userContext) return;
    
    const toAdd = Array.isArray(booking) ? booking : [booking];
    const bookingsWithContext = toAdd.map(b => ({
      ...b,
      tenant_id: b.tenant_id || userContext.tenant_id,
      property_id: b.property_id || userContext.property_id,
      created_at: b.created_at || new Date().toISOString()
    }));

    // Data-level verification against current state
    const currentAll = ignoreExisting ? [] : [...bookings];
    const validToAdd: Booking[] = [];

    for (const b of bookingsWithContext) {
      if (checkOverlap(b, [...currentAll, ...validToAdd])) {
        console.error(`Blocked overlapping booking for room ${b.room_id} guest ${b.guest_name}`);
        // If it's a single booking, alert the user. If batch (demo), we just skip it to keep the schedule clean.
        if (bookingsWithContext.length === 1) {
          alert(`Validation Error: Overlapping stay detected for ${b.guest_name}. Operation aborted to preserve inventory integrity.`);
          return;
        }
        continue; // Skip this one in a batch
      }
      validToAdd.push(b);
    }

    if (validToAdd.length === 0) return;

    if (supabase && session) {
      const { error } = await supabase.from('bookings').insert(validToAdd);
      if (error) console.error("Error inserting bookings:", error);
      await fetchBookings();
    } else {
      const saved = localStorage.getItem('bookings');
      const storageExisting: Booking[] = saved ? JSON.parse(saved) : [];
      const newIds = new Set(validToAdd.map(b => b.id));
      const filteredExisting = storageExisting.filter(e => !newIds.has(e.id));
      const next = [...filteredExisting, ...validToAdd];
      
      localStorage.setItem('bookings', JSON.stringify(next));
      setBookings(next.filter(b => b.property_id === userContext.property_id || !b.property_id));
    }
  };

  const handleUpdateCheckInStatus = async (bookingId: string, status: Booking['check_in_status']) => {
    if (supabase && session) {
      await supabase.from('bookings').update({ check_in_status: status }).eq('id', bookingId);
      await fetchBookings();
    } else {
      setBookings(prev => {
        const next = prev.map(b => b.id === bookingId ? { ...b, check_in_status: status } : b);
        const saved = localStorage.getItem('bookings');
        const existing: Booking[] = saved ? JSON.parse(saved) : [];
        const nextStorage = existing.map(b => b.id === bookingId ? { ...b, check_in_status: status } : b);
        localStorage.setItem('bookings', JSON.stringify(nextStorage));
        return next;
      });
    }
  };

  const handleCheckIn = (bookingId: string) => handleUpdateCheckInStatus(bookingId, 'checked-in');

  const handleUpdateStatus = async (bookingId: string, status: Booking['status']) => {
    if (supabase && session) {
      await supabase.from('bookings').update({ status }).eq('id', bookingId);
      await fetchBookings();
    } else {
      setBookings(prev => {
        const next = prev.map(b => b.id === bookingId ? { ...b, status } : b);
        const saved = localStorage.getItem('bookings');
        const existing: Booking[] = saved ? JSON.parse(saved) : [];
        const nextStorage = existing.map(b => b.id === bookingId ? { ...b, status } : b);
        localStorage.setItem('bookings', JSON.stringify(nextStorage));
        return next;
      });
    }
  };

  const handleLockBooking = async (bookingId: string, isLocked: boolean) => {
    if (supabase && session) {
      await supabase.from('bookings').update({ is_locked: isLocked }).eq('id', bookingId);
      await fetchBookings();
    } else {
      setBookings(prev => {
        const next = prev.map(b => b.id === bookingId ? { ...b, is_locked: isLocked } : b);
        const saved = localStorage.getItem('bookings');
        const existing: Booking[] = saved ? JSON.parse(saved) : [];
        const nextStorage = existing.map(b => b.id === bookingId ? { ...b, is_locked: isLocked } : b);
        localStorage.setItem('bookings', JSON.stringify(nextStorage));
        return next;
      });
    }
  };

  const handleUpdateRoom = async (bookingId: string, roomId: string) => {
    // 1. Find the booking we are trying to move
    const movedBooking = bookings.find(b => b.id === bookingId);
    if (!movedBooking) return;

    // 2. CHECK FOR COLLISIONS
    const hasClash = bookings.some(b => {
      // Skip checking the booking against itself or cancelled ones
      if (b.id === bookingId || b.status === 'cancelled') return false;
      
      // Only look at bookings in the new destination room
      if (b.room_id !== roomId) return false;

      // The Logic: Do the dates overlap?
      const clash = movedBooking.check_in < b.check_out && movedBooking.check_out > b.check_in;
      return clash;
    });

    if (hasClash) {
      alert("⛔ Cannot move: This room is already occupied during those dates!");
      return; // Stop here! Don't update the UI or Database.
    }

    // 3. OPTIMISTIC UPDATE (If no clash, proceed as normal)
    const originalBookings = [...bookings];
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, room_id: roomId } : b));

    try {
      if (supabase && session) {
        // STEP 2: Tell your Database/Server about the change
        const { error } = await supabase
          .from('bookings')
          .update({ room_id: roomId })
          .eq('id', bookingId);

        if (error) throw error;
        console.log("Success: Room changed in database!");
      } else {
        // Local Storage Mode
        const saved = localStorage.getItem('bookings');
        const existing: Booking[] = saved ? JSON.parse(saved) : [];
        const nextStorage = existing.map(b => b.id === bookingId ? { ...b, room_id: roomId } : b);
        localStorage.setItem('bookings', JSON.stringify(nextStorage));
      }
    } catch (error) {
      // STEP 3: If the server fails, roll back to the original state
      console.error("Error: Could not save change. Rolling back...", error);
      setBookings(originalBookings);
      alert("Connection error: Change not saved.");
    }
  };

  const handleClearBookings = async () => {
    if (supabase && session) {
       await supabase.from('bookings').delete().eq('tenant_id', userContext?.tenant_id);
       await fetchBookings();
    } else {
        localStorage.setItem('bookings', JSON.stringify([]));
        setBookings([]);
    }
  };

  return { bookings, loading, fetchBookings, handleConfirmBooking, handleCheckIn, handleUpdateCheckInStatus, handleUpdateStatus, handleLockBooking, handleUpdateRoom, handleClearBookings, setBookings };
};
