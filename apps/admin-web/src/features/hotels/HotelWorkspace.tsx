import { useState, useEffect, useCallback, type FormEvent, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Check,
  Archive,
  Plus,
  PauseCircle,
  Image as ImageIcon,
  Lock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Hotel, RoomType, PublishProblem, StaffMe, HotelMediaItem, updateHotelMedia } from '../../api';
import { useBusyGuard, useToast } from '../../ui-feedback';
import { Alert, Button, Modal, Status } from '../../components/ui';
import { readId } from '../../utils/helpers';
import { RoomCreateModal } from '../rooms/RoomCreateModal';
import { RoomMediaModal } from '../rooms/RoomMediaModal';
import { useServerErrors } from '../../hooks/useServerErrors';
import { handleFormError } from '../../hooks/handleFormError';
import { Can } from '../auth/Can';
import { publishHotel, suspendHotel, archiveHotel, updateHotel } from './hotels.api';
import { listRoomTypes } from '../rooms/rooms.api';
import { BulkStatusConfirmModal } from '../../pages/hotels/components/BulkStatusConfirmModal';
import { HotelMediaGalleryManager } from './HotelMediaGalleryManager';
import { HotelDetailsFields, readHotelDetails } from './HotelDetailsFields';
import { CancellationPolicyFields, readCancellationPolicy } from './CancellationPolicyFields';
import { HotelRoomsList } from './HotelRoomsList';
import { HotelRatesTab } from '../rates/HotelRatesTab';

export type WorkspaceTab = 'hotel' | 'rooms' | 'rates' | 'cancellation';

function normalizeTab(raw: string | null): WorkspaceTab {
  if (!raw) return 'hotel';
  if (raw === 'general' || raw === 'photos' || raw === 'hotel') return 'hotel';
  if (raw === 'rooms') return 'rooms';
  if (raw === 'rates') return 'rates';
  if (raw === 'policy' || raw === 'cancellation') return 'cancellation';
  return 'hotel';
}

interface HotelWorkspaceProps {
  hotel: Hotel;
  onClose: () => void;
  onSaved: (hotel: Hotel) => void;
  staff?: StaffMe;
  variant?: 'modal' | 'inline';
}

/** Hotels saved before the gallery existed only have primaryImage / images. */
function initialMedia(hotel: Hotel): HotelMediaItem[] {
  if (hotel.media && hotel.media.length > 0) return hotel.media;
  const primary = hotel.primaryImage || hotel.heroImage;
  const legacy: HotelMediaItem[] = primary ? [{ url: primary, isPrimary: true, caption: 'Primary Hero' }] : [];
  (hotel.images ?? []).forEach((img) => {
    if (img !== primary) legacy.push({ url: img, isPrimary: false });
  });
  return legacy;
}

export function HotelWorkspace({ hotel: initialHotel, onClose, onSaved, staff, variant = 'inline' }: HotelWorkspaceProps) {
  const { busy, run } = useBusyGuard();
  const toast = useToast();
  const formErrors = useServerErrors();

  const [hotel, setHotel] = useState(initialHotel);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [mediaList, setMediaList] = useState<HotelMediaItem[]>(() => initialMedia(initialHotel));
  const [savingMedia, setSavingMedia] = useState(false);
  const [showRoom, setShowRoom] = useState(false);
  const [roomForMedia, setRoomForMedia] = useState<RoomType | null>(null);
  const [statusModal, setStatusModal] = useState<'SUSPENDED' | 'ARCHIVED' | null>(null);
  const [publishProblems, setPublishProblems] = useState<PublishProblem[]>([]);
  const readOnly = hotel.status === 'ARCHIVED';

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = normalizeTab(searchParams.get('tab'));
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(requestedTab);

  const switchTab = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === 'hotel') next.delete('tab');
        else next.set('tab', tab);
        return next;
      },
      { replace: true }
    );
  };

  useEffect(() => {
    if (hotel.media && hotel.media.length > 0) setMediaList(hotel.media);
  }, [hotel.media]);

  const loadRooms = useCallback(async () => {
    try {
      setRooms(await listRoomTypes(readId(hotel)));
    } catch {
      /* Handled silently */
    }
  }, [hotel]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  const applySaved = (h: Hotel, message: string) => {
    setHotel(h);
    onSaved(h);
    toast.success(message);
  };

  const onConflict = () => toast.error('This hotel was changed in another session. Reload the page to get the latest version.');

  const saveMedia = async () => {
    setSavingMedia(true);
    try {
      applySaved(await updateHotelMedia(readId(hotel), hotel.version, mediaList), 'Hotel photos saved.');
    } catch (err) {
      handleFormError(err, formErrors, toast, { onConflict });
    } finally {
      setSavingMedia(false);
    }
  };

  const publish = () =>
    run(async () => {
      setPublishProblems([]);
      try {
        const h = await publishHotel(readId(hotel), hotel.version);
        applySaved(h, hotel.status === 'SUSPENDED' ? 'Hotel reactivated and visible to guests.' : 'Hotel published and visible to guests.');
      } catch (e) {
        handleFormError(e, formErrors, toast, {
          onNotReady: (problems) => {
            setPublishProblems(problems);
            toast.error('Not ready to publish yet. See missing items below.');
          },
          onConflict,
        });
      }
    });

  const suspend = (reason: string) =>
    run(async () => {
      try {
        applySaved(await suspendHotel(readId(hotel), hotel.version, reason), 'Hotel suspended. Guests can no longer book it.');
      } catch (err) {
        handleFormError(err, formErrors, toast, { onConflict });
      }
    });

  const doArchive = (reason: string) =>
    run(async () => {
      try {
        applySaved(await archiveHotel(readId(hotel), hotel.version, reason), 'Hotel archived.');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not archive the hotel');
      }
    });

  const saveWith = (buildPayload: (f: FormData) => object, message: string) => (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formErrors.clearErrors();
    const payload = buildPayload(new FormData(e.currentTarget));
    void run(async () => {
      try {
        applySaved(await updateHotel(readId(hotel), { version: hotel.version, ...payload }), message);
      } catch (err) {
        handleFormError(err, formErrors, toast, { onConflict });
      }
    });
  };

  const saveDetails = saveWith(readHotelDetails, 'Hotel details saved.');
  const savePolicy = saveWith((f) => ({ cancellationPolicy: readCancellationPolicy(f) }), 'Cancellation policy saved.');

  // Readiness calculations for the 4 tabs
  const isHotelReady = Boolean(hotel.name && hotel.address?.line1 && hotel.address?.city && hotel.timezone && hotel.contact?.email && mediaList.length > 0);
  const isRoomsReady = rooms.length > 0;
  const isPolicyReady = Boolean(hotel.cancellationPolicy?.effectiveFrom && hotel.cancellationPolicy?.afterCutoff);

  const canEditRates = !staff || staff.permissions.includes('rates.edit');

  const body = (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Status status={hotel.status} variant="pill" />
          <span className="text-xs font-mono text-slate-400">/{hotel.slug}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!readOnly && (
            <Can permission="hotels.archive">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Archive size={14} />}
                onClick={() => setStatusModal('ARCHIVED')}
                disabled={busy}
                className="text-rose-600 hover:bg-rose-50"
              >
                Archive
              </Button>
            </Can>
          )}
          {hotel.status === 'PUBLISHED' && (
            <Can permission="hotels.edit">
              <Button variant="secondary" size="sm" leftIcon={<PauseCircle size={14} />} isLoading={busy} onClick={() => setStatusModal('SUSPENDED')}>
                Suspend
              </Button>
            </Can>
          )}
          {(hotel.status === 'DRAFT' || hotel.status === 'SUSPENDED') && (
            <Can permission="hotels.publish">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Check size={15} />}
                isLoading={busy}
                loadingLabel={hotel.status === 'DRAFT' ? 'Publishing…' : 'Reactivating…'}
                onClick={publish}
              >
                {hotel.status === 'DRAFT' ? 'Publish Hotel' : 'Reactivate Hotel'}
              </Button>
            </Can>
          )}
        </div>
      </div>

      {/* Publishing Checklist Tab Navigation (Single Header Switcher) */}
      <nav
        aria-label="Hotel configuration checklist tabs"
        className="p-2 sm:p-2.5 bg-slate-50/90 border border-slate-200/90 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-2xs"
      >
        <div className="flex items-center gap-2 px-1 sm:pl-2">
          <span className="w-6 h-6 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
            <Sparkles size={13} />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Publishing Checklist:</span>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-1.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => switchTab('hotel')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'hotel'
                ? 'bg-white text-emerald-950 shadow-xs border border-slate-200/90 ring-2 ring-emerald-600/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            {isHotelReady ? (
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            )}
            <span className="truncate">1. Hotel & Photos</span>
            {mediaList.length > 0 && (
              <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-md font-semibold hidden xs:inline">
                {mediaList.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => switchTab('rooms')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'rooms'
                ? 'bg-white text-emerald-950 shadow-xs border border-slate-200/90 ring-2 ring-emerald-600/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            {isRoomsReady ? (
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            )}
            <span className="truncate">2. Room Types</span>
            {rooms.length > 0 && (
              <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-md font-semibold hidden xs:inline">
                {rooms.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => switchTab('rates')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'rates'
                ? 'bg-white text-emerald-950 shadow-xs border border-slate-200/90 ring-2 ring-emerald-600/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            {rooms.length > 0 ? (
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
            )}
            <span className="truncate">3. Rates</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('cancellation')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'cancellation'
                ? 'bg-white text-emerald-950 shadow-xs border border-slate-200/90 ring-2 ring-emerald-600/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            {isPolicyReady ? (
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            )}
            <span className="truncate">4. Cancellation</span>
          </button>
        </div>
      </nav>

      {readOnly && (
        <Alert tone="warning" icon={<Lock size={16} />}>
          This hotel is archived and read-only. Its details, photos, room types, rates, and policies can no longer be changed.
        </Alert>
      )}

      {publishProblems.length > 0 && (
        <Alert tone="error">
          <b className="block mb-1">Before you can publish ({publishProblems.length} to fix):</b>
          <ul className="list-disc pl-5 space-y-1">
            {publishProblems.map((prob, i) => (
              <li key={i}>{prob.message}</li>
            ))}
          </ul>
        </Alert>
      )}

      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {/* Tab 1: Hotel (Basics + Overall Hotel Media) */}
        {activeTab === 'hotel' && (
          <div className="space-y-10">
            {/* Basics & Address Form */}
            <form onSubmit={saveDetails}>
              <fieldset disabled={readOnly} className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Property Details & Contact</h3>
                    <p className="text-xs text-slate-500">Core identity, physical address, and contact coordinates.</p>
                  </div>
                </div>

                <HotelDetailsFields hotel={hotel} formErrors={formErrors} key={hotel.version} />
                <SaveBar readOnly={readOnly} busy={busy} label="Save hotel details" />
              </fieldset>
            </form>

            {/* Hotel Media & Gallery */}
            <div className="pt-6 border-t border-slate-200/80 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ImageIcon size={16} className="text-slate-600" />
                    <span>Property Photos & Gallery</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upload exterior, lobby, and amenity photos. Designate one as the primary hero image.
                  </p>
                </div>
                {!readOnly && (
                  <Can permission="hotels.edit">
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={savingMedia}
                      loadingLabel="Saving photos…"
                      onClick={saveMedia}
                      leftIcon={<Check size={14} />}
                    >
                      Save photos
                    </Button>
                  </Can>
                )}
              </div>

              <HotelMediaGalleryManager media={mediaList} onChange={setMediaList} disabled={savingMedia || readOnly} />
            </div>
          </div>
        )}

        {/* Tab 2: Room Types (Specs + Room Photos) */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Room Categories</h3>
                <p className="text-xs text-slate-500">Configure bookable room types and attach photos for each room.</p>
              </div>
              {!readOnly && (
                <Can permission="room_types.create">
                  <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowRoom(true)}>
                    Add room type
                  </Button>
                </Can>
              )}
            </div>

            <HotelRoomsList
              rooms={rooms}
              onManagePhotos={(room) => setRoomForMedia(room)}
              readOnly={readOnly}
            />
          </div>
        )}

        {/* Tab 3: Rates (Room Pricing) */}
        {activeTab === 'rates' && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Room Pricing (Base Rates)</h3>
              <p className="text-xs text-slate-500">
                Set nightly base prices in minor currency units for each room type under this property.
              </p>
            </div>

            <HotelRatesTab
              hotel={hotel}
              rooms={rooms}
              canEditRates={canEditRates}
              readOnly={readOnly}
              onRatesUpdated={loadRooms}
            />
          </div>
        )}

        {/* Tab 4: Cancellation Policy */}
        {activeTab === 'cancellation' && (
          <form onSubmit={savePolicy}>
            <fieldset disabled={readOnly} className="space-y-6">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Cancellation & Refund Terms</h3>
                <p className="text-xs text-slate-500">
                  Cut-off windows, late cancellation penalty charges, and no-show fee rules.
                </p>
              </div>

              <CancellationPolicyFields hotel={hotel} formErrors={formErrors} key={hotel.version} />
              <SaveBar readOnly={readOnly} busy={busy} label="Save cancellation policy" />
            </fieldset>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <>
      {variant === 'inline' ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs p-4 sm:p-6 md:p-8">{body}</div>
      ) : (
        <Modal title={hotel.name} subtitle={`${hotel.address?.city} · ${hotel.timezone}`} onClose={onClose} wide>
          {body}
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

      {roomForMedia && (
        <RoomMediaModal
          room={roomForMedia}
          onClose={() => setRoomForMedia(null)}
          onSaved={() => {
            setRoomForMedia(null);
            void loadRooms();
          }}
          readOnly={readOnly}
        />
      )}

      {statusModal && (
        <BulkStatusConfirmModal
          isOpen
          onClose={() => setStatusModal(null)}
          status={statusModal}
          count={1}
          loading={busy}
          onConfirm={async (reason) => {
            await (statusModal === 'ARCHIVED' ? doArchive(reason) : suspend(reason));
            setStatusModal(null);
          }}
        />
      )}
    </>
  );
}

function SaveBar({ readOnly, busy, label }: { readOnly: boolean; busy: boolean; label: ReactNode }) {
  if (readOnly) return null;
  return (
    <Can permission="hotels.edit">
      <div className="pt-6 border-t border-slate-100 flex justify-end">
        <Button type="submit" variant="primary" size="md" leftIcon={<Check size={14} />} isLoading={busy} loadingLabel="Saving…">
          {label}
        </Button>
      </div>
    </Can>
  );
}
