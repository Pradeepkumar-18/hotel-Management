import { useState, useEffect, useCallback, type FormEvent, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Archive, Plus, PauseCircle, Image as ImageIcon, Lock } from 'lucide-react';
import { Hotel, RoomType, StaffMe, HotelMediaItem, updateHotelMedia } from '../../api';
import { useBusyGuard, useToast } from '../../ui-feedback';
import { Alert, Button, ConfirmDialog, Modal, Status } from '../../components/ui';
import { readId } from '../../utils/helpers';
import { RoomCreateModal } from '../rooms/RoomCreateModal';
import { RoomMediaModal } from '../rooms/RoomMediaModal';
import { useServerErrors } from '../../hooks/useServerErrors';
import { handleFormError } from '../../hooks/handleFormError';
import { Can } from '../auth/Can';
import { publishHotel, suspendHotel, archiveHotel, updateHotel, getHotelReadiness, HotelReadiness } from './hotels.api';
import { listRoomTypes } from '../rooms/rooms.api';
import { BulkStatusConfirmModal } from '../../pages/hotels/components/BulkStatusConfirmModal';
import { HotelMediaGalleryManager } from './HotelMediaGalleryManager';
import { HotelDetailsFields, readHotelDetails } from './HotelDetailsFields';
import { CancellationPolicyFields, readCancellationPolicy } from './CancellationPolicyFields';
import { HotelRoomsList } from './HotelRoomsList';
import { HotelRatesTab } from '../rates/HotelRatesTab';
import { HotelAvailabilityTab } from '../inventory/HotelAvailabilityTab';
import { HotelSetupChecklist, type WorkspaceTab } from './HotelSetupChecklist';
import { PublishBlockersInfo } from './PublishBlockersInfo';

export type { WorkspaceTab };

function normalizeTab(raw: string | null): WorkspaceTab {
  if (raw === 'rooms' || raw === 'rates' || raw === 'availability') return raw;
  if (raw === 'policy' || raw === 'cancellation') return 'cancellation';
  return 'hotel';
}

interface HotelWorkspaceProps {
  hotel: Hotel;
  onClose: () => void;
  onSaved: (hotel: Hotel) => void;
  /** Lets the page guard its own navigation (e.g. "Back to hotels") while edits are unsaved. */
  onDirtyChange?: (dirty: boolean) => void;
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

const HOTEL_FORM_ID = 'hotel-details-form';

export function HotelWorkspace({ hotel: initialHotel, onClose, onSaved, onDirtyChange, staff, variant = 'inline' }: HotelWorkspaceProps) {
  const { busy, run } = useBusyGuard();
  const toast = useToast();
  const formErrors = useServerErrors();

  const [hotel, setHotel] = useState(initialHotel);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [readiness, setReadiness] = useState<HotelReadiness | null>(null);
  const [mediaList, setMediaList] = useState<HotelMediaItem[]>(() => initialMedia(initialHotel));
  const [showRoom, setShowRoom] = useState(false);
  const [roomForMedia, setRoomForMedia] = useState<RoomType | null>(null);
  const [statusModal, setStatusModal] = useState<'SUSPENDED' | 'ARCHIVED' | null>(null);
  const readOnly = hotel.status === 'ARCHIVED';

  // Unsaved-change tracking: form edits per tab, photos compared with what is saved.
  const [detailsDirty, setDetailsDirty] = useState(false);
  const [policyDirty, setPolicyDirty] = useState(false);
  const photosDirty = JSON.stringify(mediaList) !== JSON.stringify(initialMedia(hotel));
  const dirtyFor = (tab: WorkspaceTab) => (tab === 'hotel' ? detailsDirty || photosDirty : tab === 'cancellation' ? policyDirty : false);
  const anyDirty = detailsDirty || photosDirty || policyDirty;
  const [pendingTab, setPendingTab] = useState<WorkspaceTab | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => normalizeTab(searchParams.get('tab')));

  useEffect(() => onDirtyChange?.(anyDirty), [anyDirty, onDirtyChange]);

  // Warn before closing or reloading the browser tab with unsaved edits.
  useEffect(() => {
    if (!anyDirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [anyDirty]);

  const goToTab = (tab: WorkspaceTab) => {
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

  const requestTab = (tab: WorkspaceTab) => {
    if (tab === activeTab) return;
    if (dirtyFor(activeTab)) setPendingTab(tab);
    else goToTab(tab);
  };

  const discardAndSwitch = () => {
    setDetailsDirty(false);
    setPolicyDirty(false);
    setMediaList(initialMedia(hotel));
    if (pendingTab) goToTab(pendingTab);
    setPendingTab(null);
  };

  useEffect(() => {
    if (hotel.media && hotel.media.length > 0) setMediaList(hotel.media);
  }, [hotel.media]);

  const loadReadiness = useCallback(async () => {
    try {
      setReadiness(await getHotelReadiness(readId(hotel)));
    } catch {
      /* Checklist stays as it was */
    }
  }, [hotel]);

  const loadRooms = useCallback(async () => {
    try {
      setRooms(await listRoomTypes(readId(hotel)));
    } catch {
      /* Handled silently */
    }
  }, [hotel]);

  useEffect(() => {
    void loadRooms();
    void loadReadiness();
  }, [loadRooms, loadReadiness]);

  const refreshAfterSetupChange = () => {
    void loadRooms();
    void loadReadiness();
  };

  const applySaved = (h: Hotel, message: string) => {
    setHotel(h);
    onSaved(h);
    toast.success(message);
  };

  const onConflict = () => toast.error('This hotel was changed in another session. Reload the page to get the latest version.');

  const publish = () =>
    run(async () => {
      try {
        const h = await publishHotel(readId(hotel), hotel.version);
        applySaved(h, hotel.status === 'SUSPENDED' ? 'Hotel reactivated and visible to guests.' : 'Hotel published and visible to guests.');
      } catch (e) {
        handleFormError(e, formErrors, toast, {
          onNotReady: () => toast.error('Not ready to publish yet. See what is still needed below.'),
          onConflict,
        });
      }
      void loadReadiness();
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

  /** One save for the Hotel tab: details first, then photos if they changed (each needs the latest version). */
  const saveHotelTab = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formErrors.clearErrors();
    const details = readHotelDetails(new FormData(e.currentTarget));
    const savePhotos = photosDirty;
    void run(async () => {
      try {
        let h = hotel;
        if (detailsDirty || !savePhotos) h = await updateHotel(readId(hotel), { version: h.version, ...details });
        if (savePhotos) h = await updateHotelMedia(readId(h), h.version, mediaList);
        setDetailsDirty(false);
        applySaved(h, savePhotos ? 'Hotel details and photos saved.' : 'Hotel details saved.');
        void loadReadiness();
      } catch (err) {
        handleFormError(err, formErrors, toast, { onConflict });
      }
    });
  };

  const savePolicy = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formErrors.clearErrors();
    const cancellationPolicy = readCancellationPolicy(new FormData(e.currentTarget));
    void run(async () => {
      try {
        const h = await updateHotel(readId(hotel), { version: hotel.version, cancellationPolicy });
        setPolicyDirty(false);
        applySaved(h, 'Cancellation policy saved.');
        void loadReadiness();
      } catch (err) {
        handleFormError(err, formErrors, toast, { onConflict });
      }
    });
  };

  const canEditRates = !staff || staff.permissions.includes('rates.edit');
  const stillNeeded = readiness && !readiness.ready && hotel.status !== 'PUBLISHED' && !readOnly ? readiness.problems : [];

  const body = (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Status status={hotel.status} variant="pill" />
          <span className="text-xs font-mono text-slate-400">/{hotel.slug}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PublishBlockersInfo problems={stillNeeded} />
          {!readOnly && (
            <Can permission="hotels.archive">
              <Button variant="ghost" size="sm" leftIcon={<Archive size={14} />} onClick={() => setStatusModal('ARCHIVED')} disabled={busy} className="text-rose-600 hover:bg-rose-50">
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
                {hotel.status === 'DRAFT' ? 'Publish hotel' : 'Reactivate hotel'}
              </Button>
            </Can>
          )}
        </div>
      </div>

      <HotelSetupChecklist
        readiness={readiness}
        activeTab={activeTab}
        onSelect={requestTab}
        counts={{ hotel: mediaList.length, rooms: rooms.length }}
      />

      {readOnly && (
        <Alert tone="warning" icon={<Lock size={16} />}>
          This hotel is archived and read-only. Its details, photos, room types, rates, and policies can no longer be changed.
        </Alert>
      )}


      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'hotel' && (
          <div className="space-y-10">
            <form id={HOTEL_FORM_ID} onSubmit={saveHotelTab} onChange={() => setDetailsDirty(true)}>
              <fieldset disabled={readOnly} className="space-y-6">
                <SectionTitle title="Property details & contact" copy="Identity, address and how guests reach you." />
                <HotelDetailsFields hotel={hotel} formErrors={formErrors} key={hotel.version} />
              </fieldset>
            </form>

            <div className="pt-6 border-t border-slate-200/80 space-y-6">
              <SectionTitle
                title={<span className="flex items-center gap-2"><ImageIcon size={16} className="text-slate-600" />Property photos</span>}
                copy="Exterior, lobby and amenity photos. Mark one as the cover photo. Optional for publishing, but guests book more with photos."
              />
              <HotelMediaGalleryManager media={mediaList} onChange={setMediaList} disabled={busy || readOnly} />
            </div>

            {!readOnly && (
              <Can permission="hotels.edit">
                <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                  {(detailsDirty || photosDirty) && <span className="text-xs text-amber-700">You have unsaved changes</span>}
                  <Button type="submit" form={HOTEL_FORM_ID} variant="primary" size="md" leftIcon={<Check size={14} />} isLoading={busy} loadingLabel="Saving…" disabled={!detailsDirty && !photosDirty} title={!detailsDirty && !photosDirty ? 'Nothing to save yet' : undefined}>
                    Save hotel
                  </Button>
                </div>
              </Can>
            )}
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <SectionTitle title="Room types" copy="Bookable room categories and their photos." />
              {!readOnly && (
                <Can permission="room_types.create">
                  <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowRoom(true)}>
                    Add room type
                  </Button>
                </Can>
              )}
            </div>
            <HotelRoomsList rooms={rooms} onManagePhotos={(room) => setRoomForMedia(room)} readOnly={readOnly} />
          </div>
        )}

        {activeTab === 'rates' && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-slate-100">
              <SectionTitle title="Nightly prices" copy="Set the base price per night (before tax) for each room type, in rupees." />
            </div>
            <HotelRatesTab hotel={hotel} rooms={rooms} canEditRates={canEditRates} readOnly={readOnly} onRatesUpdated={refreshAfterSetupChange} />
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-slate-100">
              <SectionTitle title="Availability" copy="Open dates for sale so guests can book each room type." />
            </div>
            <HotelAvailabilityTab hotel={hotel} rooms={rooms} readOnly={readOnly} onChanged={loadReadiness} />
          </div>
        )}

        {activeTab === 'cancellation' && (
          <form onSubmit={savePolicy} onChange={() => setPolicyDirty(true)}>
            <fieldset disabled={readOnly} className="space-y-6">
              <div className="pb-3 border-b border-slate-100">
                <SectionTitle title="Cancellation & no-show terms" copy="Free cancellation window and the fees after it. Saved with every booking." />
              </div>
              <CancellationPolicyFields hotel={hotel} formErrors={formErrors} key={hotel.version} onEdit={() => setPolicyDirty(true)} />
              {!readOnly && (
                <Can permission="hotels.edit">
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                    {policyDirty && <span className="text-xs text-amber-700">You have unsaved changes</span>}
                    <Button type="submit" variant="primary" size="md" leftIcon={<Check size={14} />} isLoading={busy} loadingLabel="Saving…" disabled={!policyDirty} title={!policyDirty ? 'Nothing to save yet' : undefined}>
                      Save cancellation policy
                    </Button>
                  </div>
                </Can>
              )}
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
            refreshAfterSetupChange();
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

      <ConfirmDialog
        isOpen={pendingTab !== null}
        onClose={() => setPendingTab(null)}
        onConfirm={discardAndSwitch}
        title="Discard unsaved changes?"
        message="You have changes on this step that haven't been saved. Leave without saving?"
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        variant="danger"
        icon="warning"
      />
    </>
  );
}

function SectionTitle({ title, copy }: { title: ReactNode; copy: string }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500">{copy}</p>
    </div>
  );
}
