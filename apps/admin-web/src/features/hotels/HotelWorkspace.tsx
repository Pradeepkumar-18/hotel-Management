import { useState, useEffect, useCallback, type FormEvent, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BedDouble, Check, Archive, Plus, PauseCircle, Building2, Image as ImageIcon, ShieldCheck, Lock } from 'lucide-react';
import { Hotel, RoomType, PublishProblem, StaffMe, HotelMediaItem, updateHotelMedia } from '../../api';
import { useBusyGuard, useToast } from '../../ui-feedback';
import { Alert, Button, Modal, Status, Tabs } from '../../components/ui';
import { readId } from '../../utils/helpers';
import { RoomCreateModal } from '../rooms/RoomCreateModal';
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

export type WorkspaceTab = 'general' | 'photos' | 'rooms' | 'policy';
const TABS: WorkspaceTab[] = ['general', 'photos', 'rooms', 'policy'];

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

export function HotelWorkspace({ hotel: initialHotel, onClose, onSaved, variant = 'inline' }: HotelWorkspaceProps) {
  const { busy, run } = useBusyGuard();
  const toast = useToast();
  const formErrors = useServerErrors();

  const [hotel, setHotel] = useState(initialHotel);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [mediaList, setMediaList] = useState<HotelMediaItem[]>(() => initialMedia(initialHotel));
  const [savingMedia, setSavingMedia] = useState(false);
  const [showRoom, setShowRoom] = useState(false);
  const [statusModal, setStatusModal] = useState<'SUSPENDED' | 'ARCHIVED' | null>(null);
  const [publishProblems, setPublishProblems] = useState<PublishProblem[]>([]);
  const readOnly = hotel.status === 'ARCHIVED';

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab') as WorkspaceTab;
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(TABS.includes(requestedTab) ? requestedTab : 'general');

  const switchTab = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === 'general') next.delete('tab');
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
      applySaved(await updateHotelMedia(readId(hotel), hotel.version, mediaList), 'Photos saved.');
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
            toast.error('Not ready to publish yet. See what is missing below.');
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

  const body = (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Status status={hotel.status} variant="pill" />
          <span className="text-xs font-mono text-slate-400">/{hotel.slug}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
              <Button variant="primary" size="sm" leftIcon={<Check size={15} />} isLoading={busy} loadingLabel={hotel.status === 'DRAFT' ? 'Publishing…' : 'Reactivating…'} onClick={publish}>
                {hotel.status === 'DRAFT' ? 'Publish' : 'Reactivate'}
              </Button>
            </Can>
          )}
        </div>
      </div>

      {readOnly && (
        <Alert tone="warning" icon={<Lock size={16} />}>
          This hotel is archived and read-only. Its details, photos and policy can no longer be changed.
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

      <Tabs
        activeId={activeTab}
        onChange={(id) => switchTab(id as WorkspaceTab)}
        items={[
          { id: 'general', label: 'Details', icon: <Building2 size={15} /> },
          { id: 'photos', label: 'Photos', icon: <ImageIcon size={15} />, badge: mediaList.length },
          { id: 'rooms', label: 'Rooms', icon: <BedDouble size={15} />, badge: rooms.length },
          { id: 'policy', label: 'Cancellation policy', icon: <ShieldCheck size={15} /> },
        ]}
      />

      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'general' && (
          <form onSubmit={saveDetails}>
            <fieldset disabled={readOnly} className="space-y-8">
              <HotelDetailsFields hotel={hotel} formErrors={formErrors} key={hotel.version} />
              <SaveBar readOnly={readOnly} busy={busy} label="Save details" />
            </fieldset>
          </form>
        )}

        {activeTab === 'photos' && (
          <div className="space-y-6">
            <HotelMediaGalleryManager media={mediaList} onChange={setMediaList} disabled={savingMedia || readOnly} />
            {!readOnly && (
              <Can permission="hotels.edit">
                <div className="flex justify-end">
                  <Button variant="primary" size="md" isLoading={savingMedia} loadingLabel="Saving photos…" onClick={saveMedia} leftIcon={<Check size={14} />}>
                    Save photos
                  </Button>
                </div>
              </Can>
            )}
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">Room types guests can book at this hotel.</p>
              {!readOnly && (
                <Can permission="room_types.create">
                  <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowRoom(true)}>
                    Add room type
                  </Button>
                </Can>
              )}
            </div>
            <HotelRoomsList rooms={rooms} />
          </div>
        )}

        {activeTab === 'policy' && (
          <form onSubmit={savePolicy}>
            <fieldset disabled={readOnly} className="space-y-6">
              <p className="text-xs text-slate-500">
                Shown to guests and saved with every booking. Changes apply to new bookings only.
              </p>
              <CancellationPolicyFields hotel={hotel} formErrors={formErrors} key={hotel.version} />
              <SaveBar readOnly={readOnly} busy={busy} label="Save policy" />
            </fieldset>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <>
      {variant === 'inline' ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs p-6 sm:p-8">{body}</div>
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
