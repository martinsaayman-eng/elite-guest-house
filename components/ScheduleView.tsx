import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  DndContext, 
  useDraggable, 
  useDroppable, 
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { Room, Booking, HousekeepingStatus } from '../types';

interface ScheduleViewProps {
  bookings: Booking[];
  housekeeping: Record<string, HousekeepingStatus>;
  rooms: Room[];
  onBookingUpdate?: (bookingId: string, newRoomId: string) => void;
  onBookingClick?: (booking: Booking) => void;
  onRoomClick?: (room: Room) => void;
  onStatusChange?: (roomId: string, status: HousekeepingStatus) => void;
  getFinancials?: (b: Booking) => { outstanding: number };
}

// 1. Droppable Room Row Component
const RoomRow = ({ room, children }: { room: Room, children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({ id: room.id });
  
  return (
    <div 
      ref={setNodeRef} 
      className={`flex h-[76px] relative transition-colors ${isOver ? 'bg-blue-100/30' : 'bg-transparent'}`}
    >
      {children}
    </div>
  );
};

// 2. Draggable Booking Component
const DraggableBooking = ({ 
  booking, 
  style, 
  onClick, 
  color,
  isOverlay = false,
  isLate = false
}: { 
  booking: Booking, 
  style: any, 
  onClick: () => void,
  color: string,
  isOverlay?: boolean,
  isLate?: boolean,
  key?: React.Key
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: booking.id,
    disabled: isOverlay
  });

  const dndStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 100 : 10,
    ...style
  } : style;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        if (!isDragging) onClick();
      }}
      title={`${booking.guest_name} (${booking.check_in} to ${booking.check_out})`}
      className={`absolute top-[3px] bottom-[3px] rounded-md z-10 cursor-grab active:cursor-grabbing border-r border-white/20 transition-all flex items-center px-2 overflow-hidden ${color} ${isOverlay ? 'cursor-grabbing shadow-2xl ring-2 ring-blue-400 scale-105' : ''} ${isLate ? 'animate-late-glow ring-2 ring-white/50' : ''} booking-item`}
      style={dndStyle}
    >
      <span className={`text-[13.5px] font-black text-white uppercase truncate whitespace-nowrap select-none ${isLate ? 'animate-text-flash' : ''}`}>
        {booking.guest_name}
      </span>
    </div>
  );
};

const ScheduleView: React.FC<ScheduleViewProps> = ({ 
  bookings, 
  housekeeping, 
  rooms, 
  onBookingUpdate, 
  onBookingClick, 
  onRoomClick, 
  onStatusChange,
  getFinancials
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [viewDate, setViewDate] = useState(new Date());
  const [activeId, setActiveId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Grab-to-scroll state
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow grab-to-scroll if not dragging a booking
    if (activeId || !scrollContainerRef.current) return;
    
    // Check if we're clicking on a booking - if so, don't start scroll drag
    if ((e.target as HTMLElement).closest('.booking-item')) return;

    setIsDraggingScroll(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    setIsDraggingScroll(false);
    if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = 'grab';
  };

  const handleMouseUp = () => {
    setIsDraggingScroll(false);
    if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = 'grab';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingScroll || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  };

  // 1. AUTO-CALCULATE ROOM STATUS
  const getRoomVisuals = (roomId: string) => {
    const currentStatus = housekeeping[roomId] || 'clean';
    
    // Check if anyone is checking out TODAY
    const departureToday = bookings.find(b => b.room_id === roomId && b.check_out === todayStr && b.status !== 'cancelled');
    
    // If someone is leaving today and the room isn't already being cleaned, it's Dirty!
    const effectiveStatus = (departureToday && currentStatus === 'clean') ? 'dirty' : currentStatus;

    const styles = {
      dirty: { color: 'bg-rose-500', label: 'Needs Cleaning', icon: '🧹' },
      cleaning: { color: 'bg-amber-500', label: 'In Progress', icon: '🧼' },
      clean: { color: 'bg-emerald-500', label: 'Ready', icon: '✨' }
    };

    return { ...styles[effectiveStatus as keyof typeof styles], status: effectiveStatus };
  };

  const timelineDates = useMemo(() => {
    const dates = [];
    // Show a large range: 30 days before viewDate and 150 days after
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() - 30);
    for (let i = 0; i < 180; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [viewDate]);

  const monthLabels = useMemo(() => {
    const labels: { name: string, startIdx: number, length: number }[] = [];
    if (timelineDates.length === 0) return labels;
    
    let currentMonth = -1;
    let currentLabel: any = null;
    
    timelineDates.forEach((date, idx) => {
      const m = date.getMonth();
      const y = date.getFullYear();
      const key = `${m}-${y}`;
      if (key !== currentLabel?.key) {
        if (currentLabel) {
          currentLabel.length = idx - currentLabel.startIdx;
          labels.push(currentLabel);
        }
        currentLabel = {
          key,
          name: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
          startIdx: idx,
          length: 0
        };
      }
    });
    
    if (currentLabel) {
      currentLabel.length = timelineDates.length - currentLabel.startIdx;
      labels.push(currentLabel);
    }
    
    return labels;
  }, [timelineDates]);

  const daysToShow = timelineDates.length;
  const tStart = timelineDates[0];
  const tEnd = timelineDates[timelineDates.length - 1];

  const bookingsByRoom = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach(b => {
      if (b.status === 'cancelled') return;
      if (!map[b.room_id]) map[b.room_id] = [];
      map[b.room_id].push(b);
    });
    return map;
  }, [bookings]);

  useEffect(() => {
    // Initial scroll to center today or viewDate
    if (scrollContainerRef.current) {
      const dayWidth = 46;
      const todayIdx = timelineDates.findIndex(d => d.toDateString() === today.toDateString());
      if (todayIdx !== -1) {
        // Center today in the view
        const targetScroll = (todayIdx * dayWidth) - (scrollContainerRef.current.clientWidth / 2) + (dayWidth / 2);
        scrollContainerRef.current.scrollLeft = targetScroll;
      }
    }
  }, [timelineDates]);

  const jumpToToday = () => setViewDate(new Date());
  const changePeriod = (months: number) => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + months);
    setViewDate(d);
  };

  const handleJumpToDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const [y, m, d] = e.target.value.split('-').map(Number);
      setViewDate(new Date(y, m - 1, d));
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    // Check if we actually dropped it on a different room
    if (over && active.id !== over.id) {
      const bookingId = active.id as string;
      const newRoomId = over.id as string;
      
      // Trigger the save function we built above
      onBookingUpdate?.(bookingId, newRoomId);
    }
  };

  const activeBooking = useMemo(() => 
    activeId ? bookings.find(b => b.id === activeId) : null
  , [activeId, bookings]);

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full py-4 space-y-4 bg-slate-50/30 min-h-screen">
        {/* HEADER */}
        <div className="px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-[34px] font-black text-slate-900 uppercase tracking-tight">Operations Center</h2>
            <p className="text-[11.5px] font-bold text-slate-700 uppercase tracking-widest">
              Viewing: {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <button onClick={() => changePeriod(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div className="flex flex-col items-center border-x border-slate-100 px-4">
              <label className="text-[8px] font-black uppercase text-slate-600 mb-1">Jump to Date</label>
              <input 
                type="date" 
                onChange={handleJumpToDate}
                className="text-[11px] font-bold bg-transparent border-none focus:ring-0 cursor-pointer text-blue-800"
                value={viewDate.toISOString().split('T')[0]}
              />
            </div>

            <button onClick={jumpToToday} className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest hover:text-blue-600 border-r border-slate-100 pr-4">Today</button>

            <button onClick={() => changePeriod(1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        {/* GRID CONTAINER */}
        <div className="mx-6 bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
          <div 
            ref={scrollContainerRef} 
            className="overflow-x-auto no-scrollbar select-none"
            style={{ cursor: 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            <div className="min-w-full inline-block align-middle">
              
              {/* MONTH LABELS */}
              <div className="flex border-b border-slate-300 bg-slate-100/50 sticky top-0 z-50 min-w-max">
                <div className="w-[228px] shrink-0 bg-slate-100 border-r border-slate-300 sticky left-0 z-[60]" />
                <div className="flex">
                  {monthLabels.map((label, i) => (
                    <div 
                      key={i} 
                      className="shrink-0 border-r border-slate-300 py-1 px-4 flex items-center"
                      style={{ width: `${label.length * 46}px` }}
                    >
                      <span className="text-[10.5px] font-black text-slate-700 uppercase tracking-widest truncate">
                        {label.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* DATE HEADER */}
              <div className="flex h-[52px] border-b border-slate-300 bg-slate-50/50 sticky top-[26px] z-30 min-w-max">
                <div className="w-[228px] shrink-0 bg-white border-r border-slate-300 px-4 sticky left-0 z-40 flex items-center">
                  <span className="text-[11.5px] font-black text-slate-700 uppercase tracking-widest">Unit</span>
                </div>
                <div className="flex h-full">
                  {timelineDates.map((date, i) => (
                    <div key={i} className={`w-[46px] shrink-0 h-full flex flex-col justify-center text-center border-r border-slate-300 ${date.toDateString() === today.toDateString() ? 'bg-blue-800 text-white' : ''} ${date.getDate() === 1 ? 'border-l-2 border-l-slate-900' : ''}`}>
                      <div className="text-[9.5px] font-bold uppercase opacity-80 leading-none mb-1">{date.toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
                      <div className="text-[11.5px] font-black leading-none">{date.getDate()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ROOM ROWS */}
              <div className="border-b border-slate-300 min-w-max">
                {rooms.map(room => {
                  const { color, label, icon, status } = getRoomVisuals(room.id);

                  return (
                    <div key={room.id} className="flex h-[76px] border-b border-slate-300 group relative hover:bg-slate-50/50 transition-colors">
                      {/* Left Room Card */}
                      <div 
                        className={`w-[228px] shrink-0 h-full px-4 border-r border-slate-300 bg-white sticky left-0 z-20 flex items-center gap-4 ${
                          bookings.some(b => {
                            if (b.room_id !== room.id || b.check_out !== todayStr || b.status === 'cancelled') return false;
                            const isStillIn = b.check_in_status === 'checked-in';
                            const hasBalance = getFinancials ? getFinancials(b).outstanding > 0 : false;
                            return isStillIn || hasBalance;
                          }) 
                          ? 'ring-4 ring-rose-500 ring-inset z-30' 
                          : ''
                        }`}
                      >
                        <div className="relative cursor-pointer" onClick={() => onRoomClick?.(room)}>
                          <div className="w-[52px] h-[52px] rounded-2xl overflow-hidden border-2 border-slate-100">
                            <img src={room.imageUrl} className="w-full h-full object-cover" alt="" />
                          </div>
                          {/* The Status Dot */}
                          <div className={`absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full border-2 border-white shadow-sm ${color} ${status !== 'clean' ? 'animate-pulse' : ''}`} />
                        </div>

                        <div className="min-w-0">
                          <div className="text-[12.5px] font-black text-slate-900 uppercase truncate">{room.name}</div>
                          {/* Status Button: Click to toggle status */}
                          <button 
                            onClick={() => onStatusChange?.(room.id, status === 'dirty' ? 'cleaning' : status === 'cleaning' ? 'clean' : 'dirty')}
                            className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                          >
                            <span className="text-[10.5px]">{icon}</span>
                            <span className="text-[9.5px] font-black uppercase text-slate-700 tracking-tighter">{label}</span>
                          </button>
                        </div>
                      </div>

                      {/* Timeline Row */}
                      <RoomRow room={room}>
                      {/* Grid Lines */}
                      {timelineDates.map((date, i) => (
                        <div key={i} className={`w-[46px] shrink-0 h-full border-r border-slate-300 ${date.getDate() === 1 ? 'border-l-2 border-l-slate-900' : ''}`} />
                      ))}

                      {/* Bookings */}
                      {(bookingsByRoom[room.id] || []).map(booking => {
                        const bStart = parseLocalDate(booking.check_in);
                        const bEnd = parseLocalDate(booking.check_out);

                        if (bEnd < tStart || bStart > tEnd) return null;

                        const dayInMs = 24 * 60 * 60 * 1000;
                        let startIdx = (bStart.getTime() - tStart.getTime()) / dayInMs + 0.5;
                        let endIdx = (bEnd.getTime() - tStart.getTime()) / dayInMs + 0.5;

                        const dayWidth = 46; 
                        const fullWidth = (endIdx - startIdx) * dayWidth;
                        const width = fullWidth * 0.95;
                        const left = (startIdx * dayWidth) + (fullWidth * 0.025);

                        const totalPaid = (booking.transactions || []).reduce((s, t) => s + (t.amount_cents || 0), 0);
                        const isPaid = totalPaid <= 0;
                        const isStillIn = booking.check_in_status === 'checked-in';
                        const isCheckedOut = booking.check_in_status === 'checked-out';
                        const hasBalance = getFinancials ? getFinancials(booking).outstanding > 0 : !isPaid;
                        const isLate = booking.check_out === todayStr && booking.status !== 'cancelled' && (isStillIn || hasBalance);
                        
                        let color = isPaid ? 'bg-emerald-500' : 'bg-rose-500';
                        if (isCheckedOut) color = 'bg-slate-400';
                        if (isLate) color = 'bg-rose-600';

                        return (
                          <DraggableBooking
                            key={booking.id}
                            booking={booking}
                            onClick={() => onBookingClick?.(booking)}
                            color={color}
                            style={{ left: `${left}px`, width: `${width}px` }}
                            isLate={isLate}
                          />
                        );
                      })}
                    </RoomRow>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeBooking ? (
            <DraggableBooking
              booking={activeBooking}
              onClick={() => {}}
              color={(activeBooking.transactions || []).reduce((s, t) => s + (t.amount_cents || 0), 0) <= 0 ? 'bg-emerald-500' : 'bg-rose-500'}
              style={{ width: '200px', position: 'relative', top: 0, left: 0 }}
              isOverlay
              isLate={activeBooking.check_out === todayStr && activeBooking.check_in_status === 'checked-in'}
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default ScheduleView;
