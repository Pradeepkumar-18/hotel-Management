import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  BedDouble,
  Check,
  Archive,
  Plus,
  PauseCircle,
  Building2,
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react';
import { Hotel, RoomType, PublishProblem, StaffMe, HotelMediaItem, updateHotelMedia } from '../../api';
import { useBusyGuard, useToast } from '../../ui-feedback';
import { Button, Field, Input, Modal, Select, Status, Alert, Textarea } from '../../components/ui';
import { readId, isoToday } from '../../utils/helpers';
import { RoomCreateModal } from '../rooms/RoomCreateModal';
import { useServerErrors } from '../../hooks/useServerErrors';
import { handleFormError } from '../../hooks/handleFormError';
import { Can } from '../auth/Can';
import { publishHotel, suspendHotel, archiveHotel, updateHotel } from './hotels.api';
import { listRoomTypes } from '../rooms/rooms.api';
import { BulkStatusConfirmModal } from '../../pages/hotels/components/BulkStatusConfirmModal';
import { HotelMediaGalleryManager } from './HotelMediaGalleryManager';

export type WorkspaceTab = 'general' | 'photos' | 'rooms' | 'policy';

interface HotelWorkspaceProps {
  hotel: Hotel;
  onClose: () => void;
  onSaved: (hotel: Hotel) => void;
  staff?: StaffMe;
  variant?: 'modal' | 'inline';
}

export function HotelWorkspace({
  hotel: initialHotel,
  onClose,
  onSaved,
  variant = 'inline',
}: HotelWorkspaceProps) {
  const [hotel, setHotel] = useState(initialHotel);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [showRoom, setShowRoom] = useState(false);
  const [publishProblems, setPublishProblems] = useState<PublishProblem[]>([]);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as WorkspaceTab) || 'general';
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(
    ['general', 'photos', 'rooms', 'policy'].includes(initialTab) ? initialTab : 'general'
  );

  const switchTab = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === 'general') {
          next.delete('tab');
        } else {
          next.set('tab', tab);
        }
        return next;
      },
      { replace: true }
    );
  };

  // Photo Gallery State
  const [mediaList, setMediaList] = useState<HotelMediaItem[]>(() => {
    if (initialHotel.media && initialHotel.media.length > 0) {
      return initialHotel.media;
    }
    const legacy: HotelMediaItem[] = [];
    if (initialHotel.primaryImage || initialHotel.heroImage) {
      legacy.push({
        url: (initialHotel.primaryImage || initialHotel.heroImage)!,
        isPrimary: true,
        caption: 'Primary Hero',
      });
    }
    if (initialHotel.images) {
      initialHotel.images.forEach((img) => {
        if (img !== initialHotel.primaryImage && img !== initialHotel.heroImage) {
          legacy.push({ url: img, isPrimary: false });
        }
      });
    }
    return legacy;
  });

  const [mediaError, setMediaError] = useState('');
  const [savingMedia, setSavingMedia] = useState(false);

  useEffect(() => {
    if (hotel.media && hotel.media.length > 0) {
      setMediaList(hotel.media);
    }
  }, [hotel.media]);

  const saveMedia = async () => {
    setMediaError('');
    setSavingMedia(true);
    try {
      const updated = await updateHotelMedia(readId(hotel), hotel.version, mediaList);
      setHotel(updated);
      onSaved(updated);
      toast.success('Hotel photo gallery saved successfully.');
    } catch (err) {
      handleFormError(err, formErrors, toast, {
        onConflict: () => {
          toast.error('Hotel media was updated in another session. Please reload.');
        },
      });
    } finally {
      setSavingMedia(false);
    }
  };

  const { busy, run } = useBusyGuard();
  const toast = useToast();
  const formErrors = useServerErrors();

  const loadRooms = useCallback(async () => {
    try {
      const data = await listRoomTypes(readId(hotel));
      setRooms(data);
    } catch {
      /* Handled silently */
    }
  }, [hotel]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  const publish = () =>
    run(async () => {
      setPublishProblems([]);
      try {
        const h = await publishHotel(readId(hotel), hotel.version);
        setHotel(h);
        onSaved(h);
        toast.success(hotel.status === 'SUSPENDED' ? 'Property reactivated and visible in catalog.' : 'Property published and visible in the catalog.');
      } catch (e) {
        handleFormError(e, formErrors, toast, {
          onNotReady: (problems) => {
            setPublishProblems(problems);
            toast.error('Property is not ready to publish. Review the checklist below.');
          },
          onConflict: () => {
            toast.error('Property was updated by another session. Please close and reopen.');
          },
        });
      }
    });

  const suspend = () =>
    run(async () => {
      try {
        const h = await suspendHotel(readId(hotel), hotel.version, 'Suspended via workspace');
        setHotel(h);
        onSaved(h);
        toast.success('Property has been suspended from the catalog.');
      } catch (err) {
        handleFormError(err, formErrors, toast, {
          onConflict: () => {
            toast.error('Property was updated by another session. Please close and reopen.');
          },
        });
      }
    });

  const doArchive = async (reason: string) => {
    await run(async () => {
      try {
        const h = await archiveHotel(readId(hotel), hotel.version, reason);
        setHotel(h);
        onSaved(h);
        toast.success('Property has been permanently archived.');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not archive property');
      }
    });
  };

  const saveGeneral = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formErrors.clearErrors();
    const f = new FormData(e.currentTarget);
    void run(async () => {
      try {
        const h = await updateHotel(readId(hotel), {
          version: hotel.version,
          name: String(f.get('name') || '').trim(),
          slug: String(f.get('slug') || '').trim(),
          description: String(f.get('description') || '').trim() || undefined,
          timezone: String(f.get('timezone') || '').trim(),
          address: {
            line1: String(f.get('address.line1') || '').trim(),
            city: String(f.get('address.city') || '').trim(),
            postalCode: String(f.get('address.postalCode') || '').trim(),
            countryCode: String(f.get('address.countryCode') || '').trim().toUpperCase(),
          },
          contact: {
            email: String(f.get('contact.email') || '').trim(),
            phone: f.get('contact.phone') ? String(f.get('contact.phone')).trim() : undefined,
          },
        });
        setHotel(h);
        onSaved(h);
        toast.success('Property details updated successfully.');
      } catch (err) {
        handleFormError(err, formErrors, toast);
      }
    });
  };

  const savePolicy = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formErrors.clearErrors();
    const f = new FormData(e.currentTarget);
    const fee = (prefix: string) => {
      const basis = String(
        f.get(`cancellationPolicy.${prefix}.basis`) ?? f.get(`${prefix}Basis`) ?? 'NO_FEE'
      );
      return basis === 'FIXED_MINOR_UNITS'
        ? {
            basis,
            amountMinorUnits: Number(
              f.get(`cancellationPolicy.${prefix}.amountMinorUnits`) ?? f.get(`${prefix}Amount`) ?? 0
            ),
            currency: String(
              f.get(`cancellationPolicy.${prefix}.currency`) ?? f.get(`${prefix}Currency`) ?? ''
            ).toUpperCase(),
          }
        : basis === 'PERCENTAGE_BPS'
        ? {
            basis,
            percentageBps: Math.round(
              Number(
                f.get(`cancellationPolicy.${prefix}.percentageBps`) ?? f.get(`${prefix}Percent`) ?? 0
              ) * 100
            ),
          }
        : { basis };
    };

    void run(async () => {
      try {
        const h = await updateHotel(readId(hotel), {
          version: hotel.version,
          cancellationPolicy: {
            effectiveFrom: String(
              f.get('cancellationPolicy.effectiveFrom') ?? f.get('effectiveFrom') ?? ''
            ),
            freeCancellationHoursBeforeCheckIn: Number(
              f.get('cancellationPolicy.freeCancellationHoursBeforeCheckIn') ?? f.get('cutoff') ?? 24
            ),
            afterCutoff: fee('afterCutoff'),
            noShow: fee('noShow'),
          },
        });
        setHotel(h);
        onSaved(h);
        toast.success('Cancellation and no-show terms saved.');
      } catch (err) {
        handleFormError(err, formErrors, toast);
      }
    });
  };

  const workspaceBody = (
    <div className="space-y-6">
      <div className="workspace-top flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2">
          <Status status={hotel.status} variant="pill" />
          <span className="workspace-slug text-xs font-mono text-slate-400">/{hotel.slug}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {hotel.status !== 'ARCHIVED' && (
            <Can permission="hotels.archive">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Archive size={14} className="text-rose-600" />}
                onClick={() => setShowArchiveModal(true)}
                disabled={busy}
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                Archive
              </Button>
            </Can>
          )}

          {hotel.status === 'PUBLISHED' && (
            <Can permission="hotels.edit">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<PauseCircle size={14} className="text-amber-600" />}
                isLoading={busy}
                loadingLabel="Suspending property…"
                onClick={suspend}
                className="text-amber-700 hover:bg-amber-50"
              >
                Suspend
              </Button>
            </Can>
          )}

          {hotel.status === 'SUSPENDED' && (
            <Can permission="hotels.publish">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Check size={15} />}
                isLoading={busy}
                loadingLabel="Reactivating property…"
                onClick={publish}
              >
                Reactivate
              </Button>
            </Can>
          )}

          {hotel.status === 'DRAFT' && (
            <Can permission="hotels.publish">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Check size={15} />}
                isLoading={busy}
                loadingLabel="Publishing property…"
                onClick={publish}
              >
                Publish property
              </Button>
            </Can>
          )}
        </div>
      </div>

      {publishProblems.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-rose-800">
            <AlertCircle size={16} />
            <span>Pre-publish requirements missing ({publishProblems.length})</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-rose-700">
            {publishProblems.map((prob, i) => (
              <li key={i}>{prob.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Workspace Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/90 pb-px overflow-x-auto">
        <button
          type="button"
          onClick={() => switchTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'general'
              ? 'border-[#164e3f] text-[#164e3f] bg-emerald-50/50 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Building2 size={16} />
          <span>Property Details</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab('photos')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'photos'
              ? 'border-[#164e3f] text-[#164e3f] bg-emerald-50/50 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <ImageIcon size={16} />
          <span>Photo Gallery</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'photos' ? 'bg-[#164e3f] text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {mediaList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => switchTab('rooms')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'rooms'
              ? 'border-[#164e3f] text-[#164e3f] bg-emerald-50/50 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <BedDouble size={16} />
          <span>Room Categories</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'rooms' ? 'bg-[#164e3f] text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {rooms.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => switchTab('policy')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'policy'
              ? 'border-[#164e3f] text-[#164e3f] bg-emerald-50/50 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck size={16} />
          <span>Cancellation Policy</span>
        </button>
      </div>

      {/* Tab 1: General Property Details */}
      {activeTab === 'general' && (
        <div className="workspace-section space-y-4 pt-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Property Details</h3>
            <p className="text-xs text-slate-500">Update general identity, location, and contact information.</p>
          </div>

          <form onSubmit={saveGeneral} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Property name" required error={formErrors.getError('name')}>
              <Input
                name="name"
                required
                minLength={2}
                defaultValue={hotel.name}
                isError={Boolean(formErrors.getError('name'))}
              />
            </Field>

            <Field label="Property slug" required error={formErrors.getError('slug')}>
              <Input
                name="slug"
                required
                defaultValue={hotel.slug}
                className="font-mono lowercase"
                isError={Boolean(formErrors.getError('slug'))}
              />
            </Field>

            <Field
              label="Property description"
              fullWidth
              hint="Provide an overview of the property, highlights, and amenities for guests."
              error={formErrors.getError('description')}
            >
              <Textarea
                name="description"
                rows={4}
                defaultValue={hotel.description || ''}
                placeholder="e.g. Luxury heritage resort located along the serene coast with private beach access..."
                isError={Boolean(formErrors.getError('description'))}
              />
            </Field>

            <Field label="Street address" fullWidth required error={formErrors.getError('address.line1')}>
              <Input
                name="address.line1"
                required
                defaultValue={hotel.address?.line1 || ''}
                isError={Boolean(formErrors.getError('address.line1'))}
              />
            </Field>

            <Field label="City" required error={formErrors.getError('address.city')}>
              <Input
                name="address.city"
                required
                defaultValue={hotel.address?.city || ''}
                isError={Boolean(formErrors.getError('address.city'))}
              />
            </Field>

            <Field label="Postal code" required error={formErrors.getError('address.postalCode')}>
              <Input
                name="address.postalCode"
                required
                defaultValue={hotel.address?.postalCode || ''}
                isError={Boolean(formErrors.getError('address.postalCode'))}
              />
            </Field>

            <Field label="Country code" required error={formErrors.getError('address.countryCode')}>
              <Input
                name="address.countryCode"
                required
                minLength={2}
                maxLength={2}
                defaultValue={hotel.address?.countryCode || 'IN'}
                className="uppercase font-mono"
                isError={Boolean(formErrors.getError('address.countryCode'))}
              />
            </Field>

            <Field label="Time zone" required error={formErrors.getError('timezone')}>
              <Input
                name="timezone"
                required
                defaultValue={hotel.timezone || 'Asia/Kolkata'}
                className="font-mono"
                isError={Boolean(formErrors.getError('timezone'))}
              />
            </Field>

            <Field label="Contact email" required error={formErrors.getError('contact.email')}>
              <Input
                name="contact.email"
                required
                type="email"
                defaultValue={hotel.contact?.email || ''}
                isError={Boolean(formErrors.getError('contact.email'))}
              />
            </Field>

            <Field label="Contact phone" error={formErrors.getError('contact.phone')}>
              <Input
                name="contact.phone"
                defaultValue={hotel.contact?.phone || ''}
                isError={Boolean(formErrors.getError('contact.phone'))}
              />
            </Field>

            <div className="col-span-full pt-1">
              <Can permission="hotels.edit">
                <Button type="submit" variant="secondary" size="sm" isLoading={busy} loadingLabel="Saving details…">
                  Save property details
                </Button>
              </Can>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Photo Gallery */}
      {activeTab === 'photos' && (
        <div className="space-y-6 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Property Photo Gallery</h3>
              <p className="text-xs text-slate-500">
                Manage property imagery, photo captions, and designate the primary cover thumbnail.
              </p>
            </div>
            <Can permission="hotels.edit">
              <Button
                variant="primary"
                size="sm"
                isLoading={savingMedia}
                loadingLabel="Saving gallery…"
                onClick={saveMedia}
                leftIcon={<Check size={14} />}
              >
                Save Photo Gallery ({mediaList.length})
              </Button>
            </Can>
          </div>

          {mediaError && <Alert tone="error">{mediaError}</Alert>}

          <HotelMediaGalleryManager
            media={mediaList}
            onChange={setMediaList}
            disabled={savingMedia}
          />
        </div>
      )}

      {/* Tab 3: Room Categories */}
      {activeTab === 'rooms' && (
        <div className="workspace-section space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Room categories</h3>
              <p className="text-xs text-slate-500">Physical and bookable room inventory layouts.</p>
            </div>
            <Can permission="room_types.create">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => setShowRoom(true)}
              >
                Add room type
              </Button>
            </Can>
          </div>

          {rooms.length === 0 ? (
            <div className="p-4 border border-dashed border-slate-200 rounded-lg text-xs text-slate-500 text-center">
              No rooms yet. Add at least one room category to configure inventory and pricing.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rooms.map((room) => (
                <div key={readId(room)} className="p-3 border border-slate-200 rounded-lg bg-white flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <BedDouble size={14} />
                    </span>
                    <div>
                      <b className="font-semibold text-slate-800 block">{room.name}</b>
                      <span className="text-[11px] text-slate-400 font-mono">{room.code} · {room.totalRooms} rooms</span>
                    </div>
                  </div>
                  <Status status={room.status} variant="dot" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Cancellation Terms Section */}
      {activeTab === 'policy' && (
        <div className="workspace-section space-y-3 pt-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cancellation & check-in policy</h3>
            <p className="text-xs text-slate-500">Explicit guest terms stored with every booking snapshot.</p>
          </div>

          <form onSubmit={savePolicy} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Effective date" required error={formErrors.getError('cancellationPolicy.effectiveFrom')}>
              <Input
                type="date"
                name="cancellationPolicy.effectiveFrom"
                required
                defaultValue={hotel.cancellationPolicy?.effectiveFrom || isoToday(hotel.timezone)}
                isError={Boolean(formErrors.getError('cancellationPolicy.effectiveFrom'))}
              />
            </Field>

            <Field label="Free cancellation cutoff" required error={formErrors.getError('cancellationPolicy.freeCancellationHoursBeforeCheckIn')}>
              <Input
                type="number"
                name="cancellationPolicy.freeCancellationHoursBeforeCheckIn"
                required
                min="0"
                max="8760"
                defaultValue={hotel.cancellationPolicy?.freeCancellationHoursBeforeCheckIn ?? 24}
                rightIcon={<span className="text-[11px] font-medium text-slate-500">hours before check-in</span>}
                isError={Boolean(formErrors.getError('cancellationPolicy.freeCancellationHoursBeforeCheckIn'))}
              />
            </Field>

            <FeeField label="After cutoff" prefix="afterCutoff" initial={hotel.cancellationPolicy?.afterCutoff} />
            <FeeField label="No-show" prefix="noShow" initial={hotel.cancellationPolicy?.noShow} />

            <div className="col-span-full space-y-2 pt-2">
              <small className="text-[11px] text-slate-400 block">Any fixed fee must use the same currency as the property's room rates.</small>
              <Can permission="hotels.edit">
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  isLoading={busy}
                  loadingLabel="Saving terms…"
                >
                  Save cancellation terms
                </Button>
              </Can>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  return (
    <>
      {variant === 'inline' ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100/70 text-brand-primary flex items-center justify-center shrink-0">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">{hotel.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {hotel.address?.city} · {hotel.timezone} · Property workspace
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>

          <div className="p-6 sm:p-8">
            {workspaceBody}
          </div>
        </div>
      ) : (
        <Modal title={hotel.name} subtitle={`${hotel.address?.city} · ${hotel.timezone} · Property workspace`} onClose={onClose} wide>
          {workspaceBody}
        </Modal>
      )}

      {showRoom && (
        <RoomCreateModal
          hotelId={String(readId(hotel))}
          onClose={() => setShowRoom(false)}
          onCreated={() => {
            setShowRoom(false);
            void loadRooms();
          }}
        />
      )}

      {showArchiveModal && (
        <BulkStatusConfirmModal
          isOpen={showArchiveModal}
          onClose={() => setShowArchiveModal(false)}
          status="ARCHIVED"
          count={1}
          loading={busy}
          onConfirm={async (reason) => {
            await doArchive(reason);
            setShowArchiveModal(false);
          }}
        />
      )}
    </>
  );
}

function FeeField({ label, prefix, initial }: { label: string; prefix: string; initial?: any }) {
  const [basis, setBasis] = useState(initial?.basis || 'NO_FEE');

  return (
    <div className="field flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <Select
        name={`cancellationPolicy.${prefix}.basis`}
        value={basis}
        onChange={(e) => setBasis(e.target.value)}
      >
        <option value="NO_FEE">No fee</option>
        <option value="FULL_STAY">Full stay amount</option>
        <option value="FIXED_MINOR_UNITS">Fixed amount</option>
        <option value="PERCENTAGE_BPS">Percentage</option>
      </Select>

      {basis === 'FIXED_MINOR_UNITS' && (
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Input
            aria-label={`${label} amount in minor units`}
            type="number"
            min="0"
            step="1"
            name={`cancellationPolicy.${prefix}.amountMinorUnits`}
            required
            defaultValue={initial?.amountMinorUnits}
            placeholder="Amount (minor units)"
          />
          <Input
            aria-label={`${label} currency code`}
            name={`cancellationPolicy.${prefix}.currency`}
            required
            minLength={3}
            maxLength={3}
            defaultValue={initial?.currency}
            placeholder="ISO currency"
            className="uppercase font-mono"
          />
        </div>
      )}

      {basis === 'PERCENTAGE_BPS' && (
        <div className="mt-1">
          <Input
            type="number"
            min="0"
            max="100"
            step="0.01"
            name={`cancellationPolicy.${prefix}.percentageBps`}
            required
            defaultValue={initial?.percentageBps !== undefined ? initial.percentageBps / 100 : ''}
            rightIcon={<span className="text-[11px] font-medium text-slate-500">% of stay</span>}
          />
        </div>
      )}
    </div>
  );
}
