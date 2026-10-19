import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { Hotel, RoomType } from '../../../api';
import { readId } from '../../../utils/helpers';
import { Combobox, Field, Select, Button, NotFound } from '../../../components/ui';
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

  // Property search (server-side, debounced)
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 250);
  const [hotelResults, setHotelResults] = useState<Hotel[]>([]);
  const [searching, setSearching] = useState(false);

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
      <Field label="Property" className="sm:w-64">
        <Combobox
          aria-label="Property"
          disabled={disabled}
          value={selectedHotel ? readId(selectedHotel) : ''}
          selectedLabel={selectedHotel?.name}
          placeholder="Choose a property"
          loading={searching}
          emptyText="No properties found"
          onSearch={setSearchTerm}
          options={hotelResults.map((h) => ({ value: readId(h), label: h.name, description: h.address?.city || 'Unassigned' }))}
          onChange={(id) => {
            const hotel = hotelResults.find((h) => readId(h) === id);
            if (hotel) handleSelectHotel(hotel);
          }}
        />
      </Field>

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
