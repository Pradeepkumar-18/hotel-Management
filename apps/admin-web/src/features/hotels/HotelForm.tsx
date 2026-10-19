import { useState, type FormEvent } from 'react';
import { Check, Upload, Star, Trash2, Image as ImageIcon } from 'lucide-react';
import { Hotel, HotelMediaItem, updateHotelMedia } from '../../api';
import { useBusyGuard, useToast } from '../../ui-feedback';
import { Button, Field, Input, Textarea, Alert, ConfirmDialog } from '../../components/ui';
import { useServerErrors } from '../../hooks/useServerErrors';
import { handleFormError } from '../../hooks/handleFormError';
import { createHotel, updateHotel } from './hotels.api';
import { readId } from '../../utils/helpers';
import { PhotoUploadPopup } from './PhotoUploadPopup';
import { PhotoEditModal } from './PhotoEditModal';

export interface HotelFormProps {
  hotel?: Hotel | null;
  onSuccess: (savedHotel: Hotel) => void;
  onCancel: () => void;
}

export function HotelForm({ hotel, onSuccess, onCancel }: HotelFormProps) {
  const isEditing = Boolean(hotel);
  const { busy, run } = useBusyGuard();
  const toast = useToast();
  const formErrors = useServerErrors();

  // Photo management state
  const [isPhotoPopupOpen, setIsPhotoPopupOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [mediaList, setMediaList] = useState<HotelMediaItem[]>(() => {
    if (hotel?.media && hotel.media.length > 0) return hotel.media;
    const legacy: HotelMediaItem[] = [];
    if (hotel?.primaryImage || hotel?.heroImage) {
      legacy.push({ url: (hotel.primaryImage || hotel.heroImage)!, isPrimary: true, caption: 'Primary Hero' });
    }
    if (hotel?.images) {
      hotel.images.forEach((img) => {
        if (img !== hotel.primaryImage && img !== hotel.heroImage) {
          legacy.push({ url: img, isPrimary: false });
        }
      });
    }
    return legacy;
  });

  const handleAddPhoto = (photo: { url: string; caption?: string }) => {
    setMediaList((prev) => {
      const isFirst = prev.length === 0;
      return [
        ...prev,
        {
          url: photo.url,
          caption: photo.caption,
          isPrimary: isFirst,
          displayOrder: prev.length,
        },
      ];
    });
  };

  const handleRemovePhoto = (index: number) => {
    setMediaList((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (prev[index]?.isPrimary && next.length > 0) {
        next[0].isPrimary = true;
      }
      return next;
    });
  };

  const handleSetPrimary = (index: number) => {
    setMediaList((prev) =>
      prev.map((item, i) => ({
        ...item,
        isPrimary: i === index,
      }))
    );
  };

  const handleSavePhotoModal = (updated: { caption?: string; isPrimary?: boolean }) => {
    if (selectedPhotoIndex === null) return;
    setMediaList((prev) =>
      prev.map((item, i) => {
        if (i === selectedPhotoIndex) {
          return {
            ...item,
            caption: updated.caption,
            isPrimary: updated.isPrimary ?? item.isPrimary,
          };
        }
        if (updated.isPrimary) {
          return { ...item, isPrimary: false };
        }
        return item;
      })
    );
    toast.success('Photo details updated.');
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formErrors.clearErrors();
    const f = new FormData(e.currentTarget);

    void run(async () => {
      const name = String(f.get('name') ?? '').trim();
      const slug = String(f.get('slug') ?? '').trim();
      const timezone = String(f.get('timezone') ?? '').trim();
      const description = String(f.get('description') ?? '').trim() || undefined;

      const address = {
        line1: String(f.get('address.line1') ?? f.get('line1') ?? '').trim(),
        city: String(f.get('address.city') ?? f.get('city') ?? '').trim(),
        postalCode: String(f.get('address.postalCode') ?? f.get('postalCode') ?? '').trim(),
        countryCode: String(f.get('address.countryCode') ?? f.get('countryCode') ?? '').trim().toUpperCase(),
      };

      const contact = {
        email: String(f.get('contact.email') ?? f.get('email') ?? '').trim(),
        phone: f.get('contact.phone') ? String(f.get('contact.phone')).trim() : undefined,
      };

      try {
        if (isEditing && hotel) {
          const updated = await updateHotel(readId(hotel), {
            version: hotel.version,
            name,
            slug,
            timezone,
            description,
            address,
            contact,
          });

          // Save media gallery together with hotel
          let finalHotel = updated;
          try {
            finalHotel = await updateHotelMedia(readId(hotel), updated.version, mediaList);
          } catch (mediaErr) {
            console.warn('Media update failed, but hotel details were saved', mediaErr);
          }

          toast.success(`Property "${name}" updated successfully.`);
          onSuccess(finalHotel);
        } else {
          const created = await createHotel({
            name,
            slug,
            timezone,
            description,
            address,
            contact,
          });

          let finalHotel = created;
          if (mediaList.length > 0) {
            try {
              finalHotel = await updateHotelMedia(readId(created), created.version, mediaList);
            } catch {
              /* ignore */
            }
          }

          toast.success(`Property "${name}" created with ${mediaList.length} photo(s).`);
          onSuccess(finalHotel);
        }
      } catch (err) {
        handleFormError(err, formErrors, toast);
      }
    });
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
      <form onSubmit={submit} className="p-6 sm:p-8 space-y-8">
        {formErrors.formError && (
          <Alert tone="error">{formErrors.formError}</Alert>
        )}

        {/* Section 1: Property Identity */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Property Identity
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Property name" required hint="e.g. The Linden Grand Hotel" error={formErrors.getError('name')}>
              <Input
                name="name"
                required
                minLength={2}
                placeholder="The Linden Grand Hotel"
                defaultValue={hotel?.name ?? ''}
                isError={Boolean(formErrors.getError('name'))}
              />
            </Field>

            <Field label="Property URL slug" required hint="Unique URL slug (e.g. linden-grand)" error={formErrors.getError('slug')}>
              <Input
                name="slug"
                required
                placeholder="linden-grand"
                defaultValue={hotel?.slug ?? ''}
                className="font-mono lowercase"
                isError={Boolean(formErrors.getError('slug'))}
              />
            </Field>

            <Field label="Time zone" required hint="Used for check-in cutoffs and inventory calendar" error={formErrors.getError('timezone')}>
              <Input
                name="timezone"
                required
                defaultValue={hotel?.timezone ?? 'Asia/Kolkata'}
                className="font-mono"
                isError={Boolean(formErrors.getError('timezone'))}
              />
            </Field>

            <Field label="Contact email" required hint="Primary frontdesk or reservations email" error={formErrors.getError('contact.email')}>
              <Input
                name="contact.email"
                required
                type="email"
                placeholder="frontdesk@lindengrand.com"
                defaultValue={hotel?.contact?.email ?? ''}
                isError={Boolean(formErrors.getError('contact.email'))}
              />
            </Field>

            <Field label="Contact phone" hint="Frontdesk direct phone number" error={formErrors.getError('contact.phone')}>
              <Input
                name="contact.phone"
                type="tel"
                placeholder="+91 80 1234 5678"
                defaultValue={hotel?.contact?.phone ?? ''}
                isError={Boolean(formErrors.getError('contact.phone'))}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field
                label="Property description"
                hint="Describe the property's character, standout luxury amenities, and guest experience"
                error={formErrors.getError('description')}
              >
                <Textarea
                  name="description"
                  rows={3}
                  defaultValue={hotel?.description ?? ''}
                  placeholder="e.g. Nestled in the heart of the city, The Linden Grand offers world-class dining, heated indoor pools, and bespoke concierge services..."
                  isError={Boolean(formErrors.getError('description'))}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Section 2: Location & Address */}
        <div className="pt-6 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Physical Location
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="sm:col-span-3">
              <Field label="Street address" required error={formErrors.getError('address.line1')}>
                <Input
                  name="address.line1"
                  required
                  placeholder="18 Residency Road, Richmond Town"
                  defaultValue={hotel?.address?.line1 ?? ''}
                  isError={Boolean(formErrors.getError('address.line1'))}
                />
              </Field>
            </div>

            <Field label="City" required error={formErrors.getError('address.city')}>
              <Input
                name="address.city"
                required
                placeholder="Bengaluru"
                defaultValue={hotel?.address?.city ?? ''}
                isError={Boolean(formErrors.getError('address.city'))}
              />
            </Field>

            <Field label="Postal code" required error={formErrors.getError('address.postalCode')}>
              <Input
                name="address.postalCode"
                required
                placeholder="560025"
                defaultValue={hotel?.address?.postalCode ?? ''}
                isError={Boolean(formErrors.getError('address.postalCode'))}
              />
            </Field>

            <Field label="Country code" required hint="ISO 2-letter (e.g. IN, US, GB)" error={formErrors.getError('address.countryCode')}>
              <Input
                name="address.countryCode"
                required
                minLength={2}
                maxLength={2}
                defaultValue={hotel?.address?.countryCode ?? 'IN'}
                className="uppercase font-mono"
                isError={Boolean(formErrors.getError('address.countryCode'))}
              />
            </Field>
          </div>
        </div>

        {/* Section 3: Property Photos (Embedded in form with popup trigger and thumbnails below) */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Property Photos ({mediaList.length})
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload photos of exterior, lobby, and amenities. The star marks the primary hero cover photo.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Upload size={14} />}
              onClick={() => setIsPhotoPopupOpen(true)}
            >
              Upload / Add Photo
            </Button>
          </div>

          {/* Uploaded Photos Grid directly below the field */}
          {mediaList.length === 0 ? (
            <div
              onClick={() => setIsPhotoPopupOpen(true)}
              className="p-6 border-2 border-dashed border-slate-200 hover:border-emerald-600/70 rounded-2xl text-center text-xs text-slate-500 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-slate-500 flex items-center justify-center">
                <ImageIcon size={20} />
              </div>
              <div>
                <b className="font-semibold text-slate-700 block">No property photos uploaded yet</b>
                <span className="text-[11px] text-slate-400">
                  Click here or the button above to upload photo files or enter image URLs.
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
              {mediaList.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                    item.isPrimary
                      ? 'bg-emerald-50/40 border-emerald-600 ring-1 ring-emerald-600/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div
                    className="aspect-video w-full rounded-lg bg-slate-100 border border-slate-200/60 overflow-hidden relative group cursor-pointer"
                    onClick={() => setSelectedPhotoIndex(idx)}
                    title="Click to view photo and edit caption"
                  >
                    <img
                      src={item.url}
                      alt={item.caption || `Photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors" />
                    {item.isPrimary && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white flex items-center gap-1 shadow-xs">
                        <Star size={10} className="fill-white" /> Primary Cover
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => setSelectedPhotoIndex(idx)}
                      title="Click to edit caption in popup"
                    >
                      <p className="text-xs font-bold text-slate-800 truncate hover:text-emerald-700 transition-colors">
                        {item.caption || `Photo ${idx + 1}`}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                        {item.url}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!item.isPrimary && (
                        <button
                          type="button"
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Set as primary hero photo"
                          onClick={() => handleSetPrimary(idx)}
                        >
                          <Star size={15} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove photo"
                        onClick={() => setDeleteConfirmIndex(idx)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<Check size={16} />}
            isLoading={busy}
            loadingLabel={isEditing ? 'Saving changes…' : 'Creating property…'}
          >
            {isEditing ? 'Save property changes' : 'Create draft property'}
          </Button>
        </div>
      </form>

      {/* Upload Photo Modal */}
      <PhotoUploadPopup
        isOpen={isPhotoPopupOpen}
        onClose={() => setIsPhotoPopupOpen(false)}
        onAddPhoto={handleAddPhoto}
      />

      {/* Edit Photo Details Modal */}
      <PhotoEditModal
        isOpen={selectedPhotoIndex !== null}
        onClose={() => setSelectedPhotoIndex(null)}
        photo={selectedPhotoIndex !== null ? mediaList[selectedPhotoIndex] : null}
        onSave={handleSavePhotoModal}
        onDelete={() => {
          if (selectedPhotoIndex !== null) {
            handleRemovePhoto(selectedPhotoIndex);
            setSelectedPhotoIndex(null);
          }
        }}
      />

      {/* Delete Photo Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteConfirmIndex !== null}
        onClose={() => setDeleteConfirmIndex(null)}
        onConfirm={() => {
          if (deleteConfirmIndex !== null) {
            handleRemovePhoto(deleteConfirmIndex);
            setDeleteConfirmIndex(null);
            toast.success('Photo removed from property');
          }
        }}
        title="Remove Photo"
        message="Are you sure you want to remove this photo from the property? Remember to save property changes to persist."
        confirmLabel="Remove Photo"
        cancelLabel="Keep Photo"
        variant="danger"
        icon="trash"
      />
    </div>
  );
}
