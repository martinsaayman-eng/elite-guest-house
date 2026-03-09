import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import RoomCard from './RoomCard';

const HousekeepingView: React.FC = () => {
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    const getData = async () => {
      // Fetches your rooms from the 'rooms' table
      const { data } = await supabase.from('rooms').select('*').order('name');
      if (data) setRooms(data);
    };
    getData();
  }, []);

  return (
    <div className="max-w-md mx-auto p-4 pb-20">
      <h1 className="text-3xl font-bold serif mb-6">Housekeeping</h1>
      <div className="space-y-2">
        {rooms.map(room => (
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