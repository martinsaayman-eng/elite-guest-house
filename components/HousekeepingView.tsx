import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import RoomCard from './RoomCard';

const HousekeepingView: React.FC = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .order('name');
        
        if (error) throw error;
        if (data) setRooms(data);
      } catch (err) {
        console.error("Error fetching rooms:", err);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  if (loading) {
    return <div className="p-10 text-center">Loading Management Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <header className="bg-white border-b p-6 mb-8 text-center">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Elite Guest-House</h1>
          <p className="text-gray-500 text-sm">Management Dashboard</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <RoomCard
              key={room.id}
              id={room.id}
              name={room.name}
              housekeeping_status={room.housekeeping_status}
            />
          ))
        ) : (
          <div className="col-span-full text-center p-10 bg-white rounded-xl">
            No rooms found in your Supabase database.
          </div>
        )}
      </main>
    </div>
  );
};

export default HousekeepingView;