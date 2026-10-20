import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Camera,
  Clock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  BedDouble,
  Users,
  Settings,
} from 'lucide-react';
import { Hotel, RoomType, StaffMe } from '../../api';
import { Alert, Button, Loader, Status } from '../../components/ui';
import { readId, resolveImageUrl } from '../../utils/helpers';
import { formatMoney } from '../../utils/money';
import { getHotel } from '../../features/hotels/hotels.api';
import { listRoomTypes } from '../../features/rooms/rooms.api';
import { getBaseRate, BaseRate } from '../../features/rates/rates.api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { Can } from '../../features/auth/Can';

export function HotelDetailPage({ staff: _staff }: { staff: StaffMe }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Load Hotel Details
  const {
    data: hotel,
    loading: hotelLoading,
    error: hotelError,
  } = useApiQuery<Hotel>(
    (signal) => (id ? getHotel(id, signal) : Promise.reject(new Error('Missing hotel ID'))),
    [id],
    { enabled: Boolean(id) }
  );

  // Load Room Types for this hotel
  const {
    data: rooms = [],
    loading: roomsLoading,
  } = useApiQuery<RoomType[]>(
    (signal) => (id ? listRoomTypes(id, signal) : Promise.resolve([])),
    [id],
    { enabled: Boolean(id) }
  );

  // Load Base Rates for the rooms
  const [ratesMap, setRatesMap] = useState<Record<string, BaseRate | null>>({});

  useEffect(() => {
    if (!rooms.length) return;
    void Promise.all(
      rooms.map(async (r) => {
        try {
          const rate = await getBaseRate(readId(r));
          return { roomId: readId(r), rate };
        } catch {
          return { roomId: readId(r), rate: null };
        }
      })
    ).then((results) => {
      const nextMap: Record<string, BaseRate | null> = {};
      for (const res of results) {
        nextMap[res.roomId] = res.rate;
      }
      setRatesMap(nextMap);
    });
  }, [rooms]);

  const handleBack = () => {
    navigate('/admin/hotels');
  };

  const handleManage = () => {
    if (id) navigate(`/admin/hotels/${id}/edit`);
  };

  if (hotelLoading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (hotelError || !hotel) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={handleBack}>
          Back to hotels
        </Button>
        <Alert tone="error">
          {hotelError instanceof Error ? hotelError.message : String(hotelError || 'Could not load hotel information.')}
        </Alert>
      </div>
    );
  }

  const heroImage =
    hotel.primaryImage ||
    hotel.heroImage ||
    (hotel.media && hotel.media.find((m) => m.isPrimary)?.url) ||
    (hotel.media && hotel.media[0]?.url);
  const mediaList = hotel.media || [];
  const policy = hotel.cancellationPolicy;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto pb-12 px-0 sm:px-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              PROPERTY DETAILS
            </span>
            <span className="text-slate-300">·</span>
            <Status status={hotel.status} variant="pill" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight break-words">
            {hotel.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
            <span>{hotel.address?.city || 'No city set'}, {hotel.address?.countryCode || 'IN'}</span>
            <span className="hidden xs:inline">·</span>
            <span className="font-mono text-slate-400">/{hotel.slug}</span>
            <span className="hidden xs:inline">·</span>
            <span>Timezone: {hotel.timezone}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft size={14} />}
            onClick={handleBack}
            className="flex-1 sm:flex-none justify-center"
          >
            Back to hotels
          </Button>
          <Can permission="hotels.edit">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Settings size={14} />}
              onClick={handleManage}
              className="flex-1 sm:flex-none justify-center"
            >
              Manage & configure
            </Button>
          </Can>
        </div>
      </div>

      {/* Hero Image & Gallery Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4 sm:space-y-5">
        <div className="relative rounded-xl overflow-hidden border border-slate-100 bg-slate-100 h-48 sm:h-64 md:h-80">
          {heroImage ? (
            <img
              src={resolveImageUrl(heroImage)}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
              <Building2 size={40} className="sm:size-11" />
              <span className="text-xs font-medium">No primary photo uploaded for this property</span>
            </div>
          )}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1.5 sm:gap-2 flex-wrap max-w-[85%]">
            <Status status={hotel.status} variant="pill" />
            <span className="bg-white/95 backdrop-blur-xs px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-mono font-medium text-slate-800 shadow-2xs">
              /{hotel.slug}
            </span>
          </div>
          {mediaList.length > 0 && (
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-black/75 backdrop-blur-xs text-white text-[11px] sm:text-xs font-medium px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs">
              <Camera size={13} className="sm:size-3.5" />
              <span>{mediaList.length} photo{mediaList.length === 1 ? '' : 's'}</span>
            </div>
          )}
        </div>

        {/* Gallery Thumbnails Strip */}
        {mediaList.length > 1 && (
          <div>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Property Gallery ({mediaList.length})
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-2.5">
              {mediaList.map((photo, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-lg overflow-hidden border ${
                    photo.isPrimary ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
                  }`}
                  title={photo.caption || 'Property photo'}
                >
                  <img
                    src={resolveImageUrl(photo.url)}
                    alt={photo.caption || `Photo ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Property Overview Cards Grid: 1 column on mobile, 2 columns on tablet, 3 columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Location & Timezone */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <span className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0">
              <MapPin size={16} />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Location & Timezone</h3>
          </div>
          <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <p className="font-bold text-slate-900 break-words">{hotel.address?.line1 || 'No street address set'}</p>
            {hotel.address?.line2 && <p className="text-slate-500 break-words">{hotel.address.line2}</p>}
            <p>
              {[hotel.address?.city, hotel.address?.region, hotel.address?.postalCode].filter(Boolean).join(', ')}
            </p>
            <p className="font-semibold text-slate-800">{hotel.address?.countryCode || 'IN'}</p>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-slate-500 flex-wrap">
              <Clock size={14} className="text-slate-400 shrink-0" />
              <span>Timezone: <strong className="text-slate-800">{hotel.timezone || 'Not set'}</strong></span>
            </div>
          </div>
        </div>

        {/* Contact & Basics */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <span className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0">
              <Mail size={16} />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Contact & Communications</h3>
          </div>
          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <Mail size={14} className="text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-800 break-all">{hotel.contact?.email || 'No email configured'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone size={14} className="text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700">{hotel.contact?.phone || 'No phone configured'}</span>
            </div>
            {hotel.description && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Overview</span>
                <p className="text-slate-600 leading-relaxed line-clamp-4">{hotel.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cancellation Terms (spans 2 columns on tablet, 1 column on desktop) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <span className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck size={16} />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Cancellation Policy</h3>
          </div>
          {policy ? (
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[11px] text-slate-400 block">Free cancellation window</span>
                <strong className="text-slate-900 text-xs">
                  {policy.freeCancellationHoursBeforeCheckIn} hours before check-in
                </strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[11px] text-slate-400 block">Late cancellation fee</span>
                <strong className="text-slate-900 text-xs">
                  {policy.afterCutoff?.basis === 'NO_FEE' && 'No fee'}
                  {policy.afterCutoff?.basis === 'FULL_STAY' && 'Full stay amount'}
                  {policy.afterCutoff?.basis === 'FIXED_MINOR_UNITS' && formatMoney(policy.afterCutoff.amountMinorUnits || 0, policy.afterCutoff.currency || 'INR')}
                  {policy.afterCutoff?.basis === 'PERCENTAGE_BPS' && `${((policy.afterCutoff.percentageBps || 0) / 100).toFixed(0)}% of stay`}
                </strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[11px] text-slate-400 block">No-show penalty</span>
                <strong className="text-slate-900 text-xs">
                  {policy.noShow?.basis === 'NO_FEE' && 'No fee'}
                  {policy.noShow?.basis === 'FULL_STAY' && 'Full stay amount'}
                  {policy.noShow?.basis === 'FIXED_MINOR_UNITS' && formatMoney(policy.noShow.amountMinorUnits || 0, policy.noShow.currency || 'INR')}
                  {policy.noShow?.basis === 'PERCENTAGE_BPS' && `${((policy.noShow.percentageBps || 0) / 100).toFixed(0)}% of stay`}
                </strong>
              </div>
              <span className="text-[11px] text-slate-400 block pt-1">
                Effective from: {policy.effectiveFrom}
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No cancellation policy configured yet.</p>
          )}
        </div>
      </div>

      {/* Room Types & Categories Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">Room Categories & Accommodations</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {rooms.length} configured
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Physical inventory units, guest capacity, and nightly rates for this property.
            </p>
          </div>
          <Can permission="hotels.edit">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Settings size={14} />}
              onClick={handleManage}
              className="w-full sm:w-auto justify-center"
            >
              Configure rooms & rates
            </Button>
          </Can>
        </div>

        {roomsLoading ? (
          <div className="py-12 flex justify-center">
            <Loader />
          </div>
        ) : rooms.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <BedDouble size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-700 text-sm">No room types added yet</p>
            <p className="mt-1">Add room categories to make this hotel bookable for guests.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rooms.map((room) => {
              const roomId = readId(room);
              const roomMedia = room.media || [];
              const roomPrimary = roomMedia.find((m) => m.isPrimary) || roomMedia[0];
              const rate = ratesMap[roomId];

              return (
                <div
                  key={roomId}
                  className="p-4 border border-slate-200/90 rounded-xl bg-slate-50/50 flex flex-col justify-between gap-3.5 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start gap-3 sm:gap-3.5">
                    {roomPrimary ? (
                      <img
                        src={resolveImageUrl(roomPrimary.url)}
                        alt={room.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-slate-100 text-slate-400 flex flex-col items-center justify-center shrink-0 text-[10px] gap-1">
                        <BedDouble size={20} className="sm:size-5.5" />
                        <span>No photo</span>
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <b className="font-bold text-slate-900 text-sm truncate">{room.name}</b>
                        <Status status={room.status} variant="dot" />
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="font-mono text-[11px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {room.code}
                        </span>
                        <span className="text-xs text-slate-500">
                          {room.totalRooms} rooms total
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 flex-wrap">
                        <Users size={13} className="text-slate-400 shrink-0" />
                        <span>Up to {room.maxAdults} adults {room.maxChildren > 0 ? `+ ${room.maxChildren} children` : ''}</span>
                      </p>
                    </div>
                  </div>

                  {/* Room Pricing & Specs Footer */}
                  <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Base Nightly Rate</span>
                      {rate ? (
                        <strong className="text-sm font-bold text-emerald-950">
                          {formatMoney(rate.amountMinorUnits, rate.currency)}
                        </strong>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Pricing unconfigured
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Photos</span>
                      <span className="font-medium text-slate-700">
                        {roomMedia.length} attached
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
