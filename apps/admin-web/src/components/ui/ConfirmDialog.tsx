import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  icon?: 'trash' | 'warning';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon = 'trash',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  const isDanger = variant === 'danger';

  return (
    <Modal
      title={title}
      onClose={isLoading ? () => {} : onClose}
      variant="dialog"
      size="small"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant}
            size="sm"
            isLoading={isLoading}
            onClick={handleConfirm}
            leftIcon={
              isDanger && !isLoading ? (
                icon === 'trash' ? (
                  <Trash2 size={14} />
                ) : (
                  <AlertTriangle size={14} />
                )
              ) : undefined
            }
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isDanger ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {icon === 'trash' ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
        </div>
        <div className="space-y-1.5 pt-0.5">
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
}
