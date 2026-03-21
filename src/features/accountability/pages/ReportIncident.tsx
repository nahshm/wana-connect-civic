import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, MapPin, ImageIcon, X, Loader2, ShieldAlert,
  CheckCircle2, Copy, Eye, EyeOff, AlertTriangle, FileText,
  DollarSign, ShieldX, Flame, Zap, Leaf, HardHat, HelpCircle,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = 'input' | 'review' | 'success';
type IncidentType = 'corruption' | 'public_safety' | 'service_failure' | 'rights_violation' | 'environmental' | 'infrastructure' | 'other';
type Severity = 'low' | 'medium' | 'high' | 'critical';

interface PhotoPreview {
  file: File;
  preview: string;
  url?: string;
}

const MAX_PHOTOS = 8;
const MAX_FILE_MB = 15;

// ── Incident type config ──────────────────────────────────────────────────────
const INCIDENT_TYPES: {
  id: IncidentType;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  description: string;
  examples: string;
}[] = [
  {
    id: 'corruption',
    label: 'Corruption / Bribery',
    icon: DollarSign,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    description: 'Bribery, embezzlement, tender fraud',
    examples: 'e.g. Official demanded payment for a government service',
  },
  {
    id: 'public_safety',
    label: 'Public Safety Threat',
    icon: Flame,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    description: 'Immediate threats to physical safety',
    examples: 'e.g. Illegal firearms, gang activity, dangerous structures',
  },
  {
    id: 'service_failure',
    label: 'Service Failure',
    icon: Zap,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    description: 'Gross government service delivery failures',
    examples: 'e.g. Hospital turning away patients, unfair service denial',
  },
  {
    id: 'rights_violation',
    label: 'Rights Violation',
    icon: ShieldX,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
    description: 'Violations of fundamental constitutional rights',
    examples: 'e.g. Unlawful detention, land grabbing, forced eviction',
  },
  {
    id: 'environmental',
    label: 'Environmental',
    icon: Leaf,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    description: 'Environmental crimes and violations',
    examples: 'e.g. Illegal dumping of industrial waste, deforestation',
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure Risk',
    icon: HardHat,
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800',
    description: 'Critical infrastructure failure or safety risk',
    examples: 'e.g. Unstable bridge, failing dam, collapsed building',
  },
  {
    id: 'other',
    label: 'Other Incident',
    icon: HelpCircle,
    color: 'text-muted-foreground',
    bg: 'bg-muted/30 border-border',
    description: 'Any serious incident not covered above',
    examples: 'Describe your incident in detail below',
  },
];

const SEVERITY_OPTIONS: { id: Severity; label: string; description: string; color: string }[] = [
  { id: 'low', label: 'Low', description: 'Concerning but not urgent', color: 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400' },
  { id: 'medium', label: 'Medium', description: 'Needs resolution within days', color: 'border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400' },
  { id: 'high', label: 'High', description: 'Urgent — potential harm imminent', color: 'border-orange-400 text-orange-600 dark:border-orange-700 dark:text-orange-400' },
  { id: 'critical', label: 'Critical', description: 'Immediate danger — emergency level', color: 'border-red-500 text-red-600 dark:border-red-700 dark:text-red-400' },
];

const STEPS = ['Report Details', 'Review & Submit', 'Reported'];

const StepBar = ({ current }: { current: Step }) => {
  const idx: Record<Step, number> = { input: 0, review: 1, success: 2 };
  const i = idx[current];
  return (
    <div className="mb-8">
      <div className="flex gap-2">
        {STEPS.map((s, j) => (
          <div key={s} className="flex-1 space-y-2">
            <div className={`h-1.5 rounded-full transition-all duration-500 ${
              j <= i
                ? 'bg-rose-600 dark:bg-rose-500 shadow-[0_0_8px_rgba(220,38,38,0.4)]'
                : 'bg-slate-200 dark:bg-slate-800'
            }`} />
            <p className={`text-[10px] font-bold uppercase tracking-wider ${
              j <= i ? 'text-rose-700 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
            }`}>{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const ReportIncident = () => {
  const { user } = useAuth();
  const authModal = useAuthModal();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('input');
  const [incidentType, setIncidentType] = useState<IncidentType | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [locationText, setLocationText] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [severity, setSeverity] = useState<Severity>('medium');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [agencyNotified, setAgencyNotified] = useState(false);
  const [agencyName, setAgencyName] = useState('');
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [caseNumber, setCaseNumber] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setLocationCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
    );
    // Revoke all blob URLs on unmount to prevent memory leaks
    return () => { photos.forEach(p => URL.revokeObjectURL(p.preview)); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - photos.length;
    const allowed = files.slice(0, remaining);
    const oversized = allowed.filter(f => f.size > MAX_FILE_MB * 1024 * 1024);
    if (oversized.length) {
      toast({ title: 'File too large', description: `Max ${MAX_FILE_MB}MB per file.`, variant: 'destructive' });
      return;
    }
    setPhotos(prev => [...prev, ...allowed.map(file => ({ file, preview: URL.createObjectURL(file) }))]);
    e.target.value = '';
  }, [photos.length, toast]);

  const removePhoto = (i: number) => {
    setPhotos(prev => { URL.revokeObjectURL(prev[i].preview); return prev.filter((_, j) => j !== i); });
  };

  const uploadMedia = async (): Promise<string[]> => {
    if (!photos.length) return [];
    const urls: string[] = [];
    for (const p of photos) {
      if (p.url) { urls.push(p.url); continue; }
      const ext = p.file.name.split('.').pop() || 'jpg';
      const isAnon = isAnonymous;
      const path = `${isAnon ? 'anon' : (user?.id ?? 'unknown')}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('incident-media').upload(path, p.file);
      if (error) throw new Error(`Upload failed: ${error.message}`);
      const { data: { publicUrl } } = supabase.storage.from('incident-media').getPublicUrl(path);
      urls.push(publicUrl);
    }
    return urls;
  };

  const handleProceedToReview = () => {
    if (!user && !isAnonymous) { authModal.open('login'); return; }
    if (!incidentType) {
      toast({ title: 'Required', description: 'Please select an incident type.', variant: 'destructive' });
      return;
    }
    if (!title.trim() || !description.trim()) {
      toast({ title: 'Required', description: 'Title and description are required.', variant: 'destructive' });
      return;
    }
    setStep('review');
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    try {
      const mediaUrls = await uploadMedia();

      // Get profile for county/constituency/ward
      let county: string | null = null;
      let constituency: string | null = null;
      let ward: string | null = null;

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('county, constituency, ward')
          .eq('id', user.id)
          .single();
        const p = profile as { county?: string; constituency?: string; ward?: string } | null;
        county = p?.county ?? null;
        constituency = p?.constituency ?? null;
        ward = p?.ward ?? null;
      }

      const { data, error } = await supabase.from('incidents').insert({
        reporter_id: isAnonymous ? null : (user?.id ?? null),
        is_anonymous: isAnonymous,
        incident_type: incidentType,
        title: title.trim().slice(0, 200),
        description: description.trim(),
        evidence_notes: evidenceNotes.trim() || null,
        location_text: locationText.trim() || null,
        latitude: locationCoords?.lat ?? null,
        longitude: locationCoords?.lng ?? null,
        county,
        constituency,
        ward,
        severity,
        is_public: isPublic,
        media_urls: mediaUrls.length ? mediaUrls : null,
        agency_notified: agencyNotified,
        agency_name: agencyNotified && agencyName.trim() ? agencyName.trim() : null,
        status: 'open',
      }).select('case_number').single();

      if (error) throw error;

      setCaseNumber(data.case_number);
      setStep('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed.';
      toast({ title: 'Submission Failed', description: msg, variant: 'destructive' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const reset = () => {
    setStep('input'); setIncidentType(''); setTitle(''); setDescription('');
    setEvidenceNotes(''); setLocationText(''); setPhotos([]); setSeverity('medium');
    setIsAnonymous(false); setIsPublic(true); setAgencyNotified(false); setAgencyName('');
    setCaseNumber('');
  };

  const selectedType = INCIDENT_TYPES.find(t => t.id === incidentType);

  return (
    <div className="container mx-auto px-4 sm:px-8 py-6 sm:py-10 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" className="gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white -ml-2" onClick={() => step === 'review' ? setStep('input') : navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{step === 'review' ? 'Back to Edit' : 'Back'}</span>
        </Button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">Report an Incident</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Serious civic incidents requiring escalation</p>
        </div>
        <div className="w-20" />
      </div>

      {/* Callout */}
      {step === 'input' && (
        <div className="mb-6 p-4 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-900 dark:text-rose-300 mb-0.5">Incident Reports are different from Issue Reports</p>
            <p className="text-xs text-rose-800/70 dark:text-rose-400/70 leading-relaxed">
              Use this form for serious civic incidents: corruption, rights violations, public safety threats, or service failures — not for everyday infrastructure complaints.
              For potholes, water pipes, or garbage, <button onClick={() => navigate('/report-an-issue')} className="underline font-semibold hover:text-rose-900">Report an Issue instead</button>.
            </p>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white dark:bg-[#0B1120] rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200/60 dark:border-slate-800/60 p-6 sm:p-10 mb-12 relative overflow-hidden">
        <StepBar current={step} />

        <div className="relative z-10">
          {/* ── Step 1: Input ── */}
          {step === 'input' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
              {/* Incident type selection */}
              <div className="space-y-3">
                <Label className="text-base font-black text-slate-900 dark:text-slate-100">Incident Type *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {INCIDENT_TYPES.map(type => {
                    const Icon = type.icon;
                    const isSelected = incidentType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setIncidentType(type.id)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                          isSelected ? `${type.bg} border-2` : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-1">
                          <Icon className={`w-5 h-5 ${isSelected ? type.color : 'text-slate-400'}`} />
                          <span className={`font-bold text-sm ${isSelected ? type.color : 'text-slate-700 dark:text-slate-200'}`}>{type.label}</span>
                          {isSelected && <CheckCircle2 className={`w-4 h-4 ml-auto ${type.color}`} />}
                        </div>
                        <p className="text-xs text-muted-foreground leading-snug">{type.examples}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Severity */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Severity Level *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SEVERITY_OPTIONS.map(sev => (
                    <button
                      key={sev.id}
                      type="button"
                      onClick={() => setSeverity(sev.id)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        severity === sev.id
                          ? `${sev.color} bg-opacity-10`
                          : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      } ${severity === sev.id ? 'font-black' : 'font-semibold'}`}
                    >
                      <p className="text-sm">{sev.label}</p>
                      <p className="text-[10px] mt-0.5 opacity-70 leading-tight">{sev.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Incident Title *</Label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Brief, factual title of the incident"
                  maxLength={200}
                  className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-base font-black text-slate-900 dark:text-slate-100">Incident Description *</Label>
                <Textarea
                  rows={6}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe exactly what happened, when, who was involved, and the impact. Be as specific and factual as possible."
                  className="resize-none rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-5 text-base shadow-inner"
                />
                <p className="text-xs text-slate-400 text-right">{description.length} chars</p>
              </div>

              {/* Evidence notes */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Witness Statements / Document References
                  <span className="font-normal text-slate-400 ml-1">(optional)</span>
                </Label>
                <Textarea
                  rows={3}
                  value={evidenceNotes}
                  onChange={e => setEvidenceNotes(e.target.value)}
                  placeholder="Names of witnesses (with permission), reference numbers, official document titles, dates..."
                  className="resize-none rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 text-sm"
                />
              </div>

              {/* Location */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Location</Label>
                  <Input
                    value={locationText}
                    onChange={e => setLocationText(e.target.value)}
                    placeholder="Where did this happen?"
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      navigator.geolocation?.getCurrentPosition(
                        pos => {
                          setLocationCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                          toast({ title: '📍 GPS location captured' });
                        },
                        () => toast({ title: 'Location unavailable', variant: 'destructive' }),
                      );
                    }}
                    className={`h-12 rounded-xl gap-2 font-semibold border-slate-200 dark:border-slate-800 transition-all ${
                      locationCoords
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                        : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    {locationCoords ? '✓ GPS Captured' : 'Use Device GPS'}
                  </Button>
                </div>
              </div>

              {/* Photo upload */}
              <div className="space-y-3 p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                <div className="flex justify-between items-end">
                  <Label className="text-sm font-bold text-slate-800 dark:text-slate-200">Evidence Media</Label>
                  <span className="text-xs font-semibold text-slate-500">{photos.length}/{MAX_PHOTOS}</span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {photos.map((p, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group shadow-sm">
                      <img src={p.preview} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button type="button"
                        className="absolute top-1.5 right-1.5 bg-white/90 dark:bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(i)}
                      ><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                  {photos.length < MAX_PHOTOS && (
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all text-slate-400 hover:text-rose-500" onClick={() => fileInputRef.current?.click()}>
                      <ImageIcon className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-semibold">Add</span>
                    </label>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" multiple className="hidden" onChange={handleFilePick} />
                </div>
                <p className="text-xs text-slate-400">Photos, screenshots, or documents (max {MAX_FILE_MB}MB each). Handle with care — do not upload materials that could put you at risk.</p>
              </div>

              {/* Privacy & anonymity */}
              <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Privacy Options</p>

                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`relative mt-0.5 w-10 h-6 rounded-full transition-colors shrink-0 ${isAnonymous ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isAnonymous ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      {isAnonymous ? <EyeOff className="w-4 h-4 text-rose-500" /> : <Eye className="w-4 h-4 text-slate-400" />}
                      {isAnonymous ? 'Anonymous Submission' : 'Submit under my name'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isAnonymous
                        ? 'Your identity will NOT be stored. Anonymous reports receive lower priority for follow-up.'
                        : 'Your user account will be linked. This allows official responses to be sent to you.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative mt-0.5 w-10 h-6 rounded-full transition-colors shrink-0 ${isPublic ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      {isPublic ? <Eye className="w-4 h-4 text-blue-500" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                      {isPublic ? 'Public — visible on the platform' : 'Private — admin eyes only'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isPublic ? 'Other citizens can see this incident (your identity is still protected by the anonymity setting above).' : 'Only platform admins can see this report.'}
                    </p>
                  </div>
                </div>

                {/* Agency notification */}
                <div className="flex items-start gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAgencyNotified(!agencyNotified)}
                    className={`relative mt-0.5 w-10 h-6 rounded-full transition-colors shrink-0 ${agencyNotified ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${agencyNotified ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">I have already notified an agency</p>
                    {agencyNotified && (
                      <Input
                        value={agencyName}
                        onChange={e => setAgencyName(e.target.value)}
                        placeholder="e.g. EACC, DCI, IPOA, NEMA, KNCHR"
                        className="mt-2 h-10 rounded-xl text-sm"
                      />
                    )}
                  </div>
                </div>
              </div>

              <Button
                className="w-full h-14 rounded-xl font-bold text-base bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25 transition-all gap-2"
                onClick={handleProceedToReview}
                disabled={!incidentType || !title.trim() || !description.trim()}
              >
                <FileText className="w-5 h-5" />Review Before Submitting
              </Button>
            </div>
          )}

          {/* ── Step 2: Review ── */}
          {step === 'review' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl">
                <p className="text-sm font-bold text-amber-900 dark:text-amber-300 mb-1">Review your incident report</p>
                <p className="text-xs text-amber-800/70 dark:text-amber-400/70">Please verify all details are accurate before submitting. False reports may be subject to Kenya law.</p>
              </div>

              <div className="space-y-4 divide-y divide-slate-200 dark:divide-slate-800">
                <div className="py-3 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground mb-1">Type</p><p className="font-semibold capitalize">{selectedType?.label}</p></div>
                  <div><p className="text-xs text-muted-foreground mb-1">Severity</p><p className="font-semibold capitalize">{severity}</p></div>
                  <div className="col-span-2"><p className="text-xs text-muted-foreground mb-1">Title</p><p className="font-semibold">{title}</p></div>
                  <div className="col-span-2"><p className="text-xs text-muted-foreground mb-1">Description</p><p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{description}</p></div>
                  {evidenceNotes && <div className="col-span-2"><p className="text-xs text-muted-foreground mb-1">Evidence Notes</p><p className="text-sm text-slate-700 dark:text-slate-300">{evidenceNotes}</p></div>}
                  {locationText && <div><p className="text-xs text-muted-foreground mb-1">Location</p><p className="font-semibold">{locationText}</p></div>}
                  {locationCoords && <div><p className="text-xs text-muted-foreground mb-1">GPS</p><p className="font-mono text-xs">{locationCoords.lat.toFixed(5)}, {locationCoords.lng.toFixed(5)}</p></div>}
                  <div><p className="text-xs text-muted-foreground mb-1">Identity</p><p className="font-semibold">{isAnonymous ? '🕶 Anonymous' : '👤 Under my name'}</p></div>
                  <div><p className="text-xs text-muted-foreground mb-1">Visibility</p><p className="font-semibold">{isPublic ? '🌐 Public' : '🔒 Private'}</p></div>
                  {agencyNotified && agencyName && <div className="col-span-2"><p className="text-xs text-muted-foreground mb-1">Agency Already Notified</p><p className="font-semibold">{agencyName}</p></div>}
                  <div className="col-span-2"><p className="text-xs text-muted-foreground mb-1">Evidence Photos</p><p className="font-semibold">{photos.length ? `${photos.length} attached` : 'None'}</p></div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('input')} className="h-12 sm:w-1/3 rounded-xl font-bold">Edit</Button>
                <Button
                  className="flex-1 h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2 shadow-lg shadow-rose-600/25 transition-all"
                  onClick={handleSubmit}
                  disabled={submitLoading}
                >
                  {submitLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Submitting…</> : <><ShieldAlert className="w-5 h-5" />Submit Incident Report</>}
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 'success' && caseNumber && (
            <div className="text-center py-8 space-y-8 animate-in zoom-in-95 fade-in duration-500">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 bg-rose-100 dark:bg-rose-900/30 rounded-full animate-ping opacity-75" />
                <div className="relative w-full h-full bg-rose-100 dark:bg-rose-900/50 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-950 shadow-xl">
                  <ShieldAlert className="w-12 h-12 text-rose-600 dark:text-rose-400" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Incident Reported</h2>
                <p className="text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed font-medium">
                  Your incident has been recorded and will be reviewed by our moderation team.
                  {!isAnonymous && ' You will be notified of any updates.'}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-left max-w-sm mx-auto shadow-sm">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Reference Number</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-mono font-black text-slate-900 dark:text-white">{caseNumber}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(caseNumber); toast({ title: 'Copied!' }); }}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
                  >
                    <Copy className="w-4 h-4" />Copy
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-3">Save this reference number — you can use it to follow up with the platform or relevant authorities.</p>
              </div>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={reset} className="h-12 rounded-xl font-bold">Report Another</Button>
                <Button onClick={() => navigate('/dashboard')} className="h-12 rounded-xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900">Go to Dashboard</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportIncident;
