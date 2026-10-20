import { Building2, ExternalLink, MapPin } from 'lucide-react';
import { Hotel } from '../../../api';
import { Button, Checkbox, Status } from '../../../components/ui';
import { readId, resolveImageUrl } from '../../../utils/helpers';
import { HotelSetupProgress } from './HotelSetupProgress';

interface HotelCardGridProps {
  hotels: Hotel[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpen: (hotel: Hotel) => void;
}

const formatUpdated = (h: Hotel) => {
  const raw = h.updatedAt || h.createdAt;
  return raw ? new Date(raw).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
};

/** Card view of the hotels list: same data and actions as the table rows. */
export function HotelCardGrid({ hotels, selectedIds, onToggleSelect, onOpen }: HotelCardGridProps) {
  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {hotels.map((h) => {
        const id = readId(h);
        const selected = selectedIds.has(id);
        const image = h.primaryImage || h.heroImage;
        return (
          <article
            key={id}
            className={`flex flex-col rounded-2xl border bg-white overflow-hidden shadow-2xs transition-colors ${
              selected ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="relative aspect-[16/9] bg-brand-pale">
              <button
                type="button"
                onClick={() => onOpen(h)}
                aria-label={`Open ${h.name}`}
                className="absolute inset-0 flex items-center justify-center text-brand-primary"
              >
                {image ? (
                  <img
                    src={resolveImageUrl(image)}
                    alt={h.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <Building2 size={32} />
                )}
              </button>
              <div className="absolute top-3 left-3">
                <Checkbox checked={selected} onChange={() => onToggleSelect(id)} aria-label={`Select ${h.name}`} />
              </div>
              <div className="absolute top-2.5 right-2.5">
                <Status status={h.status} variant="pill" />
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col gap-3">
              <div className="min-w-0">
                <b className="block text-sm font-bold text-slate-900 truncate">{h.name}</b>
                <span className="block text-xs text-slate-400 font-mono truncate">/{h.slug}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                <MapPin size={13} className="text-slate-400 shrink-0" />
                {h.address?.city || 'City not set'}, {h.address?.countryCode || '—'}
              </span>
              <HotelSetupProgress setup={h.setup} />
            </div>

            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">Updated {formatUpdated(h)}</span>
              <Button variant="outline" size="sm" leftIcon={<ExternalLink size={13} />} onClick={() => onOpen(h)}>
                Manage
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
