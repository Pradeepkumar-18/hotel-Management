import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, RefreshCw, X, Hotel as HotelIcon } from 'lucide-react';
import { Hotel, RoomType } from '../../../api';
import { readId } from '../../../utils/helpers';
import { Field, Select, Button, NotFound } from '../../../components/ui';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { listHotels, getHotel } from '../../../features/hotels/hotels.api';
import { listRoomTypes } from '../../../features/rooms/rooms.api';

export interface HotelRoomPickerProps {
  needsRoom?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onRefresh?: () => void;
  onSelectionChange?: (selection: { hotel: Hotel | null; room: RoomType | null; hotelId: string; roomId: string }) => void;
  extraFilters?: React.ReactNode;
}

export function HotelRoomPicker({
  needsRoom = false,
  disabled = false,
  loading = false,
  onRefresh,
  onSelectionChange,
  extraFilters,
}: HotelRoomPickerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlHotelId = searchParams.get('hotel') || '';
  const urlRoomId = searchParams.get('room') || '';

  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [hotelNotFound, setHotelNotFound] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Combobox state
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 250);
  const [hotelResults, setHotelResults] = useState<Hotel[]>([]);
  const [searching, setSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search hotels when typing or opening dropdown
  useEffect(() => {
    let active = true;
    setSearching(true);
    listHotels({ search: debouncedSearch, limit: 20 })
      .then((res) => {
        if (active) setHotelResults(res.items);
      })
      .catch(() => {
        if (active) setHotelResults([]);
      })
      .finally(() => {
        if (active) setSearching(false);
      });
    return () => {
      active = false;
    };
  }, [debouncedSearch]);

  // Load hotel if URL has hotel param and not loaded
  useEffect(() => {
    if (!urlHotelId) {
      // Pick first hotel if nothing selected
      listHotels({ limit: 1 }).then((res) => {
        if (res.items[0]) {
          const first = res.items[0];
          const firstId = readId(first);
          setSelectedHotel(first);
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('hotel', firstId);
            return next;
          });
        }
      });
      return;
    }

    if (!selectedHotel || readId(selectedHotel) !== urlHotelId) {
      getHotel(urlHotelId)
        .then((h) => {
          setSelectedHotel(h);
          setHotelNotFound(false);
        })
        .catch(() => {
          setSelectedHotel(null);
          setHotelNotFound(true);
        });
    }
  }, [urlHotelId]);

  // Fetch room types when selected hotel changes
  useEffect(() => {
    const hotelId = selectedHotel ? readId(selectedHotel) : '';
    if (!hotelId) {
      setRoomTypes([]);
      setSelectedRoom(null);
      return;
    }

    let active = true;
    setRoomsLoading(true);
    listRoomTypes(hotelId)
      .then((rooms) => {
        if (!active) return;
        setRoomTypes(rooms);

        // Match room from URL or default to first room
        if (needsRoom) {
          const matched = rooms.find((r) => readId(r) === urlRoomId);
          if (matched) {
            setSelectedRoom(matched);
          } else if (rooms.length > 0) {
            const first = rooms[0];
            setSelectedRoom(first);
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set('room', readId(first));
              return next;
            });
          } else {
            setSelectedRoom(null);
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.delete('room');
              return next;
            });
          }
        }
      })
      .catch(() => {
        if (active) setRoomTypes([]);
      })
      .finally(() => {
        if (active) setRoomsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedHotel, needsRoom]);

  // Propagate selection change upwards
  useEffect(() => {
    const hotelId = selectedHotel ? readId(selectedHotel) : '';
    const roomId = selectedRoom ? readId(selectedRoom) : '';
    onSelectionChange?.({
      hotel: selectedHotel,
      room: selectedRoom,
      hotelId,
      roomId,
    });
  }, [selectedHotel, selectedRoom, onSelectionChange]);

  const handleSelectHotel = (hotel: Hotel) => {
    const hId = readId(hotel);
    setSelectedHotel(hotel);
    setSelectedRoom(null);
    setIsOpen(false);
    setSearchTerm('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('hotel', hId);
      next.delete('room');
      return next;
    });
  };

  const handleRoomSelect = (roomId: string) => {
    const room = roomTypes.find((r) => readId(r) === roomId) || null;
    setSelectedRoom(room);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (roomId) next.set('room', roomId);
      else next.delete('room');
      return next;
    });
  };

  if (urlHotelId && hotelNotFound) {
    return (
      <div className="filters-panel p-6 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <NotFound
          title="Property not found"
          description="The property specified in the URL does not exist or has been removed."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete('hotel');
                  next.delete('room');
                  return next;
                });
                setHotelNotFound(false);
              }}
            >
              Choose another property
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="filters-panel p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-end gap-3">
      {/* Searchable Hotel Combobox */}
      <div ref={dropdownRef} className="sm:w-64 relative">
        <Field label="Property">
          <div className="relative">
          <div
            className={`w-full flex items-center justify-between h-9 px-3 text-xs bg-slate-50 border rounded-lg cursor-pointer transition-colors ${
              disabled ? 'opacity-50 pointer-events-none' : 'hover:border-slate-400 focus-within:border-brand-primary'
            } border-slate-300`}
            onClick={() => !disabled && setIsOpen(!isOpen)}
          >
            <span className="truncate font-medium text-slate-800">
              {selectedHotel ? selectedHotel.name : 'Choose a property'}
            </span>
            <ChevronDown size={14} className="text-slate-400 shrink-0 ml-1" />
          </div>

          {isOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-primary"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="max-h-56 overflow-y-auto space-y-0.5">
                {searching ? (
                  <div className="p-3 text-center text-xs text-slate-400">Searching...</div>
                ) : hotelResults.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">No properties found</div>
                ) : (
                  hotelResults.map((hotel) => {
                    const isSelected = selectedHotel && readId(selectedHotel) === readId(hotel);
                    return (
                      <button
                        key={readId(hotel)}
                        type="button"
                        onClick={() => handleSelectHotel(hotel)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                          isSelected
                            ? 'bg-brand-pale text-brand-primary font-semibold'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <HotelIcon size={14} className="shrink-0 text-slate-400" />
                        <div className="truncate flex-1">
                          <p className="truncate">{hotel.name}</p>
                          <p className="text-[10px] text-slate-400">{hotel.address?.city || 'Unassigned'}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </Field>
      </div>

      {/* Room Type Selector */}
      {needsRoom && (
        <Field label="Room type" className="sm:w-60">
          <Select
            value={selectedRoom ? readId(selectedRoom) : ''}
            onChange={(e) => handleRoomSelect(e.target.value)}
            disabled={disabled || roomsLoading || !roomTypes.length}
          >
            <option value="">
              {roomsLoading
                ? 'Loading room types...'
                : roomTypes.length
                ? 'Choose a room type'
                : 'No room types yet'}
            </option>
            {roomTypes.map((r) => (
              <option key={readId(r)} value={readId(r)}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {/* Extra Filters (e.g. Stay date for inventory) */}
      {extraFilters}

      {/* Refresh Button */}
      {onRefresh && (
        <div className="sm:ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={onRefresh}
            disabled={disabled || loading}
          >
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
}
