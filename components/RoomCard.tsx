import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface RoomProps {
  id: string;
  name: string;
  housekeeping_status: string;
}

const RoomCard: React.FC<RoomProps> = ({ id, name, housekeeping_status }) => {
  const [status, setStatus] = useState(housekeeping_status);

  const toggleStatus = async () => {
    const newStatus = status === 'clean' ? 'dirty' : 'clean';
    
    // Updates the database
    const { error } = await supabase
      .from('rooms')
      .update({ housekeeping_status: newStatus })
      .eq('id', id);

    if (!error) setStatus(newStatus);
  };

  return (
    <div className={`p-4 m-2 border-2 rounded-lg ${status === 'dirty' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
      <h3 className="text-lg font-bold">{name}</h3>
      <p className="mb-2">Status: <span className="uppercase font-bold">{status}</span></p>
      <button 
        onClick={toggleStatus}
        className="px-4 py-2 bg-gray-800 text-white rounded-md w-full"
      >
        Mark as {status === 'clean' ? 'Dirty' : 'Clean'}
      </button>
    </div>
  );
};

export default RoomCard;