import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

// This fixes the red lines by defining exactly what a room "is"
interface RoomProps {
  id: string;
  name: string;
  housekeeping_status: string;
}

const RoomCard: React.FC<RoomProps> = ({ id, name, housekeeping_status }) => {
  const [status, setStatus] = useState(housekeeping_status);
  const [loading, setLoading] = useState(false);

  const toggleStatus = async () => {
    setLoading(true);
    const newStatus = status === 'clean' ? 'dirty' : 'clean';
    
    const { error } = await supabase
      .from('rooms')
      .update({ housekeeping_status: newStatus })
      .eq('id', id);

    if (!error) {
      setStatus(newStatus);
    }
    setLoading(false);
  };

  return (
    <div className={`p-4 m-2 border-2 rounded-xl shadow-sm transition-all ${
      status === 'dirty' ? 'border-red-500 bg-red-50 animate-pulse' : 'border-green-500 bg-green-50'
    }`}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold serif">{name}</h3>
          <p className={`font-bold uppercase text-sm ${status === 'dirty' ? 'text-red-600' : 'text-green-600'}`}>
            {status}
          </p>
        </div>
        <button 
          onClick={toggleStatus}
          disabled={loading}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg font-bold active:bg-black"
        >
          {loading ? '...' : `Set ${status === 'clean' ? 'Dirty' : 'Clean'}`}
        </button>
      </div>
    </div>
  );
};

export default RoomCard;