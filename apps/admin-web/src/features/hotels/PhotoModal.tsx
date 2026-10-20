import { useEffect, useRef, useState, type DragEvent } from 'react';
import { ImagePlus, Link as LinkIcon, Plus, Star, Trash2, Upload, X } from 'lucide-react';
import { HotelMediaItem, uploadHotelMediaFile } from '../../api';
import { Alert, Button, Checkbox, Field, Input, Modal, Textarea } from '../../components/ui';
import { resolveImageUrl } from '../../utils/helpers';

// Same rules as the API (media-management.md): JPEG/PNG/WebP up to 10 MB, https links, 200-char captions.
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;
const IMAGE_URL_RE = /^(https:\/\/\S+|\/uploads\/[A-Za-z0-9._-]+)$/;
export const CAPTION_MAX = 200;

export type SavedPhoto = { url: string; caption?: string; isPrimary: boolean };
type Picked = { id: number; file: File; preview: string; caption: string };

interface PhotoModalProps {
  /** Existing photo to edit; omit to add new ones. */
  photo?: HotelMediaItem;
  /** True when the gallery is empty (adding) or this is the only photo (editing): one of these becomes the cover. */
  firstPhoto?: boolean;
  /** Adding returns every new photo; editing returns one. */
  onSave: (photos: SavedPhoto[]) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const captionFromName = (name: string) => {
  const base = name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
  return (base.charAt(0).toUpperCase() + base.slice(1)).slice(0, CAPTION_MAX);
};

/**
 * Pop-up to add photos (several files at once, or one link) with a description each and a cover choice,
 * or to edit one existing photo. Files upload when Save is clicked.
 */
export function PhotoModal({ photo, firstPhoto = false, onSave, onDelete, onClose }: PhotoModalProps) {
  const isEdit = Boolean(photo);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const [mode, setMode] = useState<'file' | 'link'>('file');
  const [picked, setPicked] = useState<Picked[]>([]);
  // Cover among the new photos: an id, or null for "keep the current cover".
  const [coverId, setCoverId] = useState<number | null>(null);
  const [link, setLink] = useState('');
  const [caption, setCaption] = useState(photo?.caption ?? '');
  const [isPrimary, setIsPrimary] = useState(Boolean(photo?.isPrimary) || firstPhoto);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');

  // Free local previews when the pop-up closes.
  const pickedRef = useRef(picked);
  pickedRef.current = picked;
  useEffect(() => () => pickedRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const rejected: string[] = [];
    const accepted: Picked[] = [];
    Array.from(files).forEach((f) => {
      if (!ALLOWED_IMAGE_TYPES.includes(f.type) || f.size > MAX_BYTES) rejected.push(f.name);
      else accepted.push({ id: nextId.current++, file: f, preview: URL.createObjectURL(f), caption: captionFromName(f.name) });
    });
    setError(rejected.length ? `Skipped ${rejected.join(', ')} — use JPEG, PNG or WebP up to 10 MB.` : '');
    setPicked((prev) => {
      const next = [...prev, ...accepted];
      if (firstPhoto && coverId === null && next.length) setCoverId(next[0].id);
      return next;
    });
  };

  const removePicked = (id: number) => {
    setPicked((prev) => {
      const gone = prev.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.preview);
      const next = prev.filter((p) => p.id !== id);
      if (coverId === id) setCoverId(firstPhoto && next.length ? next[0].id : null);
      return next;
    });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const linkValid = IMAGE_URL_RE.test(link.trim());
  const canSave = isEdit || (mode === 'file' ? picked.length > 0 : linkValid);

  const save = async () => {
    setError('');
    if (isEdit) {
      onSave([{ url: photo!.url, caption: caption.trim() || undefined, isPrimary }]);
      return onClose();
    }
    if (mode === 'link') {
      if (!linkValid) return setError('Enter a secure image link starting with https://');
      onSave([{ url: link.trim(), caption: caption.trim() || undefined, isPrimary }]);
      return onClose();
    }
    const results: SavedPhoto[] = [];
    const failed: string[] = [];
    for (const [i, p] of picked.entries()) {
      setSaving(`Uploading ${i + 1} of ${picked.length}…`);
      try {
        const { url } = await uploadHotelMediaFile(p.file);
        results.push({ url, caption: p.caption.trim() || undefined, isPrimary: p.id === coverId });
      } catch {
        failed.push(p.file.name);
      }
    }
    setSaving('');
    if (results.length) onSave(results);
    if (failed.length) {
      // Keep only the failed ones so the user can retry them.
      setPicked((prev) => prev.filter((p) => failed.includes(p.file.name)));
      return setError(`${results.length} saved. Could not upload: ${failed.join(', ')}. Try again.`);
    }
    onClose();
  };

  const busy = Boolean(saving);

  return (
    <Modal
      variant="dialog"
      size={isEdit ? 'medium' : 'wide'}
      closeOnBackdrop={false}
      title={isEdit ? 'Edit photo' : 'Add photos'}
      subtitle={isEdit ? 'Change the description or make it the cover photo.' : 'Choose one or more images, describe each, and pick a cover.'}
      onClose={busy ? () => undefined : onClose}
    >
      <div className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}

        {isEdit ? (
          <>
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
              <img src={resolveImageUrl(photo!.url)} alt={caption || 'Photo'} className="w-full h-full object-cover" />
            </div>
            <DescriptionField value={caption} onChange={setCaption} />
            <Checkbox
              checked={isPrimary}
              disabled={firstPhoto}
              onChange={(e) => setIsPrimary(e.target.checked)}
              label={firstPhoto ? 'Cover photo (the only photo is always the cover)' : 'Use as the cover photo'}
            />
          </>
        ) : (
          <>
            <div className="inline-flex p-1 bg-slate-100 rounded-lg" role="tablist" aria-label="Image source">
              {(['file', 'link'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => {
                    setMode(m);
                    setError('');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    mode === m ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {m === 'file' ? <Upload size={13} /> : <LinkIcon size={13} />}
                  {m === 'file' ? 'Upload from device' : 'Use a link'}
                </button>
              ))}
            </div>

            {mode === 'file' ? (
              <>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => !busy && fileInputRef.current?.click()}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 ${
                    picked.length ? 'py-4' : 'py-10'
                  } ${dragging ? 'border-brand-primary bg-brand-pale' : 'border-slate-300 bg-slate-50 hover:border-brand-primary'}`}
                >
                  {picked.length ? <Plus size={18} className="text-brand-primary" /> : <ImagePlus size={28} className="text-brand-primary" />}
                  <span className="text-sm font-semibold text-slate-800">
                    {picked.length ? 'Add more images' : 'Click to choose images, or drag them here'}
                  </span>
                  <span className="text-xs text-slate-500">You can select several at once · JPEG, PNG or WebP, up to 10 MB each</span>
                </div>

                {picked.length > 0 && (
                  <ul className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                    {picked.map((p, i) => (
                      <li key={p.id} className={`flex gap-3 p-2.5 rounded-xl border ${coverId === p.id ? 'border-brand-primary bg-brand-pale/40' : 'border-slate-200'}`}>
                        <img src={p.preview} alt="" className="w-24 h-20 rounded-lg object-cover shrink-0 bg-slate-100" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <Input
                            size="sm"
                            maxLength={CAPTION_MAX}
                            aria-label={`Description for image ${i + 1}`}
                            value={p.caption}
                            onChange={(e) => setPicked((prev) => prev.map((x) => (x.id === p.id ? { ...x, caption: e.target.value } : x)))}
                            placeholder="Describe what guests see"
                          />
                          <button
                            type="button"
                            aria-pressed={coverId === p.id}
                            onClick={() => setCoverId(p.id)}
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-semibold transition-colors ${
                              coverId === p.id
                                ? 'border-brand-primary bg-brand-primary text-white'
                                : 'border-slate-200 text-slate-600 hover:border-brand-primary hover:text-brand-primary'
                            }`}
                          >
                            <Star size={12} className={coverId === p.id ? 'fill-amber-300 text-amber-300' : 'text-amber-500'} />
                            {coverId === p.id ? 'Cover photo' : 'Make cover'}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePicked(p.id)}
                          disabled={busy}
                          aria-label={`Remove image ${i + 1}`}
                          className="self-start p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {!firstPhoto && picked.length > 0 && coverId !== null && (
                  <button type="button" className="text-xs text-slate-500 hover:underline" onClick={() => setCoverId(null)}>
                    Keep the current cover photo instead
                  </button>
                )}
              </>
            ) : (
              <>
                <Field label="Image link" required error={link && !linkValid ? 'Must start with https://' : undefined}>
                  <Input
                    type="url"
                    inputMode="url"
                    maxLength={1000}
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    onKeyDown={(e) => {
                      // The gallery can sit inside another form; Enter must save the photo, not submit that form.
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void save();
                      }
                    }}
                    placeholder="https://images.unsplash.com/photo-…"
                    className="font-mono"
                    isError={Boolean(link && !linkValid)}
                    autoFocus
                  />
                </Field>
                {linkValid && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
                    <img src={link.trim()} alt="Link preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <DescriptionField value={caption} onChange={setCaption} />
                <Checkbox
                  checked={isPrimary}
                  disabled={firstPhoto}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  label={firstPhoto ? 'Cover photo (the first photo is always the cover)' : 'Use as the cover photo'}
                />
              </>
            )}
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            {isEdit && onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={<Trash2 size={14} />}
                className="text-rose-600 hover:bg-rose-50"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
              >
                Remove photo
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={save} disabled={!canSave} isLoading={busy} loadingLabel={saving || 'Saving…'}>
              {!isEdit && mode === 'file' && picked.length > 1 ? `Save ${picked.length} photos` : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function DescriptionField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="Description" hint="Shown to guests under the photo, e.g. Rooftop pool at sunset">
      <Textarea rows={2} maxLength={CAPTION_MAX} showCount value={value} onChange={(e) => onChange(e.target.value)} placeholder="Describe what guests see in this photo" />
    </Field>
  );
}
