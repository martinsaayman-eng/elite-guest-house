import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

// This is the "Interface" that fixes the red lines in your other file
interface RoomProps {
  id: string;
  name: string;
  housekeeping_status: string;
}

const RoomCard: React.FC<RoomProps> = ({ id, name, housekeeping_status }) => {
  const [status, setStatus] = useState(housekeeping_status);

  const toggleStatus = async () => {
    const newStatus = status === 'clean' ? 'dirty' : 'clean';
    const { error } = await supabase
      .from('rooms')
      .update({ housekeeping_status: newStatus })
      .eq('id', id);

    if (!error) setStatus(newStatus);
  };

  return (
    <div className={`p-6 border-2 rounded-2xl shadow-sm transition-all ${
      status === 'dirty' ? 'border-red-500 bg-red-50 animate-pulse' : 'border-green-500 bg-green-50'
    }`}>
      <h3 className="text-2xl font-bold serif text-gray-800 mb-2">{name}</h3>
      <p className="mb-4 text-sm font-semibold uppercase tracking-wider">
        Status: <span className={status === 'dirty' ? 'text-red-600' : 'text-green-600'}>{status}</span>
      </p>
      <button 
        onClick={toggleStatus}
        className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold active:scale-95 transition-transform"
      >
        Mark as {status === 'clean' ? 'Dirty' : 'Clean'}
      </button>
    </div>
  );
};

export default RoomCard;