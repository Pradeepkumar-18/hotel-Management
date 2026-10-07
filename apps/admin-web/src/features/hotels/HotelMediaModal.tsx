import { useState } from 'react';
import { Image, Plus, Star, Trash2 } from 'lucide-react';
import { Hotel, HotelMediaItem, updateHotelMedia } from '../../api';
import { Modal, Field, Button, Alert } from '../../components/ui';
import { AsyncButton, useToast } from '../../ui-feedback';

export interface HotelMediaModalProps {
  hotel: Hotel;
  onClose: () => void;
  onSaved: (updatedHotel: Hotel) => void;
}

export function HotelMediaModal({ hotel, onClose, onSaved }: HotelMediaModalProps) {
  const toast = useToast();
  const [mediaList, setMediaList] = useState<HotelMediaItem[]>(() => {
    if (hotel.media && hotel.media.length > 0) {
      return hotel.media;
    }
    const legacy = [];
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
    try {
      const updated = await updateHotelMedia(hotel._id, hotel.version, mediaList);
      toast.success('Hotel photo gallery saved successfully.');
      onSaved(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update hotel media.';
      setError(msg);
      toast.error(msg);
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
          <AsyncButton onClick={handleSave} className="btn-primary min-h-[42px] px-5 text-sm font-semibold rounded-lg bg-[#1e6354] hover:bg-[#164d42] text-white">
            Save Changes
          </AsyncButton>
        </div>
      }
    >
      <div className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}

        {/* Add New Image Form */}
        <div className="p-4 bg-[#f8faf8] border border-[#e4e9e3] rounded-xl space-y-3">
          <span className="text-xs font-bold text-[#33483e] uppercase tracking-wider block">Add Photo to Gallery</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Field label="Image URL">
                <input
                  type="url"
                  className="input w-full bg-white border border-[#d8e0da] rounded-lg h-9 px-3 text-xs"
                  placeholder="https://images.unsplash.com/photo-1566073771259-6a8506099945"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                />
              </Field>
            </div>
            <div>
              <Field label="Caption (Optional)">
                <input
                  type="text"
                  className="input w-full bg-white border border-[#d8e0da] rounded-lg h-9 px-3 text-xs"
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
          <span className="text-xs font-bold text-[#73827b] uppercase tracking-wider block">
            Gallery Photos ({mediaList.length})
          </span>
          {mediaList.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-[#e4e9e3] rounded-xl text-xs text-[#73827b]">
              <Image size={24} className="mx-auto mb-2 text-[#92b3a3]" />
              No gallery images added yet. Add an image URL above to set the primary hero photo.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
              {mediaList.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                    item.isPrimary ? 'bg-[#f0f7f3] border-[#1e6354]' : 'bg-white border-[#e4e9e3]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-lg bg-[#e9f3ee] border border-[#c2dcd0] overflow-hidden shrink-0 relative">
                      <img src={item.url} alt={item.caption || 'Hotel photo'} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <b className="text-xs font-bold text-[#20322d] truncate">{item.caption || `Photo ${idx + 1}`}</b>
                      <span className="text-[11px] text-[#73827b] truncate font-mono">{item.url}</span>
                      {item.isPrimary && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1e6354] mt-0.5">
                          <Star size={11} className="fill-[#1e6354]" /> Primary Hero Photo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!item.isPrimary && (
                      <button
                        type="button"
                        className="p-1.5 text-[#73827b] hover:text-[#1e6354] hover:bg-white rounded-lg transition-colors cursor-pointer"
                        title="Set as primary hero photo"
                        onClick={() => setPrimary(idx)}
                      >
                        <Star size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="p-1.5 text-[#73827b] hover:text-[#b91c1c] hover:bg-[#fee2e2] rounded-lg transition-colors cursor-pointer"
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
