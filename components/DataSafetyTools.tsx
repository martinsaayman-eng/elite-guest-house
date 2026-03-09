
import React from 'react';
import { Booking, Expense } from '../types';

interface DataSafetyToolsProps {
  allBookings: Booking[];
  allExpenses: Expense[];
}

const DataSafetyTools: React.FC<DataSafetyToolsProps> = ({ allBookings, allExpenses }) => {

  // FEATURE 1: Manual Backup (Saves a file to the computer)
  const downloadBackup = () => {
    const dataToSave = {
      timestamp: new Date().toISOString(),
      bookings: allBookings,
      expenses: allExpenses,
      version: "1.0-SA-Compliant"
    };

    const dataString = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([dataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `GuestHouse_Backup_${new Date().toLocaleDateString()}.json`;
    link.click();
    
    alert("Backup Saved! Keep this file on a USB stick for safety.");
  };

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-6 my-4 rounded-r-xl shadow-sm">
      <h3 className="text-amber-800 font-bold mb-2 uppercase text-sm tracking-widest flex items-center gap-2">
        🛡️ Data Safety Center
      </h3>
      <p className="text-sm text-amber-700 mb-4">
        Don't lose your data! Browsers can be unpredictable. 
        Download a backup once a day to ensure your records are safe.
      </p>
      
      <button 
        onClick={downloadBackup}
        className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-xs uppercase tracking-widest"
      >
        Download Safety Backup
      </button>
    </div>
  );
};

export default DataSafetyTools;
