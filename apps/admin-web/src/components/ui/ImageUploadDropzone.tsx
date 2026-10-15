import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, X, Loader2, CheckCircle2 } from 'lucide-react';
import { uploadHotelMediaFile } from '../../api';
import { useToast } from '../../ui-feedback';

export interface ImageUploadDropzoneProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  aspectRatio?: string;
  className?: string;
}

export function ImageUploadDropzone({
  value,
  onChange,
  label = 'Hero / Primary Photo',
  hint = 'Upload an image file from your computer or paste an external image URL.',
  className = '',
}: ImageUploadDropzoneProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value || '');

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP, GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB.');
      return;
    }

    setUploading(true);
    try {
      const res = await uploadHotelMediaFile(file);
      onChange(res.url);
      setUrlInput(res.url);
      toast.success('Image uploaded successfully.');
    } catch (err) {
      // Fallback to client-side data URL if upload endpoint isn't reached
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onChange(dataUrl);
        setUrlInput(dataUrl);
        toast.info('Image loaded from device.');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handleUrlChange = (val: string) => {
    setUrlInput(val);
    onChange(val.trim());
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="text-xs font-bold text-slate-700 block">{label}</label>
          {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
        </div>

        {/* Mode Selector */}
        <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg self-start sm:self-center border border-slate-200/80">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              mode === 'upload'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload size={13} />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              mode === 'url'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LinkIcon size={13} />
            <span>Image URL</span>
          </button>
        </div>
      </div>

      {/* Upload Dropzone Mode */}
      {mode === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />

          {!value ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group ${
                isDragging
                  ? 'border-brand-primary bg-emerald-50/60 ring-2 ring-emerald-500/20'
                  : 'border-slate-300 hover:border-emerald-600 bg-slate-50/60 hover:bg-emerald-50/20'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-brand-primary group-hover:scale-105 transition-all shadow-2xs">
                {uploading ? (
                  <Loader2 size={22} className="animate-spin text-brand-primary" />
                ) : (
                  <Upload size={22} />
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {uploading ? 'Uploading image…' : 'Click to upload or drag & drop'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  PNG, JPG, WebP or GIF (max. 5MB)
                </span>
              </div>
            </div>
          ) : (
            <div className="relative rounded-xl border border-slate-200 bg-white p-3 flex flex-col sm:flex-row items-center gap-4 shadow-2xs">
              <div className="w-full sm:w-44 h-28 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                <img
                  src={value}
                  alt="Uploaded photo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                  <CheckCircle2 size={13} /> Photo Ready
                </div>
                <p className="text-xs font-semibold text-slate-800 truncate">{value}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    Replace Image
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2.5 py-1 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* URL Input Mode */}
      {mode === 'url' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-1566073771259-6a8506099945"
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 font-mono"
            />
            {urlInput && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                title="Clear URL"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {value && (
            <div className="w-full sm:w-64 h-36 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative shadow-2xs">
              <img
                src={value}
                alt="Image Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-[#164e3f] text-white px-2 py-0.5 rounded shadow-xs">
                Preview
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
