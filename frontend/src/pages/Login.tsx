import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { KeyRound, ShieldAlert, User } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';

export const Login: React.FC = () => {
  const { login } = useStore();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const resJson = await response.json();
      if (!resJson.success) {
        throw new Error(resJson.message || 'Login failed. Please verify credentials.');
      }

      const { token, role } = resJson.data;
      login(token, username, role);
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection to API failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] px-4 relative overflow-hidden">
      {/* Decorative pulse background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-900 rounded-full blur-3xl opacity-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900 rounded-full blur-3xl opacity-10 animate-pulse" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-cyan-950 bg-opacity-40 border border-cyan-800 rounded-2xl text-cyan-400 mb-3 shadow-lg shadow-cyan-950">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">ResQNet AI Command</h1>
          <p className="text-xs text-gray-500 font-mono mt-1">EMERGENCY OPERATIONS CENTER (EOC) HUB</p>
        </div>

        <GlassCard className="p-8 border border-gray-800 shadow-2xl">
          <h2 className="text-lg font-extrabold text-white mb-5 uppercase tracking-wide">Operator Access</h2>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950 border border-red-800 text-red-400 text-xs font-semibold rounded-lg">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Username / Call Sign
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Security Passcode
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white rounded-lg text-sm font-bold transition-all mt-6 uppercase tracking-wider shadow-md shadow-cyan-950"
            >
              {isSubmitting ? 'Verifying Code...' : 'Authenticate'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <span className="text-[10px] text-gray-500 font-mono">
              Demo logins: admin/admin123, dispatcher/dispatcher123
            </span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
export default Login;
