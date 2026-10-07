import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import { request, setCsrfToken, StaffMe } from '../../api';
import { AsyncButton, useBusyGuard, useToast } from '../../ui-feedback';
import { Alert, Field } from '../../components/ui';

export function LoginPage({ onLogin, apiError }: { onLogin: (user: StaffMe) => void; apiError: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(apiError);
  const { busy, run } = useBusyGuard();
  const toast = useToast();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      setError('');
      try {
        const login = await request<{ csrfToken: string }>('/auth/staff/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setCsrfToken(login.csrfToken);
        onLogin(await request<StaffMe>('/auth/me'));
        toast.success('Welcome back. You are signed in.');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Sign in failed. Check your details and retry.');
      }
    });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-900 font-sans">
      {/* Left Artwork Banner */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden shadow-2xl">
        <div className="absolute -bottom-48 -right-48 w-[560px] h-[560px] rounded-full border border-emerald-500/10 pointer-events-none bg-emerald-500/5 blur-3xl" />
        <div className="absolute top-1/4 left-10 w-[300px] h-[300px] rounded-full bg-emerald-400/5 blur-2xl pointer-events-none" />

        <Link className="flex items-center gap-3 text-white font-bold text-lg tracking-tight z-10 hover:opacity-95 transition-opacity" to="/admin/login">
          <span className="w-10 h-10 rounded-xl bg-emerald-400 text-emerald-950 flex items-center justify-center font-extrabold shadow-md">
            <Compass size={22} />
          </span>
          <span className="flex flex-col">
            <span className="text-lg font-extrabold text-white leading-tight tracking-tight">staywise</span>
            <span className="text-[10px] font-bold tracking-widest text-emerald-300 uppercase">HOTEL OPERATIONS</span>
          </span>
        </Link>

        <div className="my-auto py-12 space-y-5 max-w-md z-10">
          <span className="w-10 h-1 bg-emerald-400 block rounded-full" />
          <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
            Make every stay
            <br />
            feel considered.
          </h1>
          <p className="text-sm text-emerald-200/90 font-medium leading-relaxed">
            A calmer, high-performance operations platform built for modern hotel staff and property managers.
          </p>
        </div>

        <div className="text-[10px] font-bold tracking-widest text-emerald-400/80 uppercase z-10">
          STAYWISE · OPERATIONS CONSOLE
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex items-center justify-center p-6 lg:p-14 bg-white">
        <form className="w-full max-w-sm space-y-5" onSubmit={submit}>
          <div>
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-1 block">WELCOME BACK</span>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Good to see you.</h2>
            <p className="text-xs text-slate-500 mt-1 leading-normal">Sign in with your staff account to access operations dashboard.</p>
          </div>

          {error && (
            <div className="min-h-[44px]">
              <Alert tone="error">{error}</Alert>
            </div>
          )}

          <Field label="Work email">
            <input
              autoComplete="username"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@hotel.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all font-medium"
            />
          </Field>

          <Field label="Password">
            <input
              autoComplete="current-password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all font-medium"
            />
          </Field>

          <AsyncButton
            type="submit"
            busy={busy}
            loadingLabel="Signing in…"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-lg shadow-sm transition-colors text-xs cursor-pointer disabled:opacity-50"
          >
            <span>Sign in</span>
            <ArrowRight size={15} />
          </AsyncButton>

          <p className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center leading-normal">
            Access is restricted to authorized Staywise staff members.
          </p>
        </form>
      </div>
    </div>
  );
}
