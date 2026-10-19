import { useState } from 'react';
import { AlertTriangle, Archive, Check, PauseCircle } from 'lucide-react';
import { Modal, Button, Input, ReasonField, REASON_MIN } from '../../../components/ui';
import { HotelStatus, STATUS_LABEL } from '../../../features/hotels/hotel-status';

interface BulkStatusConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: HotelStatus | null;
  count: number;
  onConfirm: (reason: string) => Promise<void>;
  loading: boolean;
}

export function BulkStatusConfirmModal({
  isOpen,
  onClose,
  status,
  count,
  onConfirm,
  loading,
}: BulkStatusConfirmModalProps) {
  const [reason, setReason] = useState('');
  const [archiveConfirmation, setArchiveConfirmation] = useState('');

  if (!isOpen || !status) return null;

  const isArchive = status === 'ARCHIVED';
  // Taking a hotel offline must say why; publishing may leave it blank.
  const reasonRequired = status === 'SUSPENDED' || isArchive;
  const reasonOk = !reasonRequired || reason.trim().length >= REASON_MIN;
  const canSubmit = reasonOk && (!isArchive || archiveConfirmation.trim() === 'ARCHIVE');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await onConfirm(reason.trim());
    setReason('');
    setArchiveConfirmation('');
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'PUBLISHED':
        return <Check size={20} className="text-emerald-600" />;
      case 'SUSPENDED':
        return <PauseCircle size={20} className="text-orange-600" />;
      case 'ARCHIVED':
        return <Archive size={20} className="text-rose-600" />;
      default:
        return null;
    }
  };

  return (
    <Modal
      onClose={loading ? () => {} : onClose}
      title={count === 1 ? `${STATUS_LABEL[status]} hotel` : `${STATUS_LABEL[status]} ${count} hotels`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="p-2 bg-white rounded-lg shadow-xs border border-slate-100">
            {getStatusIcon()}
          </div>
          <div className="text-xs text-slate-700 leading-relaxed">
            You are about to change the status of{' '}
            <span className="font-bold text-slate-900">{count}</span> propert
            {count === 1 ? 'y' : 'ies'} to{' '}
            <span className="font-bold uppercase tracking-wider text-slate-900">
              {STATUS_LABEL[status]}
            </span>
            .
          </div>
        </div>

        {isArchive && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-rose-800 text-xs font-semibold">
              <AlertTriangle size={15} />
              <span>Irreversible Action</span>
            </div>
            <p className="text-[11px] text-rose-700 leading-normal">
              Archived properties are permanently deactivated and cannot be restored or re-published.
            </p>
            <div className="pt-1">
              <label className="block text-[11px] font-medium text-rose-900 mb-1">
                Type <strong className="font-bold">ARCHIVE</strong> to confirm:
              </label>
              <Input
                value={archiveConfirmation}
                onChange={(e) => setArchiveConfirmation(e.target.value)}
                placeholder="ARCHIVE"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>
        )}

        <ReasonField
          label="Reason"
          required={reasonRequired}
          hint={reasonRequired ? 'Saved in the audit history.' : 'Optional; saved in the audit history.'}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Closed for renovation until March"
          rows={3}
          disabled={loading}
        />

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={isArchive ? 'danger' : 'primary'}
            size="sm"
            isLoading={loading}
            disabled={!canSubmit || loading}
          >
            Confirm {STATUS_LABEL[status]}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
