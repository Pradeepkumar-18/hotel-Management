import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import { Upload, Link as LinkIcon, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { Modal, Field, Input, Button, Alert } from '../../components/ui';
import { uploadHotelMediaFile } from '../../api';
import { useToast } from '../../ui-feedback';

export interface PhotoUploadPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPhoto: (photo: { url: string; caption?: string }) => void;
}

export function PhotoUploadPopup({ isOpen, onClose, onAddPhoto }: PhotoUploadPopupProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [url, setUrl] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setUrl('');
    setUploadedUrl('');
    setCaption('');
    setError('');
    setIsUploading(false);
    setIsDragging(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP, GIF, or AVIF).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file size must not exceed 10MB.');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const res = await uploadHotelMediaFile(file);
      setUploadedUrl(res.url);

      // Auto-populate caption from filename if user hasn't typed one
      if (!caption.trim()) {
        const autoCaption = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]+/g, ' ')
          .trim();
        setCaption(autoCaption.charAt(0).toUpperCase() + autoCaption.slice(1));
      }

      toast.success('Image uploaded. Review and edit the caption below before adding.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const handleConfirmAdd = () => {
    setError('');
    let finalUrl = '';

    if (mode === 'upload') {
      if (!uploadedUrl) {
        setError('Please select and upload an image file first.');
        return;
      }
      finalUrl = uploadedUrl;
    } else {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) {
        setError('Please enter a valid image URL.');
        return;
      }
      try {
        new URL(trimmedUrl);
      } catch {
        setError('Please enter a valid web address (e.g. https://images.unsplash.com/...)');
        return;
      }
      finalUrl = trimmedUrl;
    }

    onAddPhoto({
      url: finalUrl,
      caption: caption.trim() || undefined,
    });

    toast.success('Photo added to property.');
    handleClose();
  };

  const hasImageReady = mode === 'upload' ? Boolean(uploadedUrl) : Boolean(url.trim());

  return (
    <Modal
      title="Upload Property Photo"
      subtitle="Add photos to your property gallery. You can customize the caption and set the cover image."
      onClose={handleClose}
      variant="dialog"
      size="medium"
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirmAdd}
            disabled={isUploading || !hasImageReady}
          >
            Add Photo to Property
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'upload' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            onClick={() => {
              setMode('upload');
              setError('');
            }}
          >
            <Upload size={14} />
            Upload File
          </button>
          <button
            type="button"
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'url' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            onClick={() => {
              setMode('url');
              setError('');
            }}
          >
            <LinkIcon size={14} />
            Image URL
          </button>
        </div>

        {mode === 'upload' ? (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="hidden"
            />

            {!uploadedUrl ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-emerald-600 bg-emerald-50/60 scale-[0.99]'
                    : 'border-slate-300 hover:border-emerald-600 hover:bg-slate-50/70 bg-white'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                  {isUploading ? (
                    <Loader2 size={22} className="animate-spin text-emerald-700" />
                  ) : (
                    <Upload size={22} />
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {isUploading ? 'Uploading image to server…' : 'Click to browse or drag & drop image'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Supports JPG, PNG, WebP, GIF, or AVIF up to 10MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-3 bg-emerald-50/40 border border-emerald-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    Image uploaded successfully
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    leftIcon={<RefreshCw size={13} />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    Change Image
                  </Button>
                </div>

                <div className="aspect-video w-full max-h-48 rounded-xl overflow-hidden border border-emerald-300/60 bg-slate-100 relative shadow-2xs">
                  <img
                    src={uploadedUrl}
                    alt={caption || 'Uploaded preview'}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Field label="Public image URL" required hint="Direct https link to an image file">
              <Input
                type="url"
                placeholder="https://images.unsplash.com/photo-1566073771259-6a8506099945"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </Field>

            {url.trim() && (
              <div className="aspect-video w-full max-h-40 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative">
                <img
                  src={url.trim()}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() =>
                    setError('Could not load image from this URL. Verify the link is accessible.')
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* Caption Input - Always available and editable before submitting */}
        <Field
          label="Photo caption"
          hint="Customize the caption for this photo (e.g. Deluxe Room, Sunset Infinity Pool)"
        >
          <Input
            placeholder="e.g. Deluxe Suite Bedroom"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={isUploading}
          />
        </Field>
      </div>
    </Modal>
  );
}
