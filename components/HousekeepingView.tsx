import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import RoomCard from './RoomCard';

const HousekeepingView: React.FC = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data) {
        setRooms(data);
      }
      setLoading(false);
    };
    fetchRooms();
  }, []);

  if (loading) return <div className="p-10 text-center">Loading Rooms...</div>;

  return (
    <div className="max-w-md mx-auto pb-20 bg-gray-50 min-h-screen">
      <header className="p-6 bg-white shadow-sm mb-4 text-center">
        <h1 className="text-3xl font-bold serif text-gray-900">Elite Housekeeping</h1>
        <p className="text-gray-500 text-sm">Tap buttons to update status</p>
      </header>
      <div className="space-y-1 px-2">
        {rooms.map((room) => (
          <RoomCard 
            key={room.id}
            id={room.id}
            name={room.name}
            housekeeping_status={room.housekeeping_status}
          />
        ))}
      </div>
    </div>
  );
};

export default HousekeepingView;