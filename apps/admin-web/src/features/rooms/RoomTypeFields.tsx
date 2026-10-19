import { useState, type ReactNode } from 'react';
import { RoomType } from '../../api';
import { Field, Input, Textarea } from '../../components/ui';
import { useServerErrors } from '../../hooks/useServerErrors';

/** Letters/digits in dash-separated groups, e.g. DLX-K. Matches the API rule. */
export const ROOM_CODE_PATTERN = '[A-Z0-9]+(-[A-Z0-9]+)*';

interface RoomTypeFieldsProps {
  room?: RoomType | null;
  formErrors: ReturnType<typeof useServerErrors>;
  /** Lets the parent know when the sellable count changes (edit needs a reason then). */
  onTotalChange?: (total: number) => void;
  /** Compact layout for the quick-add modal (no description). */
  compact?: boolean;
}

/** Name, code, description and capacity fields shared by the room-type page and the quick-add modal. */
export function RoomTypeFields({ room, formErrors, onTotalChange, compact = false }: RoomTypeFieldsProps) {
  const [code, setCode] = useState(room?.code ?? '');
  const err = (...keys: string[]) => keys.map((k) => formErrors.getError(k)).find(Boolean);

  return (
    <div className="space-y-8">
      <Group title="General details" hide={compact}>
        <Field label="Room category name" required hint={compact ? undefined : 'e.g. Deluxe Ocean View Suite'} error={err('name')}>
          <Input
            name="name"
            required
            minLength={2}
            maxLength={120}
            defaultValue={room?.name ?? ''}
            placeholder="Deluxe Ocean View Suite"
            isError={Boolean(err('name'))}
          />
        </Field>

        <Field label="Room code" required hint="Letters, digits and dashes, e.g. DLX-K" error={err('code')}>
          <Input
            name="code"
            required
            maxLength={32}
            pattern={ROOM_CODE_PATTERN}
            title="Use letters, digits and single dashes, e.g. DLX-K"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, '-'))}
            placeholder="DLX-K"
            className="font-mono"
            isError={Boolean(err('code'))}
          />
        </Field>

        {!compact && (
          <Field label="Description" fullWidth hint="Room size, bed layout, view or special features (optional)" error={err('description')}>
            <Textarea
              name="description"
              rows={3}
              maxLength={3000}
              showCount
              defaultValue={room?.description ?? ''}
              placeholder="Spacious room with a king-size bed, en-suite bathroom and city views…"
              isError={Boolean(err('description'))}
            />
          </Field>
        )}
      </Group>

      <Group title="Occupancy & sellable rooms" hide={compact} columns={3}>
        <Field label="Maximum adults" required error={err('maxAdults', 'adults')}>
          <Input name="adults" type="number" min={1} max={30} step={1} required defaultValue={room?.maxAdults ?? 2} isError={Boolean(err('maxAdults', 'adults'))} />
        </Field>
        <Field label="Maximum children" required hint="0 for adults-only" error={err('maxChildren', 'children')}>
          <Input name="children" type="number" min={0} max={30} step={1} required defaultValue={room?.maxChildren ?? 0} isError={Boolean(err('maxChildren', 'children'))} />
        </Field>
        <Field label="Sellable rooms" required hint="0 means not bookable" error={err('totalRooms', 'total')}>
          <Input
            name="total"
            type="number"
            min={0}
            max={10000}
            step={1}
            required
            defaultValue={room?.totalRooms ?? 10}
            onChange={(e) => onTotalChange?.(Number(e.target.value))}
            isError={Boolean(err('totalRooms', 'total'))}
          />
        </Field>
      </Group>
    </div>
  );
}

function Group({ title, children, hide, columns = 2 }: { title: string; children: ReactNode; hide: boolean; columns?: 2 | 3 }) {
  const grid = columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2';
  if (hide) return <div className={`grid grid-cols-1 ${grid} gap-4`}>{children}</div>;
  return (
    <section>
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{title}</h4>
      <div className={`grid grid-cols-1 ${grid} gap-5`}>{children}</div>
    </section>
  );
}

/** Reads the fields above into the room-type API shape. `description` is '' when cleared. */
export function readRoomTypeFields(f: FormData) {
  return {
    name: String(f.get('name') ?? '').trim(),
    code: String(f.get('code') ?? '').trim().toUpperCase(),
    maxAdults: Number(f.get('adults')),
    maxChildren: Number(f.get('children') ?? 0),
    totalRooms: Number(f.get('total')),
    description: f.has('description') ? String(f.get('description') ?? '').trim() : undefined,
  };
}
