import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import RoomCard from './RoomCard';

const HousekeepingView: React.FC = () => {
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    const getData = async () => {
      // Pulls your actual rooms (Luxury Suite 101, etc.) from Supabase
      const { data } = await supabase.from('rooms').select('*').order('name');
      if (data) setRooms(data);
    };
    getData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b p-6 mb-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold serif text-gray-900">Elite Guest House</h1>
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase">Live Dashboard</span>
        </div>
      </header>

      {/* Grid: 1 col on phone, 2 on tablet, 3 on desktop */}
      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <RoomCard 
            key={room.id}
            id={room.id}
            name={room.name}
            housekeeping_status={room.housekeeping_status}
          />
        ))}
      </main>
    </div>
  );
};

export default HousekeepingView;