import { useState } from 'react';
import { Image, Plus, Star, Trash2 } from 'lucide-react';
import { Hotel, HotelMediaItem, updateHotelMedia } from '../../api';
import { Modal, Field, Input, Button, Alert } from '../../components/ui';
import { useToast } from '../../ui-feedback';
import { useServerErrors } from '../../hooks/useServerErrors';
import { handleFormError } from '../../hooks/handleFormError';

export interface HotelMediaModalProps {
  hotel: Hotel;
  onClose: () => void;
  onSaved: (updatedHotel: Hotel) => void;
}

export function HotelMediaModal({ hotel, onClose, onSaved }: HotelMediaModalProps) {
  const toast = useToast();
  const formErrors = useServerErrors();
  const [mediaList, setMediaList] = useState<HotelMediaItem[]>(() => {
    if (hotel.media && hotel.media.length > 0) {
      return hotel.media;
    }
    const legacy: HotelMediaItem[] = [];
    if (hotel.primaryImage || hotel.heroImage) {
      legacy.push({ url: (hotel.primaryImage || hotel.heroImage)!, isPrimary: true, caption: 'Primary Hero' });
    }
    if (hotel.images) {
      hotel.images.forEach(img => {
        if (img !== hotel.primaryImage && img !== hotel.heroImage) {
          legacy.push({ url: img, isPrimary: false });
        }
      });
    }
    return legacy;
  });

  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const addImage = () => {
    const trimmed = newUrl.trim();
    if (!trimmed) {
      setError('Please enter a valid image URL');
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      setError('Please enter a valid URL (e.g. https://images.unsplash.com/...)');
      return;
    }

    setError('');
    const isFirst = mediaList.length === 0;
    setMediaList(prev => [
      ...prev,
      {
        url: trimmed,
        isPrimary: isFirst,
        caption: newCaption.trim() || undefined,
        displayOrder: prev.length,
      },
    ]);
    setNewUrl('');
    setNewCaption('');
  };

  const removeImage = (index: number) => {
    setMediaList(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (prev[index]?.isPrimary && next.length > 0) {
        next[0].isPrimary = true;
      }
      return next;
    });
  };

  const setPrimary = (index: number) => {
    setMediaList(prev =>
      prev.map((item, i) => ({
        ...item,
        isPrimary: i === index,
      }))
    );
  };

  const handleSave = async () => {
    setError('');
    formErrors.clear();
    setSaving(true);
    try {
      const updated = await updateHotelMedia(hotel._id, hotel.version, mediaList);
      toast.success('Hotel photo gallery saved successfully.');
      onSaved(updated);
    } catch (err) {
      handleFormError(err, formErrors, toast, {
        onConflict: () => {
          toast.error('Hotel media was updated in another session. Please reopen.');
        },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Photo Gallery — ${hotel.name}`}
      subtitle="Manage property hero image and gallery photos."
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" isLoading={saving} loadingLabel="Saving changes…" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}

        {/* Add New Image Form */}
        <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Add Photo to Gallery</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Field label="Image URL">
                <Input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-1566073771259-6a8506099945"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                />
              </Field>
            </div>
            <div>
              <Field label="Caption (Optional)">
                <Input
                  type="text"
                  placeholder="Lobby View"
                  value={newCaption}
                  onChange={e => setNewCaption(e.target.value)}
                />
              </Field>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <Button variant="outline" size="sm" leftIcon={<Plus size={15} />} onClick={addImage}>
              Add Photo
            </Button>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Gallery Photos ({mediaList.length})
          </span>
          {mediaList.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
              <Image size={24} className="mx-auto mb-2 text-slate-400" />
              No gallery images added yet. Add an image URL above to set the primary hero photo.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
              {mediaList.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                    item.isPrimary ? 'bg-emerald-50/50 border-brand-primary' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                      <img src={item.url} alt={item.caption || 'Hotel photo'} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <b className="text-xs font-bold text-slate-900 truncate">{item.caption || `Photo ${idx + 1}`}</b>
                      <span className="text-[11px] text-slate-400 truncate font-mono">{item.url}</span>
                      {item.isPrimary && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary mt-0.5">
                          <Star size={11} className="fill-brand-primary" /> Primary Hero Photo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!item.isPrimary && (
                      <button
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Set as primary hero photo"
                        onClick={() => setPrimary(idx)}
                      >
                        <Star size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove photo"
                      onClick={() => removeImage(idx)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
