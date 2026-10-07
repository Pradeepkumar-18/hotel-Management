import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Check, Info, LoaderCircle, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
type ToastItem = { id: number; kind: ToastKind; message: string };
type ToastApi = { success: (message: string) => void; error: (message: string) => void; info: (message: string) => void };
const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setItems(current => current.filter(item => item.id !== id));
  }, []);
  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++nextId.current;
    setItems(current => [...current, { id, kind, message }].slice(-4));
    timers.current.set(id, setTimeout(() => dismiss(id), 4500));
  }, [dismiss]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current.clear(); }, []);
  const api: ToastApi = {
    success: message => push('success', message),
    error: message => push('error', message),
    info: message => push('info', message),
  };

  return <ToastContext.Provider value={api}>
    {children}
    <div className="toast-stack" aria-label="Notifications">
      {items.map(item => {
        const Icon = item.kind === 'success' ? Check : item.kind === 'error' ? X : Info;
        return <div key={item.id} className={`toast toast-${item.kind}`} role={item.kind === 'error' ? 'alert' : 'status'} aria-live={item.kind === 'error' ? 'assertive' : 'polite'}>
          <span className="toast-icon"><Icon size={17} /></span><span className="toast-message">{item.message}</span>
          <button type="button" className="toast-dismiss" onClick={() => dismiss(item.id)} aria-label="Dismiss notification"><X size={15} /></button>
        </div>;
      })}
    </div>
  </ToastContext.Provider>;
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}

export function useBusyGuard() {
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  const run = useCallback(async (action: () => Promise<void>) => {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    try { await action(); }
    finally { active.current = false; setBusy(false); }
  }, []);
  return { busy, run };
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <LoaderCircle className="ui-spinner" size={size} aria-hidden="true" />;
}

type AsyncButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & { busy?: boolean; loadingLabel?: string; onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void> };
export function AsyncButton({ busy = false, loadingLabel, disabled, onClick, children, className = '', type, ...props }: AsyncButtonProps) {
  const clickLock = useRef(false);
  const [clickBusy, setClickBusy] = useState(false);
  const isBusy = busy || clickBusy;
  const handleClick: React.MouseEventHandler<HTMLButtonElement> = event => {
    if (isBusy || disabled) { event.preventDefault(); return; }
    if (!onClick) return;
    if (clickLock.current) { event.preventDefault(); return; }
    clickLock.current = true;
    const result = onClick(event);
    if (result && typeof (result as Promise<void>).then === 'function') {
      setClickBusy(true);
      void Promise.resolve(result).then(() => { clickLock.current = false; setClickBusy(false); }, () => { clickLock.current = false; setClickBusy(false); });
    } else clickLock.current = false;
  };
  return <button {...props} type={type || 'button'} className={`${className} ${isBusy ? 'button-loading' : ''}`.trim()} disabled={disabled || isBusy} aria-busy={isBusy || undefined} onClick={handleClick}>
    {isBusy && <Spinner size={15} />}{isBusy && loadingLabel ? loadingLabel : children}
  </button>;
}
