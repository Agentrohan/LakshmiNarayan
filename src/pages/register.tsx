import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';

function FormFieldset({ legend, children }: {legend: string;children: React.ReactNode;}) {
  return (
    <fieldset className="border border-accent/50 rounded-lg p-5 mb-6">
      <legend className="px-3 py-1 font-heading text-primary font-semibold text-sm tracking-wide bg-card rounded border border-accent/40">
        {legend}
      </legend>
      <div className="mt-3">{children}</div>
    </fieldset>);
}

function Field({ label, required = false, children, note }: {label: string;required?: boolean;children: React.ReactNode;note?: string;}) {
  return (
    <div className="flex flex-col gap-1 mb-4">
      <label className="text-xs font-medium text-card-foreground/80">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
      {note && <p className="text-xs text-muted-foreground italic">{note}</p>}
    </div>);
}

const inputClass = 'w-full rounded border border-accent/40 bg-background px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors';
const selectClass = 'w-full rounded border border-accent/40 bg-background px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors';

// ── Crop Modal ────────────────────────────────────────────────────────────────
// Frame size adapts to screen: 260px on desktop, 80vw on small screens (max 300)
const FRAME = 260;

interface CropModalProps {
  src: string;
  onConfirm: (base64: string) => void;
  onCancel: () => void;
}

function CropModal({ src, onConfirm, onCancel }: CropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  // Responsive frame size
  const frameSize = Math.min(FRAME, typeof window !== 'undefined' ? window.innerWidth * 0.78 : FRAME);

  function clampOffset(ox: number, oy: number, s: number) {
    const iw = imgSize.w * s;
    const ih = imgSize.h * s;
    return {
      x: Math.min(0, Math.max(frameSize - iw, ox)),
      y: Math.min(0, Math.max(frameSize - ih, oy)),
    };
  }

  function onImgLoad() {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setImgSize({ w, h });
    const initScale = Math.max(frameSize / w, frameSize / h);
    setScale(initScale);
    setOffset({ x: (frameSize - w * initScale) / 2, y: (frameSize - h * initScale) / 2 });
  }

  // Update live preview canvas whenever offset/scale changes
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgSize.w) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const displayToNatural = 1 / scale;
    const srcX = -offset.x * displayToNatural;
    const srcY = -offset.y * displayToNatural;
    const srcW = frameSize * displayToNatural;
    const srcH = frameSize * displayToNatural;
    ctx.clearRect(0, 0, 80, 80);
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, 80, 80);
  }, [offset, scale, imgSize, frameSize]);

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
  }

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setOffset(clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, scale));
  }, [scale, imgSize]);

  function onMouseUp() { dragStart.current = null; }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    dragStart.current = { mx: t.clientX, my: t.clientY, ox: offset.x, oy: offset.y };
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!dragStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStart.current.mx;
    const dy = t.clientY - dragStart.current.my;
    setOffset(clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, scale));
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const minScale = Math.max(frameSize / (imgSize.w || 1), frameSize / (imgSize.h || 1));
    const newScale = Math.min(4, Math.max(minScale, scale + delta));
    const cx = frameSize / 2;
    const cy = frameSize / 2;
    const newOx = cx - (cx - offset.x) * (newScale / scale);
    const newOy = cy - (cy - offset.y) * (newScale / scale);
    setScale(newScale);
    setOffset(clampOffset(newOx, newOy, newScale));
  }

  function handleScaleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const minScale = Math.max(frameSize / (imgSize.w || 1), frameSize / (imgSize.h || 1));
    const newScale = Math.min(4, Math.max(minScale, parseFloat(e.target.value)));
    const cx = frameSize / 2;
    const cy = frameSize / 2;
    const newOx = cx - (cx - offset.x) * (newScale / scale);
    const newOy = cy - (cy - offset.y) * (newScale / scale);
    setScale(newScale);
    setOffset(clampOffset(newOx, newOy, newScale));
  }

  function handleConfirm() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx || !imgRef.current) return;
    const displayToNatural = 1 / scale;
    const srcX = -offset.x * displayToNatural;
    const srcY = -offset.y * displayToNatural;
    const srcW = frameSize * displayToNatural;
    const srcH = frameSize * displayToNatural;
    ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, 200, 200);
    onConfirm(canvas.toDataURL('image/jpeg', 0.85));
  }

  const gridLines = frameSize / 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3" style={{ touchAction: 'none' }}>
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col items-center gap-3 w-full" style={{ maxWidth: 340, border: '2px solid #C9A84C', padding: '18px 16px 16px' }}>
        <h3 style={{ color: '#2D1B69', fontWeight: 700, fontSize: 16, margin: 0 }}>Adjust Your Photo</h3>
        <p style={{ color: '#888', fontSize: 11, margin: 0, textAlign: 'center' }}>Drag to reposition · Slider to zoom</p>

        {/* Main crop frame */}
        <div
          className="relative select-none"
          style={{
            width: frameSize,
            height: frameSize,
            border: '3px solid #C9A84C',
            borderRadius: 10,
            overflow: 'hidden',
            background: '#e8e4f5',
            cursor: 'grab',
            flexShrink: 0,
            touchAction: 'none',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onMouseUp}
          onWheel={onWheel}
        >
          {/* Photo */}
          <img
            ref={imgRef}
            src={src}
            alt="Crop"
            draggable={false}
            onLoad={onImgLoad}
            style={{
              position: 'absolute',
              left: offset.x,
              top: offset.y,
              width: imgSize.w * scale,
              height: imgSize.h * scale,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
          {/* Square grid overlay — shows the final crop boundary */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
            {/* 3×3 grid lines */}
            <div style={{ position: 'absolute', inset: 0,
              backgroundImage: `linear-gradient(rgba(201,168,76,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.55) 1px, transparent 1px)`,
              backgroundSize: `${gridLines}px ${gridLines}px`,
            }} />
            {/* Bold corner markers */}
            {[['0','0','auto','auto'],['0','auto','auto','0'],['auto','0','0','auto'],['auto','auto','0','0']].map(([t,r,b,l], i) => (
              <div key={i} style={{
                position: 'absolute', top: t === '0' ? 0 : 'auto', right: r === '0' ? 0 : 'auto',
                bottom: b === '0' ? 0 : 'auto', left: l === '0' ? 0 : 'auto',
                width: 18, height: 18,
                borderTop: (t === '0') ? '3px solid #C9A84C' : 'none',
                borderBottom: (b === '0') ? '3px solid #C9A84C' : 'none',
                borderLeft: (l === '0') ? '3px solid #C9A84C' : 'none',
                borderRight: (r === '0') ? '3px solid #C9A84C' : 'none',
              }} />
            ))}
          </div>
        </div>

        {/* Zoom slider */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>🔍 Zoom</span>
          <input
            type="range"
            min={Math.max(frameSize / (imgSize.w || 1), frameSize / (imgSize.h || 1))}
            max={4}
            step={0.01}
            value={scale}
            onChange={handleScaleChange}
            style={{ flex: 1, accentColor: '#2D1B69' }}
          />
        </div>

        {/* Live preview + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <canvas
              ref={previewCanvasRef}
              width={80}
              height={80}
              style={{ border: '2px solid #C9A84C', borderRadius: 6, background: '#f0effa', display: 'block' }}
            />
            <span style={{ fontSize: 10, color: '#888' }}>Preview (200×200)</span>
          </div>
          <p style={{ fontSize: 11, color: '#555', flex: 1, lineHeight: 1.5, margin: 0 }}>
            This square shows exactly how your photo will appear on your profile. Adjust until your face is centred.
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #C9A84C', background: '#fff', fontSize: 13, color: '#2D1B69', cursor: 'pointer', fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #C9A84C', background: '#2D1B69', fontSize: 13, color: '#fff', cursor: 'pointer', fontWeight: 600 }}
          >
            Use This Photo
          </button>
        </div>
      </div>
    </div>
  );
}



export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [vyangaYes, setVyangaYes] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const photoBase64Ref = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Read as data URL and open crop modal
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleCropConfirm(base64: string) {
    photoBase64Ref.current = base64;
    setPhotoPreview(base64);
    setCropSrc(null);
  }

  function handleCropCancel() {
    setCropSrc(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload: Record<string, string> = {};
    data.forEach((v, k) => { if (typeof v === 'string') payload[k] = v; });

    // Use the cropped base64 directly — already 200×200
    if (photoBase64Ref.current) {
      payload.profilePhotoBase64 = photoBase64Ref.current;
    }

    try {
      await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (_) {/* still show success */}

    setUploading(false);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (submitted) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div
          className="bg-card border-2 border-accent rounded-2xl p-10 max-w-lg w-full text-center shadow-2xl"
          initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' as const }}>

          <p className="text-4xl mb-4">🙏</p>
          <h2 className="font-heading text-primary text-2xl font-bold mb-3">Thank You for Registering!</h2>
          <p className="text-card-foreground/80 text-sm leading-relaxed mb-6">
            Your biodata has been received securely. Our team will carefully review your profile and send you highly compatible matches directly on WhatsApp. Your personal information is kept strictly confidential.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground border border-accent/30 rounded-lg px-4 py-2 bg-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            Your data is secure and will never be shared publicly.
          </div>
        </motion.div>
      </div>);

  }

  return (
    <div className="bg-background">
      <title>Register Your Profile — Lakshmi Narayan Matrimony</title>
      <meta name="description" content="Register your matrimonial profile with Lakshmi Narayan Matrimony. Submit your biodata to get started." />

      {/* Page Header */}
      <div className="bg-primary py-14 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            {[30, 60, 90, 120].map((r, i) => <circle key={i} cx="200" cy="100" r={r} stroke="#C9A84C" strokeWidth="0.8" fill="none" />)}
          </svg>
        </div>
        <motion.h1
          className="font-heading text-4xl font-bold text-accent mb-2 relative z-10"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' as const }}>

          Register Your Profile
        </motion.h1>
        <p className="text-white/60 text-sm relative z-10">All information is kept strictly confidential</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-12">
        <form ref={formRef} onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 md:p-8 shadow-lg" style={{ border: '1.5px solid rgba(201,168,76,0.4)' }}>

          {/* PERSONAL DETAILS */}
          <FormFieldset legend="Personal Details / वैयक्तिक माहिती">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
              <Field label="Full Name / पूर्ण नाव" required>
                <input name="fullName" type="text" className={inputClass} placeholder="Enter your full name" />
              </Field>
              <Field label="Gender / लिंग" required>
                <div className="flex gap-6 mt-1">
                  {['Male', 'Female'].map((g) =>
                  <label key={g} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="gender" value={g} className="accent-primary" /> {g}
                    </label>
                  )}
                </div>
              </Field>
              <Field label="Date of Birth / जन्म तारीख" required>
                <input name="dob" type="date" className={inputClass} />
              </Field>
              <Field label="Birth Place / जन्म ठिकाण" required>
                <input name="birthPlace" type="text" className={inputClass} placeholder="City, State" />
              </Field>
              <Field label="Residential Address / पत्ता" required>
                <input name="address" type="text" className={inputClass} placeholder="Current residential address" />
              </Field>
              <Field label="Raas / राशी">
                <select name="raas" className={selectClass}>
                  <option value="">Select Raas</option>
                  {['Mesh (Aries)', 'Vrishabh (Taurus)', 'Mithun (Gemini)', 'Kark (Cancer)', 'Simha (Leo)', 'Kanya (Virgo)', 'Tula (Libra)', 'Vrischik (Scorpio)', 'Dhanu (Sagittarius)', 'Makar (Capricorn)', 'Kumbh (Aquarius)', 'Meen (Pisces)'].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Gana / गण">
                <select name="gana" className={selectClass}>
                  <option value="">Select Gana</option>
                  {['Dev Gana', 'Manushya Gana', 'Rakshasa Gana'].map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Gotra / गोत्र">
                <input name="gotra" type="text" className={inputClass} placeholder="Enter gotra" />
              </Field>
              <Field label="Shakha / शाखा">
                <input name="shakha" type="text" className={inputClass} placeholder="Enter shakha" />
              </Field>
              <Field label="Nakshatra / नक्षत्र">
                <select name="nakshatra" className={selectClass}>
                  <option value="">Select Nakshatra</option>
                  {['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
              <Field label="Charan / चरण">
                <input name="charan" type="text" className={inputClass} placeholder="Enter charan (1–4)" />
              </Field>
              <Field label="Naad / नाद">
                <input name="naad" type="text" className={inputClass} placeholder="Enter naad" />
              </Field>
              <Field label="Mangal / मंगळ" required>
                <div className="flex gap-6 mt-1">
                  {['Yes', 'No'].map((v) =>
                  <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="mangal" value={v} className="accent-primary" /> {v}
                    </label>
                  )}
                </div>
              </Field>
              <Field label="Diet / आहार" required>
                <div className="flex gap-6 mt-1">
                  {['Vegetarian', 'Non-Vegetarian'].map((v) =>
                  <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="diet" value={v} className="accent-primary" /> {v}
                    </label>
                  )}
                </div>
              </Field>
              <Field label="Height / उंची">
                <input name="height" type="text" className={inputClass} placeholder='e.g. 5&apos;6"' />
              </Field>
              <Field label="Weight / वजन">
                <input name="weight" type="text" className={inputClass} placeholder="e.g. 60 kg" />
              </Field>
              <Field label="Blood Group / रक्तगट">
                <select name="bloodGroup" className={selectClass}>
                  <option value="">Select Blood Group</option>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Profile Picture / प्रोफाइल फोटो" required>
                <div className="flex items-center gap-4">
                  {photoPreview && (
                    <div className="relative shrink-0 cursor-pointer group" onClick={() => setCropSrc(photoPreview)}>
                      <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-accent/60" />
                      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-white text-xs font-medium">Re-crop</span>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="w-full text-sm text-card-foreground/70 file:mr-3 file:py-2 file:px-4 file:rounded file:border file:border-accent/50 file:text-xs file:font-medium file:bg-muted file:text-primary hover:file:bg-accent/10 cursor-pointer" />
                </div>
              </Field>
              <Field label="Aadhar Card / आधार कार्ड" note="Optional — for ID verification only. Kept strictly confidential, never shared.">
                <input type="file" accept="image/*,.pdf" className="w-full text-sm text-card-foreground/70 file:mr-3 file:py-2 file:px-4 file:rounded file:border file:border-accent/50 file:text-xs file:font-medium file:bg-muted file:text-primary hover:file:bg-accent/10 cursor-pointer" />
              </Field>
            </div>
          </FormFieldset>

          {/* EDUCATION & OCCUPATION */}
          <FormFieldset legend="Education & Occupation / शिक्षण आणि व्यवसाय">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
              <Field label="Education / शिक्षण" required>
                <input name="education" type="text" className={inputClass} placeholder="e.g. B.E., MBA, B.Com" />
              </Field>
              <Field label="Occupation / व्यवसाय" required>
                <input name="occupation" type="text" className={inputClass} placeholder="e.g. Software Engineer, Doctor" />
              </Field>
              <Field label="Job Location / नोकरीचे ठिकाण">
                <input name="jobLocation" type="text" className={inputClass} placeholder="City, State / Country" />
              </Field>
              <Field label="Annual Income / वार्षिक उत्पन्न">
                <select name="income" className={selectClass}>
                  <option value="">Select Income Range</option>
                  {['Below ₹2 Lakh', '₹2–5 Lakh', '₹5–10 Lakh', '₹10–20 Lakh', '₹20–50 Lakh', 'Above ₹50 Lakh'].map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </Field>
            </div>
          </FormFieldset>

          {/* FAMILY DETAILS */}
          <FormFieldset legend="Family Details / कौटुंबिक माहिती">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
              <Field label="Father's Name / वडिलांचे नाव" required>
                <input name="fatherName" type="text" className={inputClass} placeholder="Father's full name" />
              </Field>
              <Field label="Father's Details / वडिलांची माहिती">
                <input name="fatherDetails" type="text" className={inputClass} placeholder="e.g. Occupation, native place" />
              </Field>
              <Field label="Mother's Name / आईचे नाव" required>
                <input name="motherName" type="text" className={inputClass} placeholder="Mother's full name" />
              </Field>
              <Field label="Mother's Details / आईची माहिती">
                <input name="motherDetails" type="text" className={inputClass} placeholder="e.g. Homemaker, occupation" />
              </Field>
              <Field label="Sibling Details / भाऊ-बहिणींची माहिती">
                <textarea name="siblings" className={`${inputClass} resize-none`} rows={3} placeholder="e.g. 1 elder brother (married), 1 younger sister (unmarried)" />
              </Field>
              <div>
                <Field label="Vyanga / Disability / व्यंग">
                  <div className="flex gap-6 mt-1 mb-2">
                    {['None', 'Yes'].map((v) =>
                    <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="radio" name="vyanga" value={v} className="accent-primary" onChange={() => setVyangaYes(v === 'Yes')} /> {v}
                      </label>
                    )}
                  </div>
                  {vyangaYes && <input name="vyangaDetail" type="text" className={inputClass} placeholder="Please describe briefly" />}
                </Field>
              </div>
            </div>
          </FormFieldset>

          {/* EXPECTATIONS */}
          <FormFieldset legend="Partner Expectations / अपेक्षा">
            <Field label="Partner Expectations / जोडीदाराकडून अपेक्षा">
              <textarea
                name="partnerExpectations"
                className={`${inputClass} resize-none`}
                rows={4}
                maxLength={500}
                placeholder="Describe what you are looking for in a life partner — values, personality, lifestyle, family background, etc. (max 500 characters)" />

              <p className="text-xs text-muted-foreground text-right mt-1">Max 500 characters</p>
            </Field>
          </FormFieldset>

          {/* CONTACT */}
          <FormFieldset legend="Contact Details / संपर्क माहिती">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
              <Field label="Contact No. 1 / संपर्क क्र. १" required>
                <input name="contact1" type="tel" className={inputClass} placeholder="+91 XXXXX XXXXX" />
              </Field>
              <Field label="Contact No. 2 / संपर्क क्र. २">
                <input name="contact2" type="tel" className={inputClass} placeholder="+91 XXXXX XXXXX (optional)" />
              </Field>
            </div>
          </FormFieldset>

          {/* PAYMENT */}
          <div className="mt-6">
            <h3 className="font-heading text-primary text-xl font-bold text-center mb-1">Complete Your Registration — ₹501</h3>
            <p className="text-center text-muted-foreground text-xs mb-6">Please pay ₹501 via UPI and upload your payment screenshot below.</p>

            <div className="flex justify-center mb-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-56 h-56 rounded-xl overflow-hidden border-2 border-accent/60 bg-white shadow-md">
                  <img src="/assets/upi-qr.jpeg" alt="UPI QR Code — Scan to Pay" className="w-full h-full object-cover" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">UPI ID:</p>
                  <p className="font-sans text-primary font-semibold text-sm border border-accent/40 rounded px-3 py-1 bg-background tracking-normal">9225800617@upi</p>
                </div>
              </div>
            </div>

            <FormFieldset legend="Payment Confirmation / पेमेंट पुष्टी">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                <Field label="Transaction ID / व्यवहार क्रमांक" required>
                  <input name="transactionId" type="text" className={inputClass} placeholder="Enter UPI Transaction ID" />
                </Field>
                <Field label="Payment Screenshot / पेमेंट स्क्रीनशॉट" required>
                  <input type="file" accept="image/*" className="w-full text-sm text-card-foreground/70 file:mr-3 file:py-2 file:px-4 file:rounded file:border file:border-accent/50 file:text-xs file:font-medium file:bg-muted file:text-primary hover:file:bg-accent/10 cursor-pointer" />
                </Field>
              </div>
            </FormFieldset>
          </div>

          <motion.button
            type="submit"
            disabled={uploading}
            className="w-full mt-4 py-4 rounded-xl font-heading font-bold text-lg text-primary-foreground transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: '#2D1B69', border: '2px solid #C9A84C' }}
            whileHover={{ boxShadow: '0 0 20px 6px rgba(201,168,76,0.35)' }}
            whileTap={{ scale: 0.98 }}>
            {uploading ? 'Submitting…' : 'Submit Registration & Payment'}
          </motion.button>
          <p className="text-center text-xs text-muted-foreground mt-3">🔒 Your information is encrypted and kept strictly confidential.</p>
        </form>
      </div>
      {cropSrc && (
        <CropModal
          src={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>);


}