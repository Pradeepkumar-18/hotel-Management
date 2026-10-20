import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Check, Info, X } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';
export type ToastItem = { id: number; kind: ToastKind; message: string };
export type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

// Styles live here (the old .toast CSS classes no longer exist), so toasts always show as a fixed stack.
const KIND_STYLE: Record<ToastKind, { box: string; icon: string }> = {
  success: { box: 'border-emerald-200 bg-white', icon: 'bg-emerald-100 text-emerald-700' },
  error: { box: 'border-rose-200 bg-white', icon: 'bg-rose-100 text-rose-700' },
  info: { box: 'border-sky-200 bg-white', icon: 'bg-sky-100 text-sky-700' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++nextId.current;
      setItems((current) => [...current, { id, kind, message }].slice(-4));
      timers.current.set(id, setTimeout(() => dismiss(id), 4500));
    },
    [dismiss]
  );

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);

  const api: ToastApi = {
    success: (message) => push('success', message),
    error: (message) => push('error', message),
    info: (message) => push('info', message),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="fixed top-4 right-4 z-[60] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none"
        aria-label="Notifications"
      >
        {items.map((item) => {
          const Icon = item.kind === 'success' ? Check : item.kind === 'error' ? X : Info;
          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-3 p-3 rounded-xl border shadow-lg ${KIND_STYLE[item.kind].box}`}
              role={item.kind === 'error' ? 'alert' : 'status'}
              aria-live={item.kind === 'error' ? 'assertive' : 'polite'}
            >
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${KIND_STYLE[item.kind].icon}`}>
                <Icon size={17} />
              </span>
              <span className="flex-1 min-w-0 text-sm text-slate-800 leading-snug pt-1">{item.message}</span>
              <button
                type="button"
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}
