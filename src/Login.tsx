import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.SUPABASE_URL;
const rawKey = process.env.SUPABASE_ANON_KEY;
const supabase = (rawUrl && rawKey) ? createClient(rawUrl, rawKey) : null;

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      alert("Supabase is not configured. Please check environment variables.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else onLoginSuccess();
    setLoading(false);
  };

  const handleDemo = async () => {
    if (!supabase) {
      alert("Supabase is not configured.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ 
      email: 'demo@guesthouse.com', 
      password: 'demo-password-123' 
    });
    if (error) alert("Demo account not active yet. Create it in Supabase Auth!");
    else onLoginSuccess();
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
        <div className="text-center">
          <h2 className="text-3xl font-black text-slate-900 serif">GuestManager<span className="text-blue-600">.</span></h2>
          <p className="mt-2 text-sm text-slate-700 font-medium">Professional Guesthouse Administration</p>
        </div>
        
        <form className="mt-8 space-y-4" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email Address"
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
          >
            {loading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-600 uppercase font-bold text-[10px] tracking-widest">Or show a client</span></div>
        </div>

        <button
          onClick={handleDemo}
          className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl font-black uppercase tracking-widest border-2 border-blue-100 hover:bg-blue-100 transition-all"
        >
          Try Live Demo
        </button>
      </div>
    </div>
  );
};

export default Login;