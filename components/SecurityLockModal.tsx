
import React, { useState } from 'react';

interface SecurityLockModalProps {
  masterPin: string;
  onSuccess: () => void;
  onClose: () => void;
}

const SecurityLockModal: React.FC<SecurityLockModalProps> = ({ masterPin, onSuccess, onClose }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    setError(false);
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      
      if (nextPin.length === 4) {
        if (nextPin === masterPin) {
          onSuccess();
        } else {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  return (
    <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden p-10 space-y-8 animate-in zoom-in duration-300">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Security Gateway</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Management Signature Required</p>
      </div>

      <div className="flex justify-center gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
              error 
                ? 'bg-rose-500 border-rose-500 scale-110' 
                : pin.length > i 
                  ? 'bg-slate-900 border-slate-900 scale-110' 
                  : 'bg-transparent border-slate-200'
            }`} 
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'X'].map((key) => {
          if (key === 'X') return <button key={key} onClick={onClose} className="h-16 rounded-2xl flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors uppercase font-black text-[10px] tracking-widest">Close</button>;
          if (key === 'C') return <button key={key} onClick={handleClear} className="h-16 rounded-2xl flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-all font-black text-lg">C</button>;
          
          return (
            <button 
              key={key} 
              onClick={() => handleKeyPress(key)}
              className="h-16 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900 font-black text-xl transition-all active:scale-90 shadow-sm"
            >
              {key}
            </button>
          );
        })}
      </div>

      <div className="text-center">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter italic">Keypad locks after 3 failed signatures</p>
      </div>
    </div>
  );
};

export default SecurityLockModal;
