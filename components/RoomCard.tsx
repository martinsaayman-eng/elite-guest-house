import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // adjust path as needed

interface RoomProps {
  id: number;
  name: string;
  housekeeping_status: 'clean' | 'dirty';
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
        // FIX 1: Use a template literal (`...`) and ternary operator for the conditional class
        status === 'dirty' ? 'border-red-500 bg-red-50 animate-pulse' : 'border-green-500 bg-green-50'
      }`}>
      
      {/* FIX 2: Wrap {name} in curly braces */}
      <h3 className="text-2xl font-bold serif text-gray-800 mb-2">{name}</h3>
      
      <p className="mb-4 text-sm font-semibold uppercase tracking-wider">
        Status:{' '}
        {/* FIX 3: Correctly apply the conditional class to the span */}
        <span className={status === 'dirty' ? 'text-red-600' : 'text-green-600'}>
          {status}
        </span>
      </p>

      <button
        onClick={toggleStatus}
        className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-700 transition-colors"
      >
        Mark as {status === 'clean' ? 'Dirty' : 'Clean'}
      </button>
    </div>
  );
};

export default RoomCard;