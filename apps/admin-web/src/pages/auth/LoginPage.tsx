import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import { isApiError, StaffMe } from '../../api';
import { AsyncButton, useBusyGuard, useToast } from '../../ui-feedback';
import { Alert, Field } from '../../components/ui';
import { loginStaff, getStaffMe } from '../../features/auth/auth.api';
import { homePath } from '../../routes/route-config';

export function LoginPage({ onLogin, apiError }: { onLogin: (user: StaffMe) => void; apiError: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(apiError);
  const { busy, run } = useBusyGuard();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const isExpired = (location.state as any)?.reason === 'expired';
  const redirectFrom = (location.state as any)?.from;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      setError('');
      try {
        await loginStaff({ email, password });
        const me = await getStaffMe();
        onLogin(me);
        toast.success('Welcome back. You are signed in.');
        navigate(redirectFrom || homePath(me), { replace: true });
      } catch (err) {
        if (isApiError(err)) {
          const LOGIN_MESSAGES: Record<string, string> = {
            AUTH_MFA_REQUIRED: 'Multi-factor sign-in is required for this account.',
            ACCOUNT_LOCKED: 'Too many failed attempts. This account is locked for a few minutes.',
            TOO_MANY_ATTEMPTS: err.message || 'Too many attempts. Please wait and try again.',
            AUTH_INVALID_CREDENTIALS: 'Email or password is incorrect.',
          };
          setError(LOGIN_MESSAGES[err.code] || err.message || 'Email or password is incorrect.');
        } else {
          setError(err instanceof Error ? err.message : 'Sign in failed. Check your network connection.');
        }
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            Enterprise Operations Portal
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Modern hotel management, built for clarity and speed.
          </h1>
          <p className="text-emerald-100/70 text-sm leading-relaxed">
            Multi-property inventory, pricing controls, staff authorizations, and booking workflows in a single unified system.
          </p>
        </div>

        <div className="text-xs text-emerald-200/50 flex items-center justify-between z-10">
          <span>&copy; {new Date().getFullYear()} Staywise Systems</span>
          <span className="font-mono text-[11px]">v0.1.0-alpha</span>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="bg-white flex items-center justify-center p-6 lg:p-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <div>
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-1 block">WELCOME BACK</span>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Good to see you.</h2>
            <p className="text-xs text-slate-500 mt-1 leading-normal">Sign in with your staff account to access operations dashboard.</p>
          </div>

          {isExpired && !error && (
            <div className="min-h-[44px]">
              <Alert tone="warning">Your session expired. Please sign in again.</Alert>
            </div>
          )}

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
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all font-medium"
            />
          </Field>

          <div className="pt-2">
            <AsyncButton
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={busy}
              loadingLabel="Signing you in…"
              rightIcon={<ArrowRight size={16} />}
            >
              Sign in to Staywise
            </AsyncButton>
          </div>
        </form>
      </div>
    </div>
  );
}
