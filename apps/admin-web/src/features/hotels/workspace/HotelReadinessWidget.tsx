import { Check, AlertCircle, Sparkles, Building2, Image as ImageIcon, BedDouble, ShieldCheck } from 'lucide-react';
import { Hotel, RoomType, HotelMediaItem, PublishProblem } from '../../../api';

interface HotelReadinessWidgetProps {
  hotel: Hotel;
  rooms: RoomType[];
  media: HotelMediaItem[];
  hasAllBaseRates?: boolean;
  publishProblems?: PublishProblem[];
  onNavigateTab: (tab: 'general' | 'photos' | 'rooms' | 'policy') => void;
}

export function HotelReadinessWidget({
  hotel,
  rooms,
  media,
  hasAllBaseRates = true,
  publishProblems = [],
  onNavigateTab,
}: HotelReadinessWidgetProps) {
  const hasBasicInfo = Boolean(hotel.name && hotel.slug && hotel.address?.city);
  const hasCoverPhoto = media.some((m) => m.isPrimary);
  const hasRooms = rooms.length > 0 && hasAllBaseRates;
  const hasPolicy = Boolean(hotel.cancellationPolicy?.effectiveFrom);

  const steps = [
    {
      id: 'general' as const,
      label: 'Identity & Location',
      done: hasBasicInfo,
      hint: hasBasicInfo ? 'Complete' : 'Name, slug & city required',
      icon: Building2,
    },
    {
      id: 'photos' as const,
      label: 'Cover Photo',
      done: hasCoverPhoto,
      hint: hasCoverPhoto ? `${media.length} photos added` : 'At least 1 cover photo needed',
      icon: ImageIcon,
    },
    {
      id: 'rooms' as const,
      label: 'Room Categories & Rates',
      done: hasRooms,
      hint: rooms.length === 0
        ? 'Add at least 1 room category'
        : !hasAllBaseRates
        ? 'Base rate missing on room(s)'
        : `${rooms.length} room ${rooms.length === 1 ? 'type' : 'types'} ready with rates`,
      icon: BedDouble,
    },
    {
      id: 'policy' as const,
      label: 'Cancellation Policy',
      done: hasPolicy,
      hint: hasPolicy ? 'Terms configured' : 'Policy rules defined',
      icon: ShieldCheck,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const isFullyReady = completedCount === steps.length;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
      {/* Title & Progress Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500" />
            Publish Readiness
          </span>
          <span className="text-xs font-bold text-[#164e3f]">
            {completedCount}/{steps.length} steps
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isFullyReady ? 'bg-emerald-500' : 'bg-[#164e3f]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onNavigateTab(step.id)}
              className="w-full text-left flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-xs ${
                    step.done
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {step.done ? <Check size={13} /> : <Icon size={13} />}
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-brand-primary block leading-tight">
                    {step.label}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{step.hint}</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-300 group-hover:text-slate-600 transition-colors">
                →
              </span>
            </button>
          );
        })}
      </div>

      {/* Pre-publish missing warning if publish attempted and failed */}
      {publishProblems.length > 0 && (
        <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
            <AlertCircle size={14} />
            <span>Missing requirements:</span>
          </div>
          <ul className="text-[11px] text-rose-700 list-disc pl-4 space-y-0.5">
            {publishProblems.map((prob, idx) => (
              <li key={idx}>{prob.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
