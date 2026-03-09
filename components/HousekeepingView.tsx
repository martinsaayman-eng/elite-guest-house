import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import RoomCard from './RoomCard';

// 👇 Define proper TypeScript type, update this to match all columns on your Supabase rooms table
type Room = {
  id: number | string;
  name: string;
  housekeeping_status: 'clean' | 'dirty' | 'in_progress' | string;
  // add other columns you use here (floor, last_cleaned, etc)
}

const HousekeepingView: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  // Optional but highly recommended: loading / error states for better UX
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    // Fixes React 18 Strict Mode double fetch + memory leaks
    const controller = new AbortController();
    let isMounted = true;

    const getData = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        // 🟢 We fixed the broken cut off Supabase query here
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .order('name', { ascending: true })
          .abortSignal(controller.signal)

        if (error) throw error;
        if (data && isMounted) setRooms(data as Room[]);

      } catch (err) {
        if(isMounted) setFetchError(err instanceof Error ? err.message : 'Failed to load rooms');
        console.error("Supabase fetch error: ", err)
      } finally {
        if(isMounted) setIsLoading(false);
      }
    };

    getData();

    // Cleanup runs when component unmounts
    return () => {
      isMounted = false;
      controller.abort();
    }
  }, []);

  // Render loading / error states instead of empty screen
  if (isLoading) return <div className="p-8 text-center">Loading room list...</div>
  if (fetchError) return <div className="p-8 text-center text-red-500">❌ Error: {fetchError}</div>

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <header className="bg-white border-b p-6 mb-8 text-center md:text-left">
        <div className="max-w-7xl mx-auto">
          {/* 🟢 Fixed cut off header text */}
          <h1 className="text-3xl font-bold serif text-gray-900">Elite Guest House</h1>
          <p className="text-gray-500 text-sm">Housekeeping Management Dashboard</p>
        </div>
      </header>

      {/* 🟢 Fixed responsive grid: 1 column on mobile, 3 columns on desktop */}
      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {
          rooms.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 py-12">No rooms found in your Supabase database</p>
          ) :
          rooms.map((room) => (
            <RoomCard
              key={room.id}
              id={room.id}
              name={room.name}
              housekeeping_status={room.housekeeping_status}
              /*
                🟢 If you still get red wavy errors here:
                Open RoomCard.tsx and make sure your component interface accepts these EXACT prop names!
                Your RoomCard props should look like this:
                interface RoomCardProps {
                  id: string | number;
                  name: string;
                  housekeeping_status: string;
                }
              */
            />
          ))
        }
      </main>
    </div>
  )
}

// 🟢 You were missing this required export
export default HousekeepingView;