import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Pencil, Plus, Star } from 'lucide-react';
import { HotelMediaItem } from '../../api';
import { resolveImageUrl } from '../../utils/helpers';
import { Button } from '../../components/ui';
import { PhotoModal, type SavedPhoto } from './PhotoModal';

export interface HotelMediaGalleryManagerProps {
  media: HotelMediaItem[];
  onChange: (items: HotelMediaItem[]) => void;
  disabled?: boolean;
}

/** Keeps exactly one cover photo (the first if none is marked) and display order = position. */
function normalise(items: HotelMediaItem[]): HotelMediaItem[] {
  const hasCover = items.some((m) => m.isPrimary);
  return items.map((item, idx) => ({ ...item, isPrimary: hasCover ? Boolean(item.isPrimary) : idx === 0, displayOrder: idx }));
}

/**
 * Photo grid used by Add hotel, the hotel workspace and room photos.
 * Adding and editing happen in a pop-up (image + description + Save); the page only shows the photos.
 */
export function HotelMediaGalleryManager({ media, onChange, disabled = false }: HotelMediaGalleryManagerProps) {
  // null = closed, 'new' = adding, number = editing that photo.
  const [editing, setEditing] = useState<'new' | number | null>(null);

  const withCover = (items: HotelMediaItem[], coverIndex: number | null) =>
    normalise(coverIndex === null ? items : items.map((m, i) => ({ ...m, isPrimary: i === coverIndex })));

  const addPhotos = (photos: SavedPhoto[]) => {
    const next = [...media, ...photos.map((p) => ({ url: p.url, caption: p.caption }))];
    const cover = photos.findIndex((p) => p.isPrimary);
    onChange(withCover(next, cover === -1 ? null : media.length + cover));
  };

  const updatePhoto = (index: number, photo: { caption?: string; isPrimary: boolean }) => {
    const next = media.map((m, i) => (i === index ? { ...m, caption: photo.caption } : m));
    // Unticking "cover" on the current cover keeps it (there must always be one).
    onChange(withCover(next, photo.isPrimary ? index : null));
  };

  const removePhoto = (index: number) => onChange(normalise(media.filter((_, i) => i !== index)));

  const movePhoto = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= media.length) return;
    const next = [...media];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(normalise(next));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-600">
          {media.length === 0 ? 'No photos yet' : `${media.length} ${media.length === 1 ? 'photo' : 'photos'} · click a photo to edit it`}
        </span>
        {!disabled && (
          <Button type="button" variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setEditing('new')}>
            Add photo
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {media.map((item, idx) => (
          <figure
            key={`${item.url}-${idx}`}
            className={`h-full flex flex-col rounded-xl border bg-white overflow-hidden ${item.isPrimary ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-slate-200'}`}
          >
            <button
              type="button"
              disabled={disabled}
              onClick={() => setEditing(idx)}
              aria-label={`Edit photo ${idx + 1}${item.caption ? `: ${item.caption}` : ''}`}
              className="relative block w-full aspect-[4/3] bg-slate-100 group disabled:cursor-default"
            >
              <img src={resolveImageUrl(item.url)} alt={item.caption || `Photo ${idx + 1}`} className="w-full h-full object-cover" />
              {item.isPrimary && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-brand-dark text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                  <Star size={10} className="fill-amber-400 text-amber-400" /> Cover
                </span>
              )}
              {!disabled && (
                <span className="absolute top-2 right-2 p-1 rounded-md bg-white/90 text-slate-600 shadow-2xs">
                  <Pencil size={12} />
                </span>
              )}
            </button>
            <figcaption className="h-10 px-2.5 flex items-center justify-between gap-2">
              <span className={`text-xs truncate ${item.caption ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                {item.caption || 'No description'}
              </span>
              {!disabled && media.length > 1 && (
                <span className="inline-flex shrink-0">
                  <button type="button" onClick={() => movePhoto(idx, -1)} disabled={idx === 0} aria-label="Move earlier" className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                    <ChevronLeft size={13} />
                  </button>
                  <button type="button" onClick={() => movePhoto(idx, 1)} disabled={idx === media.length - 1} aria-label="Move later" className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                    <ChevronRight size={13} />
                  </button>
                </span>
              )}
            </figcaption>
          </figure>
        ))}

        {!disabled && (
          <button
            type="button"
            onClick={() => setEditing('new')}
            className={`${media.length === 0 ? 'aspect-[4/3]' : 'h-full min-h-32'} rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-brand-primary hover:bg-brand-pale flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-brand-primary transition-colors`}
          >
            <ImagePlus size={22} />
            <span className="text-xs font-semibold">{media.length === 0 ? 'Add your first photo' : 'Add photo'}</span>
          </button>
        )}
      </div>

      {editing === 'new' && (
        <PhotoModal firstPhoto={media.length === 0} onSave={addPhotos} onClose={() => setEditing(null)} />
      )}
      {typeof editing === 'number' && media[editing] && (
        <PhotoModal
          photo={media[editing]}
          firstPhoto={media.length === 1}
          onSave={([p]) => updatePhoto(editing, p)}
          onDelete={() => removePhoto(editing)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
