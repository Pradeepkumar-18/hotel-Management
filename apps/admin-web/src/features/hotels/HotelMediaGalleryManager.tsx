import { useState, useRef, type DragEvent } from 'react';
import {
  Upload,
  Link as LinkIcon,
  Star,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { HotelMediaItem, uploadHotelMediaFile } from '../../api';
import { resolveImageUrl } from '../../utils/helpers';
import { useToast } from '../../ui-feedback';

export interface HotelMediaGalleryManagerProps {
  media: HotelMediaItem[];
  onChange: (items: HotelMediaItem[]) => void;
  disabled?: boolean;
}

export function HotelMediaGalleryManager({
  media,
  onChange,
  disabled = false,
}: HotelMediaGalleryManagerProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeMode, setActiveMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  // URL input states
  const [urlInput, setUrlInput] = useState('');
  const [captionInput, setCaptionInput] = useState('');
  const [setAsPrimaryOnAdd, setSetAsPrimaryOnAdd] = useState(false);
  const [urlError, setUrlError] = useState('');

  const primaryItemIndex = media.findIndex((m) => m.isPrimary);

  // Helper to sanitize filename into a human-readable caption
  const formatCaptionFromFileName = (filename: string): string => {
    const base = filename.replace(/\.[^/.]+$/, '');
    const clean = base.replace(/[-_]+/g, ' ').trim();
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  // Upload handler for 1 or more files
  const handleFiles = async (files: FileList | File[]) => {
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f.type.startsWith('image/')) {
        toast.error(`"${f.name}" is not a supported image file.`);
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`"${f.name}" exceeds the 10MB maximum limit.`);
        continue;
      }
      validFiles.push(f);
    }

    if (validFiles.length === 0) return;

    setUploadingCount(validFiles.length);

    try {
      const uploadPromises = validFiles.map(async (file) => {
        const res = await uploadHotelMediaFile(file);
        return {
          url: res.url,
          caption: formatCaptionFromFileName(file.name),
        };
      });

      const results = await Promise.allSettled(uploadPromises);
      const successfulNewItems: HotelMediaItem[] = [];

      results.forEach((res, idx) => {
        if (res.status === 'fulfilled') {
          successfulNewItems.push({
            url: res.value.url,
            caption: res.value.caption,
            isPrimary: false,
            displayOrder: media.length + idx,
          });
        } else {
          toast.error(`Failed to upload "${validFiles[idx].name}".`);
        }
      });

      if (successfulNewItems.length > 0) {
        let updatedList = [...media, ...successfulNewItems];
        // If no primary exists yet, set the first image as cover thumbnail
        if (!updatedList.some((m) => m.isPrimary)) {
          updatedList[0].isPrimary = true;
        }
        // Normalize displayOrder
        updatedList = updatedList.map((item, idx) => ({ ...item, displayOrder: idx }));
        onChange(updatedList);
        toast.success(
          successfulNewItems.length === 1
            ? '1 photo uploaded and added to gallery.'
            : `${successfulNewItems.length} photos uploaded and added to gallery.`
        );
      }
    } catch {
      toast.error('An error occurred during image upload. Please try again.');
    } finally {
      setUploadingCount(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && uploadingCount === 0) setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || uploadingCount > 0) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFiles(e.dataTransfer.files);
    }
  };

  // Add via public URL
  const handleAddViaUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError('Please enter an image URL.');
      return;
    }
    let isValid = false;
    try {
      new URL(trimmed);
      isValid = true;
    } catch {
      if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/')) {
        isValid = true;
      }
    }

    if (!isValid) {
      setUrlError('Please enter a valid HTTP/HTTPS image URL.');
      return;
    }

    setUrlError('');
    const shouldBePrimary = setAsPrimaryOnAdd || media.length === 0;

    let updatedList = media.map((item) => (shouldBePrimary ? { ...item, isPrimary: false } : item));
    updatedList.push({
      url: trimmed,
      caption: captionInput.trim() || undefined,
      isPrimary: shouldBePrimary,
      displayOrder: updatedList.length,
    });

    onChange(updatedList);
    setUrlInput('');
    setCaptionInput('');
    setSetAsPrimaryOnAdd(false);
    toast.success('Photo added to gallery.');
  };

  // Set selected item as Cover Thumbnail
  const setAsThumbnail = (index: number) => {
    if (disabled) return;
    const updated = media.map((item, idx) => ({
      ...item,
      isPrimary: idx === index,
    }));
    onChange(updated);
    toast.success(`"${media[index].caption || `Photo ${index + 1}`}" set as primary cover thumbnail.`);
  };

  // Update caption/description for a specific photo
  const updateCaption = (index: number, newCaption: string) => {
    const updated = [...media];
    updated[index] = { ...updated[index], caption: newCaption };
    onChange(updated);
  };

  // Remove photo
  const removePhoto = (index: number) => {
    if (disabled) return;
    const removedItem = media[index];
    let updated = media.filter((_, idx) => idx !== index);

    // If the removed item was primary and images remain, make the first image primary
    if (removedItem?.isPrimary && updated.length > 0) {
      updated[0] = { ...updated[0], isPrimary: true };
    }

    updated = updated.map((item, idx) => ({ ...item, displayOrder: idx }));
    onChange(updated);
  };

  // Reorder photo (shift position)
  const movePhoto = (index: number, direction: -1 | 1) => {
    if (disabled) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= media.length) return;

    const copy = [...media];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    const updated = copy.map((item, idx) => ({ ...item, displayOrder: idx }));
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              Property Photo Gallery & Media Assets
            </h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
              {media.length} {media.length === 1 ? 'photo' : 'photos'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload high-resolution photography. Designate one photo as the <b>Cover Thumbnail</b> displayed on search cards and catalog previews.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {primaryItemIndex !== -1 ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <Star size={13} className="fill-emerald-600 text-emerald-600" />
              <span>Cover Thumbnail: Photo #{primaryItemIndex + 1}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <AlertCircle size={13} />
              <span>No cover thumbnail selected</span>
            </div>
          )}
        </div>
      </div>

      {/* Mode Tabs: Upload Files vs URL */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveMode('upload')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeMode === 'upload'
                ? 'bg-brand-primary text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Upload size={14} />
            <span>Upload Image Files</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('url')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeMode === 'url'
                ? 'bg-brand-primary text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LinkIcon size={14} />
            <span>Import via Direct URL</span>
          </button>
        </div>

        {/* Tab 1: Direct File Dropzone (Multiple Files Supported) */}
        {activeMode === 'upload' && (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => {
              if (!disabled && uploadingCount === 0 && fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-brand-primary bg-emerald-50/60 ring-4 ring-emerald-500/10'
                : 'border-slate-300 hover:border-brand-primary bg-slate-50/50 hover:bg-slate-50'
            } ${disabled || uploadingCount > 0 ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  void handleFiles(e.target.files);
                }
              }}
            />

            {uploadingCount > 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-4">
                <Loader2 size={32} className="animate-spin text-brand-primary" />
                <span className="text-xs font-bold text-slate-800">
                  Uploading {uploadingCount} {uploadingCount === 1 ? 'image' : 'images'} to server…
                </span>
                <span className="text-[11px] text-slate-500">
                  Optimizing and preparing property media assets
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-brand-primary shadow-2xs">
                  <Upload size={22} />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block">
                    Drag and drop photos here, or <span className="text-brand-primary underline underline-offset-2">browse files</span>
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">
                    Select one or multiple photos simultaneously • Supports PNG, JPG, WebP, AVIF up to 10MB per file
                  </span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
                  <Sparkles size={12} className="text-amber-500" />
                  <span>The first uploaded photo is automatically set as the primary cover thumbnail</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Add via Direct Image URL */}
        {activeMode === 'url' && (
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Image URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-1566073771259-6a8506099945"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (urlError) setUrlError('');
                  }}
                  className={`w-full px-3 py-2 text-xs bg-white rounded-lg border outline-none font-mono ${
                    urlError ? 'border-rose-500' : 'border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddViaUrl();
                    }
                  }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Photo Caption / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deluxe Ocean View Suite"
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddViaUrl();
                    }
                  }}
                />
              </div>
            </div>

            {urlError && <p className="text-xs text-rose-600 font-semibold">{urlError}</p>}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={setAsPrimaryOnAdd}
                  onChange={(e) => setSetAsPrimaryOnAdd(e.target.checked)}
                  className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                />
                <span>Set as primary cover thumbnail immediately</span>
              </label>

              <button
                type="button"
                onClick={handleAddViaUrl}
                disabled={!urlInput.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg shadow-xs hover:bg-[#123e32] transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Check size={14} />
                <span>Add Photo to Gallery</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Gallery Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Gallery Photos ({media.length})
          </span>
          {media.length > 1 && (
            <span className="text-[11px] text-slate-400">
              Tip: Click "Set as Cover Thumbnail" on any photo to designate it as the primary listing card image.
            </span>
          )}
        </div>

        {media.length === 0 ? (
          <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Upload size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-bold text-slate-700">No photos in gallery yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Drag and drop image files above or enter a public URL to start building your hotel photo gallery.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {media.map((item, idx) => (
              <div
                key={idx}
                className={`flex flex-col justify-between rounded-xl border bg-white overflow-hidden transition-all shadow-2xs ${
                  item.isPrimary
                    ? 'border-brand-primary/80 ring-2 ring-brand-primary/20 bg-emerald-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Photo Preview & Badges */}
                <div className="relative aspect-video w-full bg-slate-100 overflow-hidden group">
                  <img
                    src={resolveImageUrl(item.url)}
                    alt={item.caption || `Hotel photo ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-102"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />

                  {/* Primary Thumbnail Badge */}
                  {item.isPrimary ? (
                    <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 bg-[#164e3f] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-md backdrop-blur-xs">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span>Cover Thumbnail</span>
                    </div>
                  ) : (
                    <span className="absolute top-2.5 left-2.5 inline-flex items-center text-[10px] font-bold bg-slate-900/70 text-white px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs">
                      #{idx + 1}
                    </span>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    disabled={disabled}
                    title="Remove photo"
                    className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg shadow-xs backdrop-blur-xs transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Photo Description / Caption Input */}
                <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Photo Description / Caption</span>
                      <span className="text-[10px] font-normal text-slate-400">Catalog caption</span>
                    </label>
                    <input
                      type="text"
                      disabled={disabled}
                      value={item.caption || ''}
                      onChange={(e) => updateCaption(idx, e.target.value)}
                      placeholder="e.g. Deluxe Suite oceanfront balcony"
                      className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors"
                    />
                  </div>

                  {/* Footer Actions: Cover Thumbnail Toggle & Ordering */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      {item.isPrimary ? (
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                          <Check size={13} className="text-emerald-700" />
                          <span>Primary Cover</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => setAsThumbnail(idx)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-brand-primary hover:bg-emerald-50 hover:border-brand-primary/40 px-2.5 py-1 rounded-md border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Star size={13} className="text-amber-500" />
                          <span>Set as Thumbnail</span>
                        </button>
                      )}
                    </div>

                    {/* Order adjustment buttons */}
                    {media.length > 1 && (
                      <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5">
                        <button
                          type="button"
                          disabled={disabled || idx === 0}
                          onClick={() => movePhoto(idx, -1)}
                          title="Move photo earlier"
                          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        >
                          <ChevronLeft size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={disabled || idx === media.length - 1}
                          onClick={() => movePhoto(idx, 1)}
                          title="Move photo later"
                          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        >
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
