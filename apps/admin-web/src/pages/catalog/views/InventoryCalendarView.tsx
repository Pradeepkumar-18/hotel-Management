import { InventoryDay, StaffMe } from '../../../api';
import { Button } from '../../../components/ui';
import { plusDays } from '../../../utils/helpers';

interface InventoryCalendarViewProps {
  selectedRoomName?: string;
  selectedHotelTimezone?: string;
  from: string;
  days: InventoryDay[];
  missing: number;
  staff: StaffMe;
  busy: boolean;
  onInitialize: () => void;
  onBlockDate: (day: InventoryDay) => void;
}

export function InventoryCalendarView({
  selectedRoomName,
  selectedHotelTimezone,
  from,
  days,
  missing,
  staff,
  busy,
  onInitialize,
  onBlockDate,
}: InventoryCalendarViewProps) {
  return (
    <div className="space-y-4">
      <div className="calendar-title flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{selectedRoomName}</h2>
          <p className="text-xs text-slate-500">
            Fourteen nights from {from}. Each date is local to {selectedHotelTimezone}.
          </p>
        </div>
        <div className="legend flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <i className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <i className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Fully allocated
          </span>
        </div>
      </div>

      {missing > 0 && (
        <div className="initialize-banner p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4 text-xs">
          <div>
            <b className="block font-semibold text-amber-900">{missing} dates need inventory setup</b>
            <span className="text-amber-700">Initialize new dates with the room type's current sellable room count.</span>
          </div>
          {staff.permissions.includes('inventory.adjust') && (
            <Button
              variant="outline"
              size="sm"
              isLoading={busy}
              loadingLabel="Initializing dates…"
              onClick={onInitialize}
              className="border-amber-300 text-amber-900 hover:bg-amber-100/60"
            >
              Initialize date range
            </Button>
          )}
        </div>
      )}

      <div className="calendar-grid grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 14 }, (_, index) => {
          const date = plusDays(from, index);
          const day = days.find((item) => item.stayDate === date);
          return (
            <div
              key={date}
              className={`day-cell p-3.5 rounded-xl border flex flex-col justify-between min-h-[180px] relative transition-shadow hover:shadow-2xs ${
                day ? 'bg-white border-slate-200' : 'bg-slate-50/60 border-slate-200 border-dashed'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))}
                </span>
                <b className="text-xl font-extrabold text-slate-800 block mt-0.5">{date.slice(8)}</b>
                <span className="text-[10px] text-slate-400 block">
                  {new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))}
                </span>
              </div>

              {day ? (
                <div className="space-y-2 mt-2">
                  <div className="flex items-baseline justify-between">
                    <span className={`text-xl font-bold font-mono ${day.available ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {day.available}
                    </span>
                    <small className="text-[10px] text-slate-400">avail</small>
                  </div>
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-1 text-[10px] text-slate-500">
                    <span>{day.total} tot</span>
                    <span>{day.held} held</span>
                    <span>{day.confirmed} book</span>
                    <span>{day.blocked} blk</span>
                  </div>
                  {day.available > 0 && staff.permissions.includes('inventory.block') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-left justify-start p-0 h-auto text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 pt-1"
                      onClick={() => onBlockDate(day)}
                    >
                      Block rooms
                    </Button>
                  )}
                </div>
              ) : (
                <div className="my-auto text-center">
                  <span className="text-xs text-amber-700 font-medium block">Not set</span>
                  <small className="text-[10px] text-slate-400 block">Initialize</small>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="calendar-footnote text-xs text-slate-500 flex items-center gap-2 pt-2">
        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">i</span>
        <span>Available = total rooms − blocked − held − confirmed. Changes are recorded in the audit log.</span>
      </div>
    </div>
  );
}
