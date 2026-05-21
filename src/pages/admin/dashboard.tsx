import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface Profile {
  id: string;
  submittedAt: string;
  fullName?: string;
  gender?: string;
  dob?: string;
  birthPlace?: string;
  address?: string;
  raas?: string;
  gana?: string;
  gotra?: string;
  shakha?: string;
  nakshatra?: string;
  charan?: string;
  naad?: string;
  mangal?: string;
  diet?: string;
  height?: string;
  weight?: string;
  bloodGroup?: string;
  education?: string;
  occupation?: string;
  jobLocation?: string;
  income?: string;
  fatherName?: string;
  fatherDetails?: string;
  motherName?: string;
  motherDetails?: string;
  siblings?: string;
  maritalStatus?: string;
  vyanga?: string;
  vyangaDetail?: string;
  ageMin?: string;
  ageMax?: string;
  expectedHeight?: string;
  expectedEducation?: string;
  partnerExpectations?: string;
  contact1?: string;
  contact2?: string;
  transactionId?: string;
  profilePhotoUrl?: string;
  profilePhotoBase64?: string;
}

interface Message {
  id: string;
  sentAt: string;
  read: boolean;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
}

// ── Profile Card ──────────────────────────────────────────────────────────────
function ProfileCard({ profile, index, onDelete }: { profile: Profile; index: number; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/profiles/${profile.id}`, { method: 'DELETE' });
      onDelete(profile.id);
    } catch (_) {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function buildProfileHtml(): Promise<string> {
    const origin = window.location.origin;

    // Convert logo to base64
    let logoBase64 = `${origin}/assets/logo.png`;
    try {
      const resp = await fetch(`${origin}/assets/logo.png`);
      const blob = await resp.blob();
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (_) {}

    const photoBase64 = profile.profilePhotoBase64 || '';

    const personalFields = [
      ['Full Name', profile.fullName], ['Gender', profile.gender],
      ['Date of Birth', profile.dob], ['Birth Place', profile.birthPlace],
      ['Address', profile.address], ['Raas', profile.raas],
      ['Gana', profile.gana], ['Gotra', profile.gotra],
      ['Shakha', profile.shakha], ['Nakshatra', profile.nakshatra],
      ['Charan', profile.charan], ['Naad', profile.naad],
      ['Mangal', profile.mangal], ['Diet', profile.diet],
      ['Height', profile.height], ['Weight', profile.weight],
      ['Blood Group', profile.bloodGroup],
    ].filter(([,v]) => v).map(([l,v]) => `<div class="row"><span class="label">${l}</span><span class="value">${v}</span></div>`).join('');

    return `
      <html><head><title>${profile.fullName || 'Profile'} — LNM Biodata</title>
      <style>
        body { font-family: Georgia, serif; padding: 40px; color: #1A1040; max-width: 720px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #C9A84C; padding-bottom: 14px; margin-bottom: 20px; }
        .header img.logo { width: 64px; height: 64px; object-fit: contain; display: block; margin: 0 auto 8px; }
        .header h1 { color: #2D1B69; font-size: 20px; margin: 0 0 2px; }
        .header .sub { color: #7A5C3A; font-size: 12px; margin: 0 0 4px; font-style: italic; }
        .header p { color: #999; font-size: 11px; margin: 0; }
        h2 { color: #2D1B69; font-size: 13px; margin-top: 18px; margin-bottom: 6px; border-bottom: 1px solid #C9A84C; padding-bottom: 3px; text-transform: uppercase; letter-spacing: 0.05em; }
        .row { display: flex; gap: 16px; margin-bottom: 5px; }
        .label { font-weight: bold; min-width: 150px; font-size: 11px; color: #5B4E8A; }
        .value { font-size: 11px; color: #1A1040; }
        .personal-section { display: flex; gap: 24px; align-items: flex-start; }
        .personal-fields { flex: 1; }
        .personal-photo { flex-shrink: 0; width: 130px; display: flex; flex-direction: column; align-items: center; gap: 6px; padding-top: 4px; }
        .personal-photo img { width: 120px; height: 120px; object-fit: cover; border-radius: 50%; border: 3px solid #C9A84C; display: block; }
        .personal-photo .name { font-size: 12px; font-weight: bold; color: #2D1B69; text-align: center; margin-top: 6px; }
        .expectations { font-size: 11px; color: #1A1040; line-height: 1.6; padding: 8px; background: #f5f3ff; border-left: 3px solid #C9A84C; border-radius: 4px; }
        .footer { margin-top: 40px; font-size: 10px; color: #bbb; border-top: 1px solid #eee; padding-top: 10px; text-align: center; }
      </style></head><body>
      <div class="header">
        <img class="logo" src="${logoBase64}" alt="Lakshmi Narayan Matrimony Logo" />
        <h1>${profile.fullName || 'Biodata'}</h1>
        <p class="sub">लक्ष्मी नारायण वधू-वर सूचक</p>
        <p>Submitted: ${new Date(profile.submittedAt).toLocaleString('en-IN')}</p>
      </div>

      <h2>Personal Details</h2>
      <div class="personal-section">
        <div class="personal-fields">${personalFields}</div>
        ${photoBase64 ? `<div class="personal-photo"><img src="${photoBase64}" alt="Profile Photo" /><p class="name">${profile.fullName || ''}</p></div>` : ''}
      </div>

      <h2>Education &amp; Occupation</h2>
      ${[['Education', profile.education], ['Occupation', profile.occupation], ['Job Location', profile.jobLocation], ['Annual Income', profile.income]].filter(([,v]) => v).map(([l,v]) => `<div class="row"><span class="label">${l}</span><span class="value">${v}</span></div>`).join('')}

      <h2>Family Details</h2>
      ${[["Father's Name", profile.fatherName], ["Father's Details", profile.fatherDetails], ["Mother's Name", profile.motherName], ["Mother's Details", profile.motherDetails], ['Siblings', profile.siblings], ['Vyanga', profile.vyanga], ['Vyanga Detail', profile.vyangaDetail]].filter(([,v]) => v).map(([l,v]) => `<div class="row"><span class="label">${l}</span><span class="value">${v}</span></div>`).join('')}

      <h2>Contact Details</h2>
      ${[['Contact 1', profile.contact1], ['Contact 2', profile.contact2]].filter(([,v]) => v).map(([l,v]) => `<div class="row"><span class="label">${l}</span><span class="value">${v}</span></div>`).join('')}

      <h2>Partner Expectations</h2>
      ${profile.partnerExpectations ? `<div class="expectations">${profile.partnerExpectations}</div>` : '<p style="font-size:11px;color:#999;">Not specified.</p>'}

      <div class="footer">Lakshmi Narayan Matrimony — Confidential. For internal use only. Do not distribute.</div>
      </body></html>
    `;
  }

  async function printProfile() {
    const html = await buildProfileHtml();
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.print();
  }

  async function downloadProfile() {
    const html = await buildProfileHtml();

    // Render into a hidden iframe, then capture as JPEG with white background
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none;visibility:hidden;background:#ffffff;';
    document.body.appendChild(iframe);

    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      iframe.srcdoc = html;
    });

    // Wait for images to render inside iframe
    await new Promise(r => setTimeout(r, 800));

    try {
      const { toJpeg } = await import('html-to-image');
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) throw new Error('No iframe document');
      const bodyEl = iframeDoc.body;
      bodyEl.style.margin = '0';
      bodyEl.style.background = '#ffffff';
      // Capture as JPEG with white background — no transparency
      const dataUrl = await toJpeg(bodyEl, {
        width: 794,
        pixelRatio: 2,
        quality: 0.92,
        backgroundColor: '#ffffff',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${profile.fullName || 'biodata'}-LNM.jpg`;
      a.click();
    } finally {
      document.body.removeChild(iframe);
    }
  }

  const fields: [string, string | undefined][] = [
    ['Gender', profile.gender], ['DOB', profile.dob], ['Birth Place', profile.birthPlace],
    ['Raas', profile.raas], ['Nakshatra', profile.nakshatra], ['Gotra', profile.gotra],
    ['Mangal', profile.mangal], ['Diet', profile.diet], ['Height', profile.height],
    ['Blood Group', profile.bloodGroup], ['Education', profile.education],
    ['Occupation', profile.occupation], ['Income', profile.income],
    ['Marital Status', profile.maritalStatus], ['Contact 1', profile.contact1],
    ['Transaction ID', profile.transactionId],
  ];

  return (
    <motion.div
      className="bg-card rounded-xl border border-accent/30 shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' as const }}
      layout
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-accent/20 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {(profile.profilePhotoBase64 || profile.profilePhotoUrl) && (
            <img src={profile.profilePhotoBase64 || profile.profilePhotoUrl} alt={profile.fullName} className="w-10 h-10 rounded-full object-cover border-2 border-accent/40 shrink-0" />
          )}
          <div>
            <p className="font-heading text-primary font-semibold text-base">{profile.fullName || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">
              {profile.gender} &nbsp;•&nbsp; Submitted: {new Date(profile.submittedAt).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs px-3 py-1.5 rounded border border-accent/40 text-primary hover:bg-accent/10 transition-colors font-medium"
          >
            {expanded ? 'Collapse' : 'View Details'}
          </button>
          <button
            onClick={printProfile}
            className="text-xs px-3 py-1.5 rounded text-primary-foreground font-medium transition-colors hover:opacity-90"
            style={{ background: '#2D1B69', border: '1px solid #C9A84C' }}
          >
            🖨 Print
          </button>
          <button
            onClick={downloadProfile}
            className="text-xs px-3 py-1.5 rounded text-primary-foreground font-medium transition-colors hover:opacity-90"
            style={{ background: '#1E3A8A', border: '1px solid #C9A84C' }}
          >
            ⬇ Download
          </button>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs px-3 py-1.5 rounded border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors font-medium"
            >
              🗑 Delete
            </button>
          ) : (
            <div className="flex gap-1 items-center">
              <span className="text-xs text-destructive font-medium">Sure?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs px-2 py-1 rounded bg-destructive text-white font-medium hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? '...' : 'Yes'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2 py-1 rounded border border-accent/40 text-primary hover:bg-accent/10"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick info */}
      <div className="px-5 py-3 flex flex-wrap gap-x-4 gap-y-1">
        {fields.slice(0, 6).map(([label, value]) => value ? (
          <span key={label} className="text-xs text-muted-foreground">
            <span className="font-medium text-card-foreground/70">{label}:</span> {value}
          </span>
        ) : null)}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-accent/10 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
            {fields.map(([label, value]) => value ? (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm text-card-foreground font-medium">{value}</p>
              </div>
            ) : null)}
            {profile.address && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm text-card-foreground font-medium">{profile.address}</p>
              </div>
            )}
            {profile.siblings && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Siblings</p>
                <p className="text-sm text-card-foreground font-medium">{profile.siblings}</p>
              </div>
            )}
            {profile.partnerExpectations && (
              <div className="col-span-3">
                <p className="text-xs text-muted-foreground mb-1">Partner Expectations</p>
                <p className="text-sm text-card-foreground leading-relaxed bg-muted rounded-lg px-3 py-2 border border-accent/20">{profile.partnerExpectations}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Message Card ──────────────────────────────────────────────────────────────
function MessageCard({ msg, onMarkRead }: { msg: Message; onMarkRead: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className={`bg-card rounded-xl border shadow-sm overflow-hidden ${msg.read ? 'border-accent/20' : 'border-accent/60'}`}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' as const }}
      layout
    >
      <div className="flex items-center justify-between px-5 py-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {!msg.read && <span className="w-2 h-2 rounded-full bg-accent shrink-0" title="Unread" />}
          <div>
            <p className="font-heading text-primary font-semibold text-sm">{msg.name || 'Anonymous'}</p>
            <p className="text-xs text-muted-foreground">
              {msg.phone && <span>{msg.phone} &nbsp;•&nbsp;</span>}
              {new Date(msg.sentAt).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs px-3 py-1.5 rounded border border-accent/40 text-primary hover:bg-accent/10 transition-colors font-medium"
          >
            {expanded ? 'Hide' : 'Read'}
          </button>
          {!msg.read && (
            <button
              onClick={() => onMarkRead(msg.id)}
              className="text-xs px-3 py-1.5 rounded text-primary-foreground font-medium hover:opacity-90"
              style={{ background: '#2D1B69', border: '1px solid #C9A84C' }}
            >
              Mark Read
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="px-5 pb-4 border-t border-accent/10 pt-3">
          {msg.email && <p className="text-xs text-muted-foreground mb-2">Email: <span className="text-card-foreground">{msg.email}</span></p>}
          <p className="text-sm text-card-foreground leading-relaxed bg-muted rounded-lg px-3 py-2 border border-accent/20 whitespace-pre-wrap">
            {msg.message || <span className="italic text-muted-foreground">No message body.</span>}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'profiles' | 'inbox'>('profiles');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  useEffect(() => {
    if (!sessionStorage.getItem('lnm_admin')) { navigate('/admin'); return; }
    Promise.all([
      fetch('/api/profiles').then(r => r.json()).catch(() => []),
      fetch('/api/messages').then(r => r.json()).catch(() => []),
    ]).then(([p, m]) => {
      setProfiles(p);
      setMessages(m);
      setLoading(false);
    });
  }, [navigate]);

  function logout() {
    sessionStorage.removeItem('lnm_admin');
    navigate('/admin');
  }

  function handleDelete(id: string) {
    setProfiles(prev => prev.filter(p => p.id !== id));
  }

  async function handleMarkRead(id: string) {
    try {
      await fetch(`/api/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
    } catch (_) {}
  }

  const filtered = profiles.filter(p =>
    !search || (p.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.contact1 || '').includes(search)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className="bg-background min-h-screen">
      <title>Admin Dashboard — Lakshmi Narayan Matrimony</title>

      {/* Admin Header */}
      <div className="bg-primary border-b-2 border-accent px-6 py-4 flex items-center justify-between">
        <div>
          <p className="font-heading text-accent font-bold text-lg">Admin Dashboard</p>
          <p className="text-accent/60 text-xs">Lakshmi Narayan Matrimony</p>
        </div>
        <button
          onClick={logout}
          className="text-xs px-4 py-2 rounded border border-accent/40 text-accent hover:bg-primary-foreground/10 transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Profiles', value: profiles.length },
            { label: 'Male', value: profiles.filter(p => p.gender === 'Male').length },
            { label: 'Female', value: profiles.filter(p => p.gender === 'Female').length },
            { label: 'Unread Messages', value: unreadCount },
          ].map((stat, i) => (
            <div key={i} className={`bg-card rounded-xl p-5 border text-center ${i === 3 && unreadCount > 0 ? 'border-accent' : 'border-accent/20'}`}>
              <p className="font-heading text-primary text-3xl font-bold">{stat.value}</p>
              <p className="text-muted-foreground text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1 w-fit">
          {(['profiles', 'inbox'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 capitalize flex items-center gap-2 ${
                tab === t ? 'bg-card text-primary shadow-sm font-semibold' : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {t === 'inbox' ? '📬' : '👤'} {t === 'inbox' ? 'Inbox' : 'Profiles'}
              {t === 'inbox' && unreadCount > 0 && (
                <span className="bg-accent text-primary text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Loading...</div>
        ) : tab === 'profiles' ? (
          <>
            <div className="mb-5">
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name or phone number..."
                className="w-full rounded-lg border border-accent/40 bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
              />
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-sm">{search ? 'No profiles match your search.' : 'No profiles submitted yet.'}</p>
              </div>
            ) : (
              <>
                <AnimatePresence mode="popLayout">
                  <div className="flex flex-col gap-4">
                    {paginated.map((profile, i) => (
                      <ProfileCard key={profile.id} profile={profile} index={i} onDelete={handleDelete} />
                    ))}
                  </div>
                </AnimatePresence>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-accent/40 text-sm font-medium text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent/10 transition-colors"
                    >
                      ← Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors border ${
                          pg === currentPage
                            ? 'text-primary-foreground border-transparent'
                            : 'border-accent/30 text-primary hover:bg-accent/10'
                        }`}
                        style={pg === currentPage ? { background: '#2D1B69', border: '1px solid #C9A84C' } : {}}
                      >
                        {pg}
                      </button>
                    ))}

                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-accent/40 text-sm font-medium text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent/10 transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                )}

                <p className="text-center text-xs text-muted-foreground mt-3">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} profiles
                </p>
              </>
            )}
          </>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-sm">No messages yet. Messages from the Contact Us page will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map(msg => (
                  <MessageCard key={msg.id} msg={msg} onMarkRead={handleMarkRead} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
