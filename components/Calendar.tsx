
import React, { useState } from 'react';
import { Booking, Room } from '../types';
import { ROOMS } from '../src/constants';

interface CalendarProps {
  roomId: string;
  existingBookings: Booking[];
  onRangeSelect: (start: string, end: string) => void;
  selectedStart: string;
  selectedEnd: string;
}

const Calendar: React.FC<CalendarProps> = ({ 
  roomId, 
  existingBookings, 
  onRangeSelect, 
  selectedStart, 
  selectedEnd 
}) => {
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const room = ROOMS.find(r => r.id === roomId);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  
  const firstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return (day + 6) % 7;
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString('default', { month: 'long' });

  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDayOfMonth(year, month) }, (_, i) => i);

  const isOccupied = (dateStr: string) => {
    return existingBookings.some(b => {
      if (b.status === 'cancelled') return false;
      const start = b.check_in;
      const end = b.check_out;
      // Occupied if it's strictly between start and end
      // Check-in day is occupied in the afternoon
      // Check-out day is occupied in the morning
      return dateStr >= start && dateStr < end;
    });
  };

  const isFullyOccupied = (dateStr: string) => {
    return existingBookings.some(b => {
      if (b.status === 'cancelled') return false;
      const start = b.check_in;
      const end = b.check_out;
      // Fully occupied if it's not a check-in or check-out day (i.e., a stay day)
      return dateStr > start && dateStr < end;
    });
  };

  const isSelected = (dateStr: string) => {
    if (!selectedStart) return false;
    if (dateStr === selectedStart) return true;
    if (selectedEnd && dateStr > selectedStart && dateStr <= selectedEnd) return true;
    return false;
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    clickedDate.setHours(12, 0, 0, 0);
    const dateStr = clickedDate.toISOString().split('T')[0];

    const isPast = dateStr < todayStr;

    if (isPast) return;

    // Allow clicking if it's available OR if it's a check-in day (to be used as check-out)
    // or a check-out day (to be used as check-in)
    const occupied = isOccupied(dateStr);
    const fullyOccupied = isFullyOccupied(dateStr);

    if (fullyOccupied) return;

    if (!selectedStart || (selectedStart && selectedEnd)) {
      // If it's a check-in day for someone else, we can't start here
      if (occupied) return;
      onRangeSelect(dateStr, '');
    } else {
      if (dateStr < selectedStart) {
        // If it's a check-in day for someone else, we can't start here
        if (occupied) return;
        onRangeSelect(dateStr, '');
      } else {
        let current = new Date(selectedStart);
        let hasConflict = false;
        while (current.toISOString().split('T')[0] < dateStr) {
          if (isOccupied(current.toISOString().split('T')[0])) {
            hasConflict = true;
            break;
          }
          current.setDate(current.getDate() + 1);
        }

        if (hasConflict) {
          onRangeSelect(dateStr, '');
        } else {
          onRangeSelect(selectedStart, dateStr);
        }
      }
    }
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">{monthName} {year}</h4>
        <div className="flex gap-1">
          <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 hover:text-slate-900 transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 hover:text-slate-900 transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((d, i) => (
          <div key={`${d}-${i}`} className="text-center text-[8px] font-black text-slate-600 uppercase py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {padding.map(p => <div key={`p-${p}`} />)}
        {days.map(day => {
          const d = new Date(year, month, day);
          d.setHours(12, 0, 0, 0);
          const dStr = d.toISOString().split('T')[0];
          const isClosed = room?.closed_through_date && dStr <= room.closed_through_date;
          const occupied = isOccupied(dStr);
          const fullyOccupied = isFullyOccupied(dStr);
          const isCheckOut = existingBookings.some(b => b.status !== 'cancelled' && dStr === b.check_out);
          const isCheckIn = existingBookings.some(b => b.status !== 'cancelled' && dStr === b.check_in);
          const isPast = dStr < todayStr;
          const selected = isSelected(dStr);
          const isStart = dStr === selectedStart;
          const isEnd = dStr === selectedEnd;

          const baseClasses = "relative h-8 w-full flex items-center justify-center text-[10px] font-black rounded-lg transition-all";
          let statusClasses = "";
          let style: React.CSSProperties = {};

          if (selected) {
            statusClasses = "bg-slate-950 text-white shadow-md z-10";
          } else if (fullyOccupied) {
            statusClasses = "bg-rose-500 text-white cursor-not-allowed opacity-80";
          } else if (isPast) {
            statusClasses = "bg-slate-100 text-slate-600 cursor-not-allowed";
          } else if (isCheckIn && isCheckOut) {
            // Turnover day: someone leaving, someone arriving
            statusClasses = "text-white hover:brightness-110";
            style = { background: 'linear-gradient(to right, #f43f5e 50%, #f43f5e 50%)' }; // Still fully rose but visually distinct in logic
            // Actually let's just make it rose
            statusClasses = "bg-rose-500 text-white opacity-80";
          } else if (isCheckIn) {
            // Half emerald (available morning), half rose (occupied afternoon)
            statusClasses = "text-white hover:brightness-110";
            style = { background: 'linear-gradient(to right, #10b981 50%, #f43f5e 50%)' };
          } else if (isCheckOut) {
            // Half rose (occupied morning), half emerald (available afternoon)
            statusClasses = "text-white hover:brightness-110";
            style = { background: 'linear-gradient(to right, #f43f5e 50%, #10b981 50%)' };
          } else {
            statusClasses = "bg-emerald-500 text-white hover:bg-emerald-600";
          }

          const rangeClasses = `
            ${isStart ? 'rounded-r-none' : ''}
            ${isEnd ? 'rounded-l-none' : ''}
            ${selected && !isStart && !isEnd ? 'rounded-none' : ''}
          `;

          return (
            <button
              key={day}
              type="button"
              disabled={fullyOccupied || isPast}
              onClick={() => handleDateClick(day)}
              className={`${baseClasses} ${statusClasses} ${rangeClasses}`}
              style={style}
            >
              {day}
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {[
          { color: 'bg-emerald-500', label: 'Avail' },
          { color: 'bg-rose-500', label: 'Occ' },
          { 
            color: '', 
            label: 'Turn', 
            style: { background: 'linear-gradient(to right, #f43f5e 50%, #10b981 50%)' } 
          },
          { color: 'bg-slate-950', label: 'Sel' }
        ].map(legend => (
          <div key={legend.label} className="flex items-center gap-1.5">
            <div 
              className={`w-2 h-2 rounded-full ${legend.color}`} 
              style={legend.style}
            />
            <span className="text-[7px] font-black text-slate-700 uppercase">{legend.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
