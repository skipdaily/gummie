import React, { useState } from 'react';
import { LockKeyhole, Mail, RefreshCw } from 'lucide-react';
import {
  isSupabaseConfigured,
  sendPasswordReset,
  signInWithEmail,
  signUpWithEmail,
  updatePassword,
} from '../services/supabaseService';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

interface AuthPanelProps {
  recoveryMode: boolean;
  onAuthComplete: () => void;
  onRecoveryComplete: () => void;
}

const AuthPanel: React.FC<AuthPanelProps> = ({ recoveryMode, onAuthComplete, onRecoveryComplete }) => {
  const [mode, setMode] = useState<AuthMode>(recoveryMode ? 'reset' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const configured = isSupabaseConfigured();
  const activeMode = recoveryMode ? 'reset' : mode;

  const resetFeedback = () => {
    setMessage('');
    setError('');
  };

  const requireMatchingPasswords = () => {
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    if (password !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();

    if (!configured) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.');
      return;
    }

    setIsWorking(true);

    try {
      if (activeMode === 'signin') {
        await signInWithEmail(email.trim(), password);
        onAuthComplete();
      }

      if (activeMode === 'signup') {
        requireMatchingPasswords();
        const result = await signUpWithEmail(email.trim(), password);
        if (result.session) {
          onAuthComplete();
        } else {
          setMessage('Check your email to confirm your account, then come back and sign in.');
        }
      }

      if (activeMode === 'forgot') {
        await sendPasswordReset(email.trim());
        setMessage('Password reset email sent. Open the link in that email to set a new password.');
      }

      if (activeMode === 'reset') {
        requireMatchingPasswords();
        await updatePassword(password);
        setMessage('Password updated. You can continue.');
        onRecoveryComplete();
        onAuthComplete();
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed.');
    } finally {
      setIsWorking(false);
    }
  };

  const title = {
    signin: 'Sign In',
    signup: 'Create Account',
    forgot: 'Reset Password',
    reset: 'Set New Password',
  }[activeMode];

  const submitLabel = {
    signin: 'Sign In',
    signup: 'Sign Up',
    forgot: 'Send Reset Link',
    reset: 'Update Password',
  }[activeMode];

  return (
    <div className="min-h-[calc(100vh-220px)] flex items-center justify-center">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-sm p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
          <LockKeyhole size={120} />
        </div>

        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4 relative z-10">
          <div className="w-1 h-6 bg-hazard"></div>
          <h2 className="text-xl font-display font-bold uppercase text-white">{title}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {activeMode !== 'reset' && (
            <div>
              <label className="block text-xs font-mono text-hazard mb-1 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white pl-10 pr-4 py-3 focus:outline-none focus:border-hazard placeholder-slate-700"
                  placeholder="you@example.com"
                />
              </div>
            </div>
          )}

          {activeMode !== 'forgot' && (
            <div>
              <label className="block text-xs font-mono text-hazard mb-1 uppercase tracking-wider">
                {activeMode === 'reset' ? 'New Password' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 focus:outline-none focus:border-hazard placeholder-slate-700"
                placeholder="At least 6 characters"
              />
            </div>
          )}

          {(activeMode === 'signup' || activeMode === 'reset') && (
            <div>
              <label className="block text-xs font-mono text-hazard mb-1 uppercase tracking-wider">Re-enter Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
                className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 focus:outline-none focus:border-hazard placeholder-slate-700"
                placeholder="Type it again"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isWorking || !configured}
            className={`w-full relative overflow-hidden flex items-center justify-center gap-3 py-4 px-6 font-display font-bold text-lg uppercase tracking-widest transition-all border-b-4 ${
              isWorking || !configured
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700'
                : 'bg-hazard hover:bg-hazard-dark text-black border-hazard-dark active:border-b-0 active:translate-y-1'
            }`}
          >
            {isWorking ? <RefreshCw className="animate-spin" /> : <LockKeyhole size={22} strokeWidth={2.5} />}
            {submitLabel}
          </button>

          {error && (
            <p className="text-red-400/80 font-mono text-xs break-all bg-red-950/30 border border-red-900/30 rounded p-3">
              {error}
            </p>
          )}

          {message && (
            <p className="text-hazard/90 font-mono text-xs bg-hazard/10 border border-hazard/20 rounded p-3">
              {message}
            </p>
          )}
        </form>

        {!recoveryMode && (
          <div className="relative z-10 mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-mono uppercase">
            {activeMode !== 'signin' && (
              <button onClick={() => { setMode('signin'); resetFeedback(); }} className="text-slate-400 hover:text-hazard">
                Sign In
              </button>
            )}
            {activeMode !== 'signup' && (
              <button onClick={() => { setMode('signup'); resetFeedback(); }} className="text-slate-400 hover:text-hazard">
                Create Account
              </button>
            )}
            {activeMode !== 'forgot' && (
              <button onClick={() => { setMode('forgot'); resetFeedback(); }} className="text-slate-400 hover:text-hazard">
                Forgot Password
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPanel;
