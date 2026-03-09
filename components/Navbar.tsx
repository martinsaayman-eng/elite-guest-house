
import React, { useState, useEffect } from 'react';
import { View, UserContext } from '../types';

interface NavbarProps {
  view: View;
  setView: (view: View) => void;
  userContext?: UserContext | null;
  isAdmin: boolean;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ view, setView, userContext, isAdmin, onLogout }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isManager = isAdmin;

  const navItems = [
    { id: View.HOME, label: 'Timeline', visible: true },
    { id: View.ROOMS, label: 'Reservations', visible: true },
    { id: View.HOUSEKEEPING, label: 'Housekeeping', visible: true },
    { id: View.INVOICING, label: 'Finance & Ledger', visible: isManager },
    { id: View.ADMIN, label: 'Expenses', visible: isManager },
    { id: View.HISTORY, label: 'Audit Log', visible: isManager },
    { id: View.SETTINGS, label: 'Settings', visible: isManager },
  ];

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <nav className="bg-white/70 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-[72px] items-center">
          <div 
            className="flex-shrink-0 flex items-center gap-3 cursor-pointer group"
            onClick={() => setView(View.HOME)}
          >
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
              <span className="text-white font-black text-lg italic">G</span>
            </div>
            <div className="hidden lg:block">
               <span className="text-[13px] font-black text-slate-900 tracking-tighter uppercase block leading-none">Estate Portal</span>
               <span className="text-[8px] font-bold text-blue-600 uppercase tracking-widest">{userContext?.property_id || 'Global View'}</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            {navItems.filter(i => i.visible).map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                  view === item.id 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Role switcher removed - using App.tsx switcher */}

          <div className="flex items-center gap-4">
             <button 
               onClick={toggleFullscreen}
               className="p-2.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 rounded-xl transition-all group/fs"
               title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
               aria-label="Toggle Fullscreen"
             >
               {isFullscreen ? (
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 9L4 4m0 0h5m-5 0v5m11 0l5-5m0 0h-5m5 0v5m-11 6l-5 5m0 0h5m-5 0v-5m11 0l5 5m0 0h-5m5 0v-5" />
                 </svg>
               ) : (
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                 </svg>
               )}
             </button>

             <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-900 uppercase leading-none">Management</span>
                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">{userContext?.roles.join(' | ') || 'Guest'}</span>
             </div>
             
             <div className="md:hidden">
                <select 
                  value={view} 
                  onChange={(e) => setView(e.target.value as View)}
                  className="bg-slate-100 text-[10px] font-black uppercase tracking-widest border-none rounded-lg px-4 py-2 outline-none text-slate-700"
                >
                  {navItems.filter(i => i.visible).map(item => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
             </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
