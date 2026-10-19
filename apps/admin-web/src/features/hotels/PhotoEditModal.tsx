import { useState, useEffect } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { Modal, Field, Input, Button } from '../../components/ui';
import { HotelMediaItem } from '../../api';

export interface PhotoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: HotelMediaItem | null;
  onSave: (updated: { caption?: string; isPrimary?: boolean }) => void;
  onDelete?: () => void;
}

export function PhotoEditModal({
  isOpen,
  onClose,
  photo,
  onSave,
  onDelete,
}: PhotoEditModalProps) {
  const [caption, setCaption] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  useEffect(() => {
    if (photo) {
      setCaption(photo.caption ?? '');
      setIsPrimary(Boolean(photo.isPrimary));
    }
  }, [photo]);

  if (!isOpen || !photo) return null;

  const handleSave = () => {
    onSave({
      caption: caption.trim() || undefined,
      isPrimary,
    });
    onClose();
  };

  return (
    <Modal
      title="Edit Photo Details"
      subtitle="Preview photo and customize its caption or cover status."
      onClose={onClose}
      variant="dialog"
      size="medium"
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          {onDelete ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Trash2 size={14} className="text-rose-600" />}
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              Delete Photo
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleSave}>
              Save Caption
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Large Preview */}
        <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 relative shadow-xs flex items-center justify-center">
          <img
            src={photo.url}
            alt={caption || 'Property photo'}
            className="w-full h-full object-contain bg-slate-950/90"
          />
          {isPrimary && (
            <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-700 text-white flex items-center gap-1 shadow-sm">
              <Star size={11} className="fill-white" /> Primary Cover Photo
            </span>
          )}
        </div>

        {/* Caption Field */}
        <Field label="Photo Caption" hint="e.g. Deluxe Suite Bedroom, Oceanfront Infinity Pool, Grand Lobby">
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. Deluxe Suite Bedroom"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
            autoFocus
          />
        </Field>

        {/* Primary Cover Checkbox/Toggle */}
        <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700 cursor-pointer"
          />
          <div className="text-xs">
            <span className="font-bold text-slate-800 block">Set as Primary Cover Photo</span>
            <span className="text-slate-400">
              This photo will be displayed as the main hotel card in listings and search results.
            </span>
          </div>
        </label>
      </div>
    </Modal>
  );
}
