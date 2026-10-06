import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { BedDouble, Building2, CalendarDays, Check, CircleHelp, Compass, DollarSign, LayoutDashboard, LogOut, Menu, Plus, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { ApiError, Hotel, InventoryDay, request, RoomType, setCsrfToken, StaffMe } from './api';
import { AsyncButton, Spinner, useBusyGuard, useToast } from './ui-feedback';

type HotelList = { items: Hotel[]; total: number };
const navGroups = [
  { label: 'Overview', items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'hotels.view' }] },
  { label: 'Property setup', items: [
    { to: '/admin/hotels', label: 'Hotels', icon: Building2, permission: 'hotels.view' },
    { to: '/admin/room-types', label: 'Room types', icon: BedDouble, permission: 'room_types.view' },
  ] },
  { label: 'Operations', items: [
    { to: '/admin/inventory', label: 'Availability', icon: CalendarDays, permission: 'inventory.view' },
    { to: '/admin/rates', label: 'Base rates', icon: DollarSign, permission: 'rates.view' },
  ] },
];
const isoToday = (timeZone = 'UTC') => new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const plusDays = (date: string, days: number) => { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
const readId = (value: any) => value?._id || value?.id;
const humanStatus = (status = '') => status.toLowerCase().replaceAll('_', ' ');

export default function App() {
  const [staff, setStaff] = useState<StaffMe | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const checkSession = useCallback(async () => {
    setChecking(true);
    try { setStaff(await request<StaffMe>('/auth/me')); setError(''); }
    catch (err) { setStaff(null); if (!(err instanceof ApiError && err.status === 401)) setError('The Staywise API could not be reached. Check that it is running and try again.'); }
    finally { setChecking(false); }
  }, []);

  useEffect(() => { void checkSession(); }, [checkSession]);
  const logout = async () => { try { await request('/auth/logout', { method: 'POST' }); } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not close the staff session cleanly.'); } finally { setCsrfToken(''); setStaff(null); navigate('/admin/login'); } };

  if (checking) return <div className="boot-screen" role="status" aria-live="polite"><span className="brand-mark"><Compass size={21} /></span><Spinner size={20} /><span>Opening Staywise</span></div>;
  if (!staff) return <Routes><Route path="/admin/login" element={<Login onLogin={setStaff} apiError={error} />} /><Route path="*" element={<Navigate to="/admin/login" replace />} /></Routes>;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <Link className="brand" to="/admin/hotels"><span className="brand-mark"><Compass size={19} /></span><span>staywise<span className="brand-sub">HOTEL OPERATIONS</span></span></Link>
      <nav className="sidebar-navigation" aria-label="Admin navigation">{navGroups.map(group => { const visibleItems = group.items.filter(item => staff.permissions.includes(item.permission)); return visibleItems.length ? <section className="nav-group" key={group.label}><h2 className="nav-caption">{group.label}</h2>{visibleItems.map(({ to, label, icon: Icon }) => <NavItem key={to} to={to} label={label} icon={<Icon size={18} strokeWidth={1.9} />} onClick={() => setMobileNav(false)} />)}</section> : null; })}</nav>
      <div className="sidebar-bottom"><div className="support-box"><span className="support-icon"><CircleHelp size={17} /></span><span><b>Need a hand?</b><small>Ask your Staywise admin</small></span></div><div className="staff-profile"><span className="avatar">{staff.user.email.slice(0, 1).toUpperCase()}</span><span className="profile-copy"><b>{staff.user.email}</b><small>{staff.roles[0]?.replaceAll('_', ' ') || 'Staff'}</small></span><AsyncButton className="icon-button" aria-label="Sign out" onClick={logout}><LogOut size={17} /></AsyncButton></div></div>
    </aside>
    {mobileNav && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu /></button><div className="crumb"><span>Operations</span><span className="crumb-slash">/</span><b>Workspace</b></div><div className="topbar-right"><span className="secure-tag"><ShieldCheck size={15} /> Staff workspace</span><button className="icon-button refresh-button" aria-label="Refresh current page" onClick={() => window.location.reload()}><RefreshCw size={16} /></button></div></header>
      <section className="page-frame"><Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<DashboardPage staff={staff} />} />
        <Route path="/admin/hotels" element={<HotelsPage staff={staff} />} />
        <Route path="/admin/room-types" element={<CatalogPage mode="rooms" staff={staff} />} />
        <Route path="/admin/inventory" element={<CatalogPage mode="inventory" staff={staff} />} />
        <Route path="/admin/rates" element={<CatalogPage mode="rates" staff={staff} />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes></section>
    </main>
  </div>;
}

function NavItem({ to, label, icon, onClick }: { to: string; label: string; icon: React.ReactNode; onClick?: () => void }) {
  const location = useLocation(); const active = location.pathname === to;
  return <Link className={`nav-link ${active ? 'nav-active' : ''}`} to={to} onClick={onClick}>{icon}<span>{label}</span>{active && <span className="nav-indicator" />}</Link>;
}

function DashboardPage({ staff }: { staff: StaffMe }) {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<{ hotels: Hotel[]; total: number; published: number; draft: number; suspended: number; archived: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [all, published, draft, suspended, archived] = await Promise.all([
        request<HotelList>('/admin/hotels?limit=8&offset=0'),
        request<HotelList>('/admin/hotels?status=PUBLISHED&limit=1&offset=0'),
        request<HotelList>('/admin/hotels?status=DRAFT&limit=1&offset=0'),
        request<HotelList>('/admin/hotels?status=SUSPENDED&limit=1&offset=0'),
        request<HotelList>('/admin/hotels?status=ARCHIVED&limit=1&offset=0'),
      ]);
      setOverview({ hotels: all.items, total: all.total, published: published.total, draft: draft.total, suspended: suspended.total, archived: archived.total });
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load operations overview'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const dateLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return <div className="dashboard-page">
    <div className="dashboard-heading"><div><span className="eyebrow">STAYWISE OPERATIONS</span><h1>Dashboard</h1><p>Property activity and setup status at a glance.</p></div><div className="dashboard-heading-actions"><span className="dashboard-date">{dateLabel}</span><AsyncButton className="button button-outline" onClick={load} busy={loading} loadingLabel="Refreshing overview…"><RefreshCw size={15} /> Refresh</AsyncButton></div></div>
    {error && <Alert tone="error">{error} <AsyncButton className="dashboard-inline-action" onClick={load} busy={loading} loadingLabel="Retrying…">Try again</AsyncButton></Alert>}
    <div className="dashboard-metrics" aria-label="Property summary">
      <MetricCard label="Total properties" value={overview?.total} icon={<Building2 size={19} />} detail="Across your accessible portfolio" tone="green" loading={loading} />
      <MetricCard label="Published" value={overview?.published} icon={<Check size={19} />} detail="Visible in the public catalog" tone="teal" loading={loading} />
      <MetricCard label="In setup" value={overview?.draft} icon={<Compass size={19} />} detail="Draft properties to complete" tone="sand" loading={loading} />
      <MetricCard label="Paused or archived" value={(overview?.suspended ?? 0) + (overview?.archived ?? 0)} icon={<CalendarDays size={19} />} detail={`${overview?.suspended ?? 0} suspended · ${overview?.archived ?? 0} archived`} tone="slate" loading={loading} />
    </div>
    <div className="dashboard-content-grid">
      <section className="dashboard-panel dashboard-property-panel">
        <div className="dashboard-panel-heading"><div><span className="eyebrow">PORTFOLIO</span><h2>Properties</h2><p>Quick access to your properties.</p></div><button className="button button-outline button-small" onClick={() => navigate('/admin/hotels')}>All properties <span aria-hidden="true">↗</span></button></div>
        {loading ? <LoadingRows /> : overview?.hotels.length ? <div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>Property</th><th>Location</th><th>Time zone</th><th>Status</th><th></th></tr></thead><tbody>{overview.hotels.map(hotel => <tr key={readId(hotel)}><td><span className="dashboard-hotel-name"><span className="hotel-icon"><Building2 size={16} /></span><span><b>{hotel.name}</b><small>/{hotel.slug}</small></span></span></td><td>{hotel.address?.city}, {hotel.address?.countryCode}</td><td className="timezone-cell">{hotel.timezone}</td><td><Status status={hotel.status} /></td><td><button className="row-action" onClick={() => navigate('/admin/hotels')}>Open <span aria-hidden="true">↗</span></button></td></tr>)}</tbody></table></div> : <EmptyState icon={<Building2 />} title="No properties yet" copy="Create a property to start configuring rooms, rates, and availability." action={<button className="button button-primary" onClick={() => navigate('/admin/hotels')}>Open properties</button>} />}
        {!loading && overview && overview.total > overview.hotels.length && <div className="dashboard-table-footer">Showing {overview.hotels.length} of {overview.total} properties <button className="text-button" onClick={() => navigate('/admin/hotels')}>View all</button></div>}
      </section>
      <aside className="dashboard-panel dashboard-actions-panel"><div className="dashboard-panel-heading"><div><span className="eyebrow">WORKSPACE</span><h2>Quick actions</h2><p>Continue managing your properties.</p></div></div>
        {staff.permissions.includes('hotels.view') && <button className="dashboard-action" onClick={() => navigate('/admin/hotels')}><span className="dashboard-action-icon"><Building2 size={18} /></span><span><b>Manage properties</b><small>{overview?.draft ?? 0} drafts need setup</small></span><span className="dashboard-arrow">↗</span></button>}
        {staff.permissions.includes('room_types.view') && <button className="dashboard-action" onClick={() => navigate('/admin/room-types')}><span className="dashboard-action-icon"><BedDouble size={18} /></span><span><b>Room types</b><small>Manage capacity and sellable rooms</small></span><span className="dashboard-arrow">↗</span></button>}
        {staff.permissions.includes('rates.view') && <button className="dashboard-action" onClick={() => navigate('/admin/rates')}><span className="dashboard-action-icon"><DollarSign size={18} /></span><span><b>Base rates</b><small>Set nightly amounts by room type</small></span><span className="dashboard-arrow">↗</span></button>}
        {staff.permissions.includes('inventory.view') && <button className="dashboard-action" onClick={() => navigate('/admin/inventory')}><span className="dashboard-action-icon"><CalendarDays size={18} /></span><span><b>Availability calendar</b><small>Set inventory and block rooms</small></span><span className="dashboard-arrow">↗</span></button>}
        <div className="dashboard-note"><ShieldCheck size={16} /><span>Availability and pricing changes are validated by the server.</span></div>
      </aside>
    </div>
  </div>;
}

function MetricCard({ label, value, detail, icon, tone, loading }: { label: string; value?: number; detail: string; icon: React.ReactNode; tone: string; loading: boolean }) {
  return <article className={`metric-card metric-${tone}`}><div className="metric-card-top"><span className="metric-icon">{icon}</span><span className="metric-label">{label}</span></div><strong aria-live="polite">{loading ? '—' : value ?? 0}</strong><small>{detail}</small></article>;
}

function KpiStrip({ items, loading }: { items: Array<{ label: string; value?: number; detail: string }>; loading: boolean }) {
  return <section className="kpi-strip" aria-label="Key performance indicators">{items.map(item => <article className="kpi-card" key={item.label}><span>{item.label}</span><strong aria-live="polite">{loading || item.value === undefined ? '—' : item.value}</strong><small>{item.detail}</small></article>)}</section>;
}

function Login({ onLogin, apiError }: { onLogin: (user: StaffMe) => void; apiError: string }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(apiError); const { busy, run } = useBusyGuard(); const toast = useToast();
  const submit = (e: React.FormEvent) => { e.preventDefault(); void run(async () => { setError(''); try { const login = await request<{ csrfToken: string }>('/auth/staff/login', { method: 'POST', body: JSON.stringify({ email, password }) }); setCsrfToken(login.csrfToken); onLogin(await request<StaffMe>('/auth/me')); toast.success('Welcome back. You are signed in.'); } catch (err) { toast.error(err instanceof Error ? err.message : 'Sign in failed. Check your details and retry.'); } }); };
  return <div className="login-page"><div className="login-art"><Link className="brand brand-light" to="/admin/login"><span className="brand-mark"><Compass size={19} /></span><span>staywise<span className="brand-sub">HOTEL OPERATIONS</span></span></Link><div className="art-note"><span className="tiny-rule" /><p>Make every stay<br />feel considered.</p><small>A calmer way to run your property.</small></div><div className="art-footer">STAYWISE · OPERATIONS CONSOLE</div></div><div className="login-main"><form className="login-form" onSubmit={submit}><div className="eyebrow">WELCOME BACK</div><h1>Good to see you.</h1><p className="muted">Sign in with your staff account to continue.</p>{error && <Alert tone="error">{error}</Alert>}<Field label="Work email"><input autoComplete="username" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@hotel.com" /></Field><Field label="Password"><input autoComplete="current-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" /></Field><AsyncButton type="submit" busy={busy} loadingLabel="Signing in…" className="button button-primary button-wide">Sign in<span aria-hidden="true">↗</span></AsyncButton><p className="login-foot">Access is managed by your Staywise administrator.</p></form></div></div>;
}

function HotelsPage({ staff }: { staff: StaffMe }) {
  const [data, setData] = useState<HotelList | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [open, setOpen] = useState(false); const [selected, setSelected] = useState<Hotel | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number> | null>(null);
  const load = useCallback(async () => { setLoading(true); try { const statuses = ['PUBLISHED', 'DRAFT', 'SUSPENDED', 'ARCHIVED']; const [all, ...counts] = await Promise.all([request<HotelList>('/admin/hotels?limit=100&offset=0'), ...statuses.map(status => request<HotelList>(`/admin/hotels?status=${status}&limit=1&offset=0`))]); setData(all); setStatusCounts(Object.fromEntries(statuses.map((status, index) => [status, counts[index].total]))); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load hotels'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const canCreate = staff.permissions.includes('hotels.create');
  return <><PageHeading eyebrow="PROPERTY DIRECTORY" title="Hotels" description="Set up each property, its operating details, and launch readiness." action={canCreate ? <button className="button button-primary" onClick={() => setOpen(true)}><Plus size={17} /> Add a hotel</button> : undefined} />
    <KpiStrip items={[
      { label: 'Properties', value: data?.total, detail: 'In your accessible workspace' },
      { label: 'Published', value: statusCounts?.PUBLISHED, detail: 'Live in the public catalog' },
      { label: 'In setup', value: statusCounts?.DRAFT, detail: 'Draft properties' },
      { label: 'Paused', value: statusCounts?.SUSPENDED, detail: 'Suspended properties' },
      { label: 'Archived', value: statusCounts?.ARCHIVED, detail: 'Archived properties' },
    ]} loading={loading} />
    <div className="section-heading"><div><h2>Property list</h2><p>Choose a property to configure rooms, rates, and availability.</p></div><AsyncButton className="text-button" onClick={load} busy={loading} loadingLabel="Refreshing…"><RefreshCw size={15} /> Refresh</AsyncButton></div>
    {error && <Alert tone="error">{error}</Alert>}{loading ? <LoadingRows /> : data?.items.length ? <div className="table-wrap"><table><thead><tr><th>Property</th><th>Location</th><th>Timezone</th><th>Status</th><th>Setup</th></tr></thead><tbody>{data.items.map(h => <tr key={readId(h)} onClick={() => setSelected(h)} className="click-row"><td><span className="hotel-name"><span className="hotel-icon"><Building2 size={17} /></span><span><b>{h.name}</b><small>/{h.slug}</small></span></span></td><td>{h.address?.city}, {h.address?.countryCode}</td><td className="timezone-cell">{h.timezone}</td><td><Status status={h.status} /></td><td><button className="row-action" onClick={e => { e.stopPropagation(); setSelected(h); }}>Open workspace <span>↗</span></button></td></tr>)}</tbody></table></div> : <EmptyState icon={<Building2 />} title="Your first property starts here" copy="Add a hotel to begin setting up its rooms, pricing, and availability." action={canCreate ? <button className="button button-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add a hotel</button> : undefined} />}
    {open && <HotelCreateModal onClose={() => setOpen(false)} onCreated={h => { setOpen(false); setSelected(h); void load(); }} />}
    {selected && <HotelWorkspace hotel={selected} onClose={() => setSelected(null)} onSaved={h => { setSelected(h); void load(); }} staff={staff} />}
  </>;
}

function HotelCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (hotel: Hotel) => void }) {
  const { busy, run } = useBusyGuard(); const toast = useToast();
  const submit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = new FormData(e.currentTarget); void run(async () => { const name = String(f.get('name')); try { const h = await request<Hotel>('/admin/hotels', { method: 'POST', body: JSON.stringify({ name, slug: String(f.get('slug')), timezone: String(f.get('timezone')), address: { line1: String(f.get('line1')), city: String(f.get('city')), postalCode: String(f.get('postalCode')), countryCode: String(f.get('countryCode')) }, contact: { email: String(f.get('email')) } }) }); toast.success('Property created as a draft.'); onCreated(h); } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not create hotel'); } }); };
  return <Modal title="Add a property" subtitle="Start with the essential details. You can configure room types and policies next." onClose={onClose}><form className="form-grid" onSubmit={submit}><Field label="Property name"><input name="name" required minLength={2} placeholder="The Linden House" /></Field><Field label="Property slug"><input name="slug" required placeholder="the-linden-house" /></Field><Field label="Street address"><input className="form-full" name="line1" required placeholder="18 Residency Road" /></Field><Field label="City"><input name="city" required placeholder="Bengaluru" /></Field><Field label="Postal code"><input name="postalCode" required placeholder="560025" /></Field><Field label="Country code"><input name="countryCode" required minLength={2} maxLength={2} defaultValue="IN" /></Field><Field label="Time zone"><input name="timezone" required defaultValue="Asia/Kolkata" /></Field><Field label="Contact email"><input name="email" required type="email" placeholder="frontdesk@example.com" /></Field><div className="form-full modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><AsyncButton type="submit" busy={busy} loadingLabel="Creating property…" className="button button-primary">Create draft property</AsyncButton></div></form></Modal>;
}

function HotelWorkspace({ hotel: initial, onClose, onSaved, staff }: { hotel: Hotel; onClose: () => void; onSaved: (hotel: Hotel) => void; staff: StaffMe }) {
  const [hotel, setHotel] = useState(initial); const [rooms, setRooms] = useState<RoomType[]>([]); const { busy, run } = useBusyGuard(); const toast = useToast(); const [showRoom, setShowRoom] = useState(false);
  const loadRooms = useCallback(async () => { try { setRooms(await request<RoomType[]>(`/admin/hotels/${readId(hotel)}/room-types`)); } catch { setRooms([]); } }, [hotel]);
  useEffect(() => { void loadRooms(); }, [loadRooms]);
  const publish = () => run(async () => { try { const h = await request<Hotel>(`/admin/hotels/${readId(hotel)}/publish`, { method: 'POST', body: JSON.stringify({ version: hotel.version }) }); setHotel(h); onSaved(h); toast.success('Property published and visible in the catalog.'); } catch (e) { toast.error(e instanceof Error ? e.message : 'Publication could not be completed'); } });
  const savePolicy = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = new FormData(e.currentTarget); const fee = (prefix: string) => { const basis = String(f.get(`${prefix}Basis`)); return basis === 'FIXED_MINOR_UNITS' ? { basis, amountMinorUnits: Number(f.get(`${prefix}Amount`)), currency: String(f.get(`${prefix}Currency`)).toUpperCase() } : basis === 'PERCENTAGE_BPS' ? { basis, percentageBps: Math.round(Number(f.get(`${prefix}Percent`)) * 100) } : { basis }; }; void run(async () => { try { const h = await request<Hotel>(`/admin/hotels/${readId(hotel)}`, { method: 'PATCH', body: JSON.stringify({ version: hotel.version, cancellationPolicy: { effectiveFrom: String(f.get('effectiveFrom')), freeCancellationHoursBeforeCheckIn: Number(f.get('cutoff')), afterCutoff: fee('after'), noShow: fee('noShow') } }) }); setHotel(h); onSaved(h); toast.success('Cancellation and no-show terms saved.'); } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not save policy'); } }); };
  return <Modal title={hotel.name} subtitle={`${hotel.address?.city} · ${hotel.timezone} · Property workspace`} onClose={onClose} wide><div className="workspace-top"><div><Status status={hotel.status} /><span className="workspace-slug">/{hotel.slug}</span></div>{staff.permissions.includes('hotels.publish') && hotel.status !== 'PUBLISHED' && <AsyncButton className="button button-primary" busy={busy} loadingLabel="Publishing property…" onClick={publish}><Check size={16} /> Publish property</AsyncButton>}</div>
    <div className="setup-progress"><div className={rooms.length ? 'step-done' : ''}><span>{rooms.length ? <Check size={13} /> : '1'}</span><b>Room types</b></div><i /><div className="step-current"><span>2</span><b>Rates & availability</b></div><i /><div><span>3</span><b>Publish</b></div></div>
    <div className="workspace-section"><div className="section-heading"><div><h3>Room types</h3><p>{rooms.length ? `${rooms.length} room type${rooms.length === 1 ? '' : 's'} configured` : 'Create a room type to start selling stays.'}</p></div>{staff.permissions.includes('room_types.create') && <button className="button button-outline button-small" onClick={() => setShowRoom(true)}><Plus size={15} /> Add room</button>}</div>{rooms.length ? <div className="room-list">{rooms.map(r => <div className="room-line" key={readId(r)}><span className="hotel-icon"><BedDouble size={17} /></span><span className="room-copy"><b>{r.name}</b><small>{r.code} · up to {r.maxAdults} adults · {r.totalRooms} rooms</small></span><Status status={r.status} /></div>)}</div> : <div className="inline-empty">No room types yet. Add your first room category.</div>}</div>
    <div className="workspace-section policy-section"><div className="section-heading"><div><h3>Cancellation terms</h3><p>Enter the terms this property will honor. No default policy is assumed.</p></div>{hotel.cancellationPolicy && <span className="saved-label"><Check size={14} /> Policy saved</span>}</div><form className="form-grid policy-form" onSubmit={savePolicy}><Field label="Effective from"><input type="date" name="effectiveFrom" required defaultValue={hotel.cancellationPolicy?.effectiveFrom || isoToday(hotel.timezone)} /></Field><Field label="Free cancellation cutoff"><div className="input-suffix"><input type="number" name="cutoff" required min="0" max="8760" defaultValue={hotel.cancellationPolicy?.freeCancellationHoursBeforeCheckIn ?? 24} /><span>hours before check-in</span></div></Field><FeeField label="After cutoff" prefix="after" initial={hotel.cancellationPolicy?.afterCutoff} /><FeeField label="No-show" prefix="noShow" initial={hotel.cancellationPolicy?.noShow} /><div className="form-full"><small className="permission-note">Any fixed fee must use the same currency as the property's room rates.</small>{staff.permissions.includes('hotels.edit') && <AsyncButton type="submit" className="button button-outline button-small" busy={busy} loadingLabel="Saving terms…">Save cancellation terms</AsyncButton>}</div></form></div>
    {showRoom && <RoomCreateModal hotelId={String(readId(hotel))} onClose={() => setShowRoom(false)} onCreated={() => { setShowRoom(false); void loadRooms(); }} />}
  </Modal>;
}

function FeeField({ label, prefix, initial }: { label: string; prefix: string; initial?: any }) { const [basis, setBasis] = useState(initial?.basis || 'NO_FEE'); return <div className="field"><label>{label}</label><select name={`${prefix}Basis`} value={basis} onChange={e => setBasis(e.target.value)}><option value="NO_FEE">No fee</option><option value="FULL_STAY">Full stay amount</option><option value="FIXED_MINOR_UNITS">Fixed amount</option><option value="PERCENTAGE_BPS">Percentage</option></select>{basis === 'FIXED_MINOR_UNITS' && <><input className="fee-extra" aria-label={`${label} amount in minor units`} type="number" min="0" step="1" name={`${prefix}Amount`} required defaultValue={initial?.amountMinorUnits} placeholder="Amount in minor units" /><input className="fee-extra" aria-label={`${label} currency code`} name={`${prefix}Currency`} required minLength={3} maxLength={3} defaultValue={initial?.currency} placeholder="ISO currency code" /></>}{basis === 'PERCENTAGE_BPS' && <div className="input-suffix fee-extra"><input type="number" min="0" max="100" step="0.01" name={`${prefix}Percent`} required defaultValue={initial?.percentageBps !== undefined ? initial.percentageBps / 100 : ''} /><span>% of stay</span></div>}</div>; }

function RoomCreateModal({ hotelId, onClose, onCreated }: { hotelId: string; onClose: () => void; onCreated: () => void }) { const { busy, run } = useBusyGuard(); const toast = useToast(); const submit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = new FormData(e.currentTarget); void run(async () => { try { await request(`/admin/hotels/${hotelId}/room-types`, { method: 'POST', body: JSON.stringify({ name: String(f.get('name')), code: String(f.get('code')), maxAdults: Number(f.get('adults')), maxChildren: Number(f.get('children')), totalRooms: Number(f.get('total')) }) }); toast.success('Room type added.'); onCreated(); } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not create room type'); } }); }; return <Modal title="Add a room type" subtitle="Set the sellable room count and guest capacity." onClose={onClose}><form className="form-grid" onSubmit={submit}><Field label="Room name"><input name="name" required placeholder="Courtyard king" /></Field><Field label="Room code"><input name="code" required placeholder="COURT-K" /></Field><Field label="Adults"><input name="adults" type="number" min="1" max="30" required defaultValue="2" /></Field><Field label="Children"><input name="children" type="number" min="0" max="30" required defaultValue="0" /></Field><Field label="Sellable rooms"><input name="total" type="number" min="0" max="10000" required defaultValue="8" /></Field><div className="form-full modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><AsyncButton type="submit" className="button button-primary" busy={busy} loadingLabel="Adding room type…">Add room type</AsyncButton></div></form></Modal>; }

function CatalogPage({ mode, staff }: { mode: 'rooms' | 'inventory' | 'rates'; staff: StaffMe }) {
  const [hotels, setHotels] = useState<Hotel[]>([]); const [hotelId, setHotelId] = useState(''); const [rooms, setRooms] = useState<RoomType[]>([]); const [roomId, setRoomId] = useState(''); const [days, setDays] = useState<InventoryDay[]>([]); const [from, setFrom] = useState(''); const [loading, setLoading] = useState(true); const { busy, run } = useBusyGuard(); const toast = useToast(); const [error, setError] = useState(''); const [rate, setRate] = useState<any>(null);
  const [rateCoverage, setRateCoverage] = useState<{configured: number; missing: number} | null>(null);
  const selectedHotel = hotels.find(h => readId(h) === hotelId); const selectedRoom = rooms.find(r => readId(r) === roomId);
  const loadHotels = useCallback(async () => { try { const result = await request<HotelList>('/admin/hotels?limit=100&offset=0'); setHotels(result.items); if (!hotelId && result.items[0]) setHotelId(readId(result.items[0])); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load properties'); } finally { setLoading(false); } }, [hotelId]);
  useEffect(() => { void loadHotels(); }, [loadHotels]);
  useEffect(() => { if (!hotelId) return; let live = true; setLoading(true); request<RoomType[]>(`/admin/hotels/${hotelId}/room-types`).then(rs => { if (live) { setRooms(rs); setRoomId(current => rs.some(r => readId(r) === current) ? current : rs[0] ? readId(rs[0]) : ''); } }).catch(e => { if (live) setError(e.message); }).finally(() => { if (live) setLoading(false); }); return () => { live = false; }; }, [hotelId]);
  useEffect(() => { if (selectedHotel && !from) { setFrom(new Intl.DateTimeFormat('en-CA', { timeZone: selectedHotel.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())); } }, [selectedHotel, from]);
  useEffect(() => {
    if (mode !== 'rates' || !rooms.length) { setRateCoverage(null); return; }
    let live = true;
    Promise.all(rooms.map(room => request(`/admin/room-types/${readId(room)}/base-rate`).then(() => true).catch(error => { if (error instanceof ApiError && error.status === 404) return false; throw error; })))
      .then(results => { if (live) setRateCoverage({ configured: results.filter(Boolean).length, missing: results.filter(value => !value).length }); })
      .catch(error => { if (live) setError(error instanceof Error ? error.message : 'Could not load rate summary'); });
    return () => { live = false; };
  }, [mode, rooms]);
  const loadRoomData = useCallback(async () => { if (!roomId || (mode === 'inventory' && !from) || mode === 'rooms') return; setError(''); setLoading(true); try { if (mode === 'inventory') { const result = await request<{ nights: InventoryDay[] }>(`/admin/room-types/${roomId}/inventory?from=${from}&to=${plusDays(from, 14)}`); setDays(result.nights); } else { setRate(null); setRate(await request(`/admin/room-types/${roomId}/base-rate`)); } } catch (e) { if (mode === 'rates' && e instanceof ApiError && e.status === 404) setRate(null); else setError(e instanceof Error ? e.message : `Could not load ${mode === 'rates' ? 'base rate' : 'availability'}`); } finally { setLoading(false); } }, [roomId, mode, from]);
  useEffect(() => { void loadRoomData(); }, [loadRoomData]);
  const headings = { rooms: ['ROOM CATALOG', 'Room types', 'Manage the room categories available at each property.'], inventory: ['PROPERTY AVAILABILITY', 'Availability', 'Review sellable rooms by property-local stay date.'], rates: ['ROOM PRICING', 'Base rates', 'Set the starting nightly price for each room type.'] }[mode];
  const canEditRates = staff.permissions.includes('rates.edit');
  const initialize = () => { if (!roomId) return; void run(async () => { setError(''); try { const result = await request<{createdNights:number}>(`/admin/room-types/${roomId}/inventory/initialize`, { method: 'POST', body: JSON.stringify({ from, to: plusDays(from, 14) }) }); toast.success(`${result.createdNights} nights initialized for ${selectedRoom?.name}.`); await loadRoomData(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not initialize dates'); } }); };
  const blockDate = (day: InventoryDay) => { const answer = window.prompt(`How many of the ${day.available} available rooms should be blocked on ${day.stayDate}? Enter a quantity and reason separated by a comma (example: 1, maintenance).`); if (!answer) return; const [quantity, ...words] = answer.split(','); const amount = Number(quantity); const reason = words.join(',').trim(); if (!Number.isInteger(amount) || amount < 1 || !reason) { setError('Enter a whole room quantity and a reason separated by a comma.'); return; } void run(async () => { setError(''); try { await request(`/admin/room-types/${roomId}/inventory/${day.stayDate}/block`, { method: 'POST', body: JSON.stringify({ version: day.version, quantity: amount, reason }) }); toast.success(`Blocked ${amount} room${amount === 1 ? '' : 's'} on ${day.stayDate}.`); await loadRoomData(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update availability'); } }); };
  const saveRate = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); if (!selectedRoom) return; const f = new FormData(e.currentTarget); void run(async () => { setError(''); try { const saved = await request<any>(`/admin/room-types/${roomId}/base-rate`, { method: 'PUT', body: JSON.stringify({ amountMinorUnits: Number(f.get('amount')), currency: String(f.get('currency')).toUpperCase(), version: rate?.version ?? 0, reason: String(f.get('reason')) }) }); setRate(saved); toast.success('Base rate saved. Tax is not included.'); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save base rate'); } }); };
  const missing = useMemo(() => 14 - days.length, [days]);
  const inventorySummary = useMemo(() => days.reduce((sum, day) => ({ available: sum.available + day.available, held: sum.held + day.held, confirmed: sum.confirmed + day.confirmed, blocked: sum.blocked + day.blocked }), { available: 0, held: 0, confirmed: 0, blocked: 0 }), [days]);
  const activeSellableRooms = rooms.reduce((sum, room) => sum + room.totalRooms, 0);
  return <><PageHeading eyebrow={headings[0]} title={headings[1]} description={headings[2]} />{error && <Alert tone="error">{error}</Alert>}
    <div className="filters-panel"><Field label="Property"><select value={hotelId} onChange={e => setHotelId(e.target.value)}><option value="">Choose a property</option>{hotels.map(h => <option key={readId(h)} value={readId(h)}>{h.name}</option>)}</select></Field><Field label="Room type"><select value={roomId} onChange={e => setRoomId(e.target.value)} disabled={!rooms.length}><option value="">{rooms.length ? 'Choose a room type' : 'No room types yet'}</option>{rooms.map(r => <option key={readId(r)} value={readId(r)}>{r.name}</option>)}</select></Field>{mode === 'inventory' && <Field label="First stay date"><input type="date" value={from} onChange={e => setFrom(e.target.value)} /></Field>}<div className="filter-end"><span className="timezone-hint">{selectedHotel?.timezone || 'Property timezone'}</span><AsyncButton className="icon-button" title="Reload data" aria-label="Reload data" onClick={loadRoomData} busy={loading}><RefreshCw size={16} /></AsyncButton></div></div>
    {mode === 'rooms' && <KpiStrip items={[{label:'Active room types',value:rooms.length,detail:selectedHotel?.name || 'Selected property'},{label:'Sellable rooms',value:activeSellableRooms,detail:'Configured across active types'},{label:'Guest capacity',value:rooms.reduce((sum,r)=>sum+r.maxAdults+r.maxChildren,0),detail:'Maximum guests across one room per type'}]} loading={loading || !!error} />}
    {mode === 'rates' && <KpiStrip items={[{label:'Room types',value:rooms.length,detail:selectedHotel?.name || 'Selected property'},{label:'Rates configured',value:rateCoverage?.configured,detail:'Active room types with a base rate'},{label:'Rates missing',value:rateCoverage?.missing,detail:'Active room types without a base rate'}]} loading={loading || !!error || (rooms.length > 0 && !rateCoverage)} />}
    {mode === 'inventory' && <KpiStrip items={[{label:'Dates initialized',value:days.length,detail:`of 14 nights from ${from || 'selected date'}`},{label:'Available room-nights',value:inventorySummary.available,detail:'Selected room type and date range'},{label:'Held + confirmed',value:inventorySummary.held+inventorySummary.confirmed,detail:`${inventorySummary.held} held · ${inventorySummary.confirmed} confirmed`},{label:'Blocked room-nights',value:inventorySummary.blocked,detail:'Selected room type and date range'}]} loading={loading || !!error} />}
    {loading && <LoadingRows />}
    {!loading && hotels.length === 0 && <EmptyState icon={<Building2 />} title="No properties to show" copy="Create a property or ask an administrator to assign one to your staff account." />}
    {!loading && hotels.length > 0 && rooms.length === 0 && <EmptyState icon={<BedDouble />} title="No room types yet" copy={`Add a room type to ${selectedHotel?.name || 'this property'} before managing rates or availability.`} />}
    {!loading && rooms.length > 0 && mode === 'rooms' && <div className="table-wrap"><table><thead><tr><th>Room type</th><th>Guests</th><th>Sellable rooms</th><th>Status</th></tr></thead><tbody>{rooms.map(room => <tr key={readId(room)}><td><span className="hotel-name"><span className="hotel-icon"><BedDouble size={17} /></span><span><b>{room.name}</b><small>{room.code}</small></span></span></td><td>{room.maxAdults} adults{room.maxChildren ? ` · ${room.maxChildren} children` : ''}</td><td>{room.totalRooms}</td><td><Status status={room.status} /></td></tr>)}</tbody></table></div>}
    {!loading && rooms.length > 0 && mode === 'rates' && <div className="rate-card" key={`${roomId}-${rate?._id || 'unset'}`}><div className="rate-head"><span className="rate-icon"><DollarSign size={19} /></span><div><h2>{selectedRoom?.name}</h2><p>{selectedHotel?.name} · base nightly price</p></div></div>{rate && <div className="current-rate"><small>Current base rate</small><strong>{rate.currency} {Number(rate.amountMinorUnits).toLocaleString()}</strong><span>minor units per night · before tax calculation</span></div>}<form onSubmit={saveRate} className="rate-form"><Field label="Nightly amount (minor units)"><input name="amount" type="number" step="1" min="0" required defaultValue={rate?.amountMinorUnits ?? ''} placeholder="Integer minor units" /></Field><Field label="Currency code"><input name="currency" required pattern="[A-Za-z]{3}" maxLength={3} defaultValue={rate?.currency || ''} placeholder="ISO 4217" /></Field><Field label="Reason for change"><input name="reason" required minLength={3} placeholder="Initial pricing" /></Field><div className="form-full"><AsyncButton type="submit" disabled={!canEditRates} className="button button-primary" busy={busy} loadingLabel="Saving rate…">{rate ? 'Save base rate' : 'Set base rate'}<span aria-hidden="true">↗</span></AsyncButton>{!canEditRates && <small className="permission-note">You have view access only for rates.</small>}</div></form></div>}
    {!loading && rooms.length > 0 && mode === 'inventory' && <>
      <div className="calendar-title"><div><h2>{selectedRoom?.name}</h2><p>Fourteen nights from {from}. Each date is local to {selectedHotel?.timezone}.</p></div><div className="legend"><span><i className="dot dot-green" /> Available</span><span><i className="dot dot-stone" /> Fully allocated</span></div></div>
      {missing > 0 && <div className="initialize-banner"><div><b>{missing} dates need inventory setup</b><span>Initialize new dates with the room type's current sellable room count.</span></div>{staff.permissions.includes('inventory.adjust') && <AsyncButton className="button button-outline button-small" busy={busy} loadingLabel="Initializing dates…" onClick={initialize}>Initialize date range</AsyncButton>}</div>}
      <div className="calendar-grid">{Array.from({ length: 14 }, (_, index) => { const date = plusDays(from, index); const day = days.find(item => item.stayDate === date); return <div key={date} className={`day-cell ${day ? '' : 'day-missing'}`}><span className="day-week">{new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))}</span><b className="day-date">{date.slice(8)}</b><span className="day-month">{new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))}</span>{day ? <><span className={`availability-number ${day.available ? '' : 'none-left'}`}>{day.available}</span><small>available</small><div className="day-breakdown"><span>{day.total} total</span><span>{day.held} held</span><span>{day.confirmed} booked</span><span>{day.blocked} blocked</span></div>{day.available > 0 && staff.permissions.includes('inventory.block') && <AsyncButton className="day-action" busy={busy} loadingLabel="Blocking rooms…" onClick={() => blockDate(day)}>Block rooms</AsyncButton>}</> : <><span className="not-set">Not set</span><small>initialize range</small></>}</div>; })}</div>
      <div className="calendar-footnote"><span className="inline-info">i</span> Available = total rooms − blocked − held − confirmed. Changes are recorded in the audit log.</div>
    </>}
  </>;
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) { return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="field"><label>{label}</label>{children}</div>; }
function Alert({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) { return <div className={`alert alert-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{tone === 'error' ? <X size={16} /> : <Check size={16} />}{children}</div>; }
function Status({ status }: { status: string }) { return <span className={`status status-${status.toLowerCase()}`}><i />{humanStatus(status)}</span>; }
function Modal({ title, subtitle, onClose, children, wide = false }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) { useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onClose]); return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}><header className="modal-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" aria-label="Close" onClick={onClose}><X size={19} /></button></header><div className="modal-body">{children}</div></section></div>; }
function EmptyState({ icon, title, copy, action }: { icon: React.ReactNode; title: string; copy: string; action?: React.ReactNode }) { return <div className="empty-state"><span className="empty-icon">{icon}</span><h2>{title}</h2><p>{copy}</p>{action}</div>; }
function LoadingRows() { return <div className="loading-rows" role="status" aria-label="Loading data" aria-busy="true"><div /><div /><div /></div>; }
