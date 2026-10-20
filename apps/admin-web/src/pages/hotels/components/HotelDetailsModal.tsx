import { Building2, ExternalLink, MapPin, Mail, Phone, Clock, ShieldCheck, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Hotel } from '../../../api';
import { Button, Modal, Status } from '../../../components/ui';
import { readId, resolveImageUrl } from '../../../utils/helpers';
import { formatMoney } from '../../../utils/money';

interface HotelDetailsModalProps {
  hotel: Hotel;
  onClose: () => void;
}

export function HotelDetailsModal({ hotel, onClose }: HotelDetailsModalProps) {
  const navigate = useNavigate();
  const hotelId = readId(hotel);
  const heroImage = hotel.primaryImage || hotel.heroImage || (hotel.media && hotel.media.find((m) => m.isPrimary)?.url) || (hotel.media && hotel.media[0]?.url);
  const policy = hotel.cancellationPolicy;

  const handleManage = () => {
    onClose();
    navigate(`/admin/hotels/${hotelId}/edit`);
  };

  return (
    <Modal
      title={hotel.name}
      subtitle={`Property details & overview`}
      onClose={onClose}
      wide
    >
      <div className="space-y-6">
        {/* Header Hero Image & Status Banner */}
        <div className="relative rounded-xl overflow-hidden border border-slate-200/80 bg-slate-100 h-44 sm:h-52">
          {heroImage ? (
            <img
              src={resolveImageUrl(heroImage)}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <Building2 size={36} />
              <span className="text-xs">No primary hero photo uploaded</span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Status status={hotel.status} variant="pill" />
            <span className="bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-mono font-medium text-slate-700 shadow-2xs">
              /{hotel.slug}
            </span>
          </div>
          {hotel.media && hotel.media.length > 0 && (
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
              <Camera size={13} />
              <span>{hotel.media.length} photos</span>
            </div>
          )}
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          {/* Location & Timezone Card */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-800">
              <MapPin size={14} />
              <span>Location & Timezone</span>
            </h4>
            <div className="space-y-1.5 text-slate-600">
              <p className="font-semibold text-slate-800">{hotel.address?.line1 || 'No street address set'}</p>
              {hotel.address?.line2 && <p>{hotel.address.line2}</p>}
              <p>
                {[hotel.address?.city, hotel.address?.region, hotel.address?.postalCode].filter(Boolean).join(', ')}
              </p>
              <p className="font-medium text-slate-700">{hotel.address?.countryCode || 'IN'}</p>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-slate-500">
                <Clock size={13} className="text-slate-400" />
                <span>Timezone: <strong>{hotel.timezone || 'Not set'}</strong></span>
              </div>
            </div>
          </div>

          {/* Contact & Basics Card */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-800">
              <Mail size={14} />
              <span>Contact & Reservations</span>
            </h4>
            <div className="space-y-2 text-slate-600">
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-slate-400 shrink-0" />
                <span className="font-medium text-slate-800 truncate">{hotel.contact?.email || 'No email configured'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-slate-400 shrink-0" />
                <span className="text-slate-700">{hotel.contact?.phone || 'No phone configured'}</span>
              </div>
              {hotel.description && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Description</span>
                  <p className="text-slate-600 line-clamp-3 leading-relaxed">{hotel.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cancellation Terms Preview */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/70 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-slate-700">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Cancellation Policy</span>
            </h4>
            {policy && (
              <span className="text-[11px] font-medium text-slate-500">
                Effective: {policy.effectiveFrom}
              </span>
            )}
          </div>

          {policy ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                <span className="text-[10px] text-slate-400 block">Free cancellation window</span>
                <strong className="text-slate-800 text-xs">{policy.freeCancellationHoursBeforeCheckIn} hours before check-in</strong>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                <span className="text-[10px] text-slate-400 block">Late cancellation fee</span>
                <strong className="text-slate-800 text-xs">
                  {policy.afterCutoff?.basis === 'NO_FEE' && 'No fee'}
                  {policy.afterCutoff?.basis === 'FULL_STAY' && 'Full stay amount'}
                  {policy.afterCutoff?.basis === 'FIXED_MINOR_UNITS' && formatMoney(policy.afterCutoff.amountMinorUnits || 0, policy.afterCutoff.currency || 'INR')}
                  {policy.afterCutoff?.basis === 'PERCENTAGE_BPS' && `${((policy.afterCutoff.percentageBps || 0) / 100).toFixed(0)}% of stay`}
                </strong>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                <span className="text-[10px] text-slate-400 block">No-show penalty</span>
                <strong className="text-slate-800 text-xs">
                  {policy.noShow?.basis === 'NO_FEE' && 'No fee'}
                  {policy.noShow?.basis === 'FULL_STAY' && 'Full stay amount'}
                  {policy.noShow?.basis === 'FIXED_MINOR_UNITS' && formatMoney(policy.noShow.amountMinorUnits || 0, policy.noShow.currency || 'INR')}
                  {policy.noShow?.basis === 'PERCENTAGE_BPS' && `${((policy.noShow.percentageBps || 0) / 100).toFixed(0)}% of stay`}
                </strong>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-xs">No cancellation policy configured yet.</p>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<ExternalLink size={13} />}
            onClick={handleManage}
          >
            Manage & configure hotel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
