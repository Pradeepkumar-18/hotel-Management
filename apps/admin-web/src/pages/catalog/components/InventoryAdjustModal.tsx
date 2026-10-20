import { useState, useEffect } from 'react';
import { Lock, Unlock, AlertCircle } from 'lucide-react';
import { Modal, Button, Input, ReasonField } from '../../../components/ui';
import { InventoryDay, isApiError } from '../../../api';
import { adjustNight } from '../../../features/inventory/inventory.api';
import { useToast } from '../../../ui-feedback';

interface InventoryAdjustModalProps {
  isOpen?: boolean;
  onClose: () => void;
  day: InventoryDay | null;
  roomName: string;
  roomTypeId?: string;
  roomId?: string;
  onSuccess: () => void;
}

export function InventoryAdjustModal({
  isOpen = true,
  onClose,
  day,
  roomName,
  roomTypeId,
  roomId,
  onSuccess,
}: InventoryAdjustModalProps) {
  const targetRoomId = roomTypeId || roomId || '';
  const toast = useToast();
  const [action, setAction] = useState<'block' | 'unblock'>('block');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (day) {
      if (day.available > 0) {
        setAction('block');
        setQuantity(1);
      } else if (day.blocked > 0) {
        setAction('unblock');
        setQuantity(1);
      }
      setReason('');
      setError('');
    }
  }, [day]);

  if (!isOpen || !day) return null;

  const maxQuantity = action === 'block' ? day.available : day.blocked;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      setError('Please enter a valid room count of at least 1.');
      return;
    }
    if (qty > maxQuantity) {
      setError(`Cannot ${action} more than ${maxQuantity} rooms.`);
      return;
    }
    if (reason.trim().length < 3) {
      setError('Please provide a reason of at least 3 characters.');
      return;
    }

    setLoading(true);
    try {
      await adjustNight(targetRoomId, day.stayDate, action, {
        version: day.version,
        quantity: qty,
        reason: reason.trim(),
      });
      toast.success(
        `Successfully ${action === 'block' ? 'blocked' : 'unblocked'} ${qty} room${qty === 1 ? '' : 's'} on ${day.stayDate}.`
      );
      onSuccess();
      onClose();
    } catch (err) {
      if (isApiError(err) && err.code === 'VERSION_CONFLICT') {
        setError('This night was modified by another user. Please close and refresh.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Operation failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !day) return null;

  return (
    <Modal closeOnBackdrop={false}
      onClose={loading ? () => {} : onClose}
      title={`Adjust Night Availability — ${day.stayDate}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
            <span>{roomName}</span>
            <span className="font-mono text-slate-600">v{day.version}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 pt-1 text-center text-xs">
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-500 font-medium">Total</div>
              <div className="font-bold text-slate-900">{day.total}</div>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="text-[10px] text-emerald-700 font-medium">Available</div>
              <div className="font-bold text-emerald-900">{day.available}</div>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-[10px] text-orange-700 font-medium">Blocked</div>
              <div className="font-bold text-orange-900">{day.blocked}</div>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-[10px] text-blue-700 font-medium">Booked</div>
              <div className="font-bold text-blue-900">{day.held + day.confirmed}</div>
            </div>
          </div>
        </div>

        {/* Action Toggle */}
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              action === 'block'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => {
              setAction('block');
              setError('');
              setQuantity(1);
            }}
            disabled={day.available === 0}
          >
            <Lock size={14} />
            <span>Block Rooms</span>
          </button>
          <button
            type="button"
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              action === 'unblock'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => {
              setAction('unblock');
              setError('');
              setQuantity(1);
            }}
            disabled={day.blocked === 0}
          >
            <Unlock size={14} />
            <span>Unblock Rooms</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Quantity to {action} (Max {maxQuantity})
          </label>
          <Input
            type="number"
            min={1}
            max={Math.max(1, maxQuantity)}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            disabled={loading || maxQuantity === 0}
            required
          />
        </div>

        <ReasonField
            label={`Reason for ${action}ing rooms`}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              action === 'block'
                ? 'e.g., Scheduled HVAC maintenance, plumbing repairs, deep cleaning...'
                : 'e.g., Maintenance completed early, returned to sellable pool...'
            }
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
            variant={action === 'block' ? 'danger' : 'primary'}
            size="sm"
            isLoading={loading}
            disabled={loading || maxQuantity === 0}
          >
            {action === 'block' ? 'Confirm Block' : 'Confirm Release'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
