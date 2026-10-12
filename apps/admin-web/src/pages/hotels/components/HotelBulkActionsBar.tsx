import { Archive, Check, PauseCircle, X } from 'lucide-react';
import { Button } from '../../../components/ui';

interface HotelBulkActionsBarProps {
  selectedCount: number;
  onBulkStatus: (status: string) => void;
  onClearSelection: () => void;
}

export function HotelBulkActionsBar({
  selectedCount,
  onBulkStatus,
  onClearSelection,
}: HotelBulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="p-3 bg-[#173f36] text-white rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="flex items-center gap-2 text-xs font-semibold">
        <span className="w-6 h-6 rounded-full bg-[#d6ef9e] text-[#173f36] flex items-center justify-center font-bold">
          {selectedCount}
        </span>
        <span>{selectedCount} property {selectedCount === 1 ? 'selected' : 'selected'}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Check size={14} />}
          onClick={() => onBulkStatus('PUBLISHED')}
          className="h-8"
        >
          Publish Selected
        </Button>
        <Button
          variant="danger"
          size="sm"
          leftIcon={<PauseCircle size={14} />}
          onClick={() => onBulkStatus('SUSPENDED')}
          className="h-8 bg-[#9a3412] hover:bg-[#7c2d12]"
        >
          Pause Selected
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Archive size={14} />}
          onClick={() => onBulkStatus('ARCHIVED')}
          className="h-8 bg-white/10 hover:bg-white/20 text-white border-transparent"
        >
          Archive Selected
        </Button>
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
