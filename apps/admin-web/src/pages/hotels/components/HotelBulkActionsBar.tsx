import { Check, PauseCircle, Archive, X } from 'lucide-react';
import { Button } from '../../../components/ui';
import { HotelStatus } from '../../../features/hotels/hotel-status';
import { useAuth } from '../../../features/auth/AuthContext';
import { Can } from '../../../features/auth/Can';

interface HotelBulkActionsBarProps {
  selectedCount: number;
  hasDraftSelected?: boolean;
  onBulkStatus: (status: HotelStatus) => void;
  onClearSelection: () => void;
}

export function HotelBulkActionsBar({
  selectedCount,
  hasDraftSelected = false,
  onBulkStatus,
  onClearSelection,
}: HotelBulkActionsBarProps) {
  const { can } = useAuth();
  const canPublish = can('hotels.publish');
  const canSuspend = can('hotels.edit');
  const canArchive = can('hotels.archive');

  if (selectedCount === 0 || (!canPublish && !canSuspend && !canArchive)) return null;

  return (
    <div className="p-3 bg-brand-dark text-white rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="flex items-center gap-2 text-xs font-semibold">
        <span className="w-6 h-6 rounded-full bg-brand-lime text-brand-dark flex items-center justify-center font-bold">
          {selectedCount}
        </span>
        <span>{selectedCount} propert{selectedCount === 1 ? 'y' : 'ies'} selected</span>
      </div>
      <div className="flex items-center gap-2">
        <Can permission="hotels.publish">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Check size={14} />}
            onClick={() => onBulkStatus('PUBLISHED')}
            disabled={hasDraftSelected}
            title={hasDraftSelected ? 'Drafts must be published individually from their workspace' : undefined}
            className="h-8"
          >
            Publish Selected
          </Button>
        </Can>
        <Can permission="hotels.edit">
          <Button
            variant="danger"
            size="sm"
            leftIcon={<PauseCircle size={14} />}
            onClick={() => onBulkStatus('SUSPENDED')}
            className="h-8 bg-amber-800 hover:bg-amber-900"
          >
            Suspend Selected
          </Button>
        </Can>
        <Can permission="hotels.archive">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Archive size={14} />}
            onClick={() => onBulkStatus('ARCHIVED')}
            className="h-8 bg-white/10 hover:bg-white/20 text-white border-transparent"
          >
            Archive Selected
          </Button>
        </Can>
        <button
          type="button"
          className="p-1.5 text-white/70 hover:text-white rounded-lg transition-colors cursor-pointer ml-1"
          onClick={onClearSelection}
          title="Clear selection"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
