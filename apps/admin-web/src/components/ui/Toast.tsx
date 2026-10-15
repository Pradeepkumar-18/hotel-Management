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
      <div className="toast-stack" aria-label="Notifications">
        {items.map((item) => {
          const Icon = item.kind === 'success' ? Check : item.kind === 'error' ? X : Info;
          return (
            <div
              key={item.id}
              className={`toast toast-${item.kind}`}
              role={item.kind === 'error' ? 'alert' : 'status'}
              aria-live={item.kind === 'error' ? 'assertive' : 'polite'}
            >
              <span className="toast-icon">
                <Icon size={17} />
              </span>
              <span className="toast-message">{item.message}</span>
              <button
                type="button"
                className="toast-dismiss"
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
