import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import RoomCard from './RoomCard';

const HousekeepingView: React.FC = () => {
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    const getData = async () => {
      // Pulls your actual rooms from Supabase
      const { data } = await supabase.from('rooms').select('*').order('name');
      if (data) setRooms(data);
    };
    getData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <header className="bg-white border-b p-6 mb-8 text-center md:text-left">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold serif text-gray-900">Elite Guest House</h1>
          <p className="text-gray-500 text-sm">Management Dashboard</p>
        </div>
      </header>

      {/* This grid makes it look great on Desktop (3 cols) and Phone (1 col) */}
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