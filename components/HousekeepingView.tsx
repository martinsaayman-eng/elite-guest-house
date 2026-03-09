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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header that stretches for Desktop */}
      <header className="p-6 bg-white shadow-sm mb-6 flex flex-col md:flex-row md:justify-between md:items-center px-4 lg:px-20">
        <div>
          <h1 className="text-3xl font-bold serif text-gray-900">Elite Housekeeping</h1>
          <p className="text-gray-500 text-sm">Real-time room management</p>
        </div>
      </header>

      {/* The Magic Step: 
         'grid-cols-1' for phones
         'md:grid-cols-2' for tablets
         'lg:grid-cols-3' for desktop screens
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 lg:px-20">
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