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
      {/* Header: Centered on phone, wide on desktop */}
      <header className="bg-white shadow-sm p-6 mb-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold serif text-gray-900">Elite Guest House</h1>
          <p className="hidden md:block text-gray-500 italic">Desktop Management Portal</p>
        </div>
      </header>

      {/* Responsive Grid System:
          - 1 column on phones
          - 2 columns on tablets
          - 3 columns on desktops
      */}
      <main className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomCard 
              key={room.id}
              id={room.id}
              name={room.name}
              housekeeping_status={room.housekeeping_status}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default HousekeepingView;