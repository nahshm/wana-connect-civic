import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { supabase } from '@/integrations/supabase/client';
import { aiClient, RoutingResult } from '@/services/aiClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, MapPin, ImageIcon, X, Loader2, Sparkles,
  Building2, CheckCircle2, Copy, Send, FileText,
  ShieldCheck, Landmark, AlertTriangle, ExternalLink,
  Droplet, Car, Trash2, Lightbulb, Shield, Home,
  Building,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = 'input' | 'routing' | 'letter' | 'success';

interface SubmissionResult {
  caseNumber: string;
  departmentName: string;
}

interface PhotoPreview {
  file: File;
  preview: string;
  url?: string;
}

const MAX_PHOTOS = 5;
const MAX_FILE_MB = 10;

// ── Issue Category config ─────────────────────────────────────────────────────
const ISSUE_CATEGORIES = [
  { id: 'water', label: 'Water & Sanitation', icon: Droplet, color: 'bg-blue-500', description: 'Burst pipes, water outages, sewage' },
  { id: 'roads', label: 'Roads & Transport', icon: Car, color: 'bg-slate-500', description: 'Potholes, damaged roads, traffic issues' },
  { id: 'garbage', label: 'Waste & Garbage', icon: Trash2, color: 'bg-green-600', description: 'Uncollected refuse, dumping sites' },
  { id: 'street_lights', label: 'Street Lighting', icon: Lightbulb, color: 'bg-yellow-500', description: 'Non-functional lights, safety concerns' },
  { id: 'security', label: 'Security', icon: Shield, color: 'bg-red-500', description: 'Crime, public safety breakdowns' },
  { id: 'housing', label: 'Housing & Planning', icon: Home, color: 'bg-purple-500', description: 'Illegal structures, planning violations' },
  { id: 'health', label: 'Health Services', icon: Building, color: 'bg-pink-500', description: 'Clinic closures, drug shortages' },
  { id: 'other', label: 'Other', icon: AlertTriangle, color: 'bg-slate-400', description: 'Any other civic issue' },
];

// ── Step progress bar ─────────────────────────────────────────────────────────
const STEPS = ['Describe', 'AI Analysis', 'Formal Letter', 'Submitted'];
const stepIndex: Record<Step, number> = { input: 0, routing: 1, letter: 2, success: 3 };

const StepBar = ({ current }: { current: Step }) => {
  const idx = stepIndex[current];
  return (
    <div className="mb-8">
      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 space-y-2">
            <div className={`h-1.5 rounded-full transition-all duration-500 ${
              i <= idx
                ? 'bg-blue-600 dark:bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                : 'bg-slate-200 dark:bg-slate-800'
            }`} />
            <p className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
              i <= idx ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
            }`}>{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const ReportIssue = () => {
  const { user } = useAuth();
  const authModal = useAuthModal();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('input');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [routing, setRouting] = useState<RoutingResult | null>(null);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [formalLetter, setFormalLetter] = useState('');
  const [letterEditable, setLetterEditable] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke all blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => { photos.forEach(p => URL.revokeObjectURL(p.preview)); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Silent GPS capture on mount
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setLocationCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
    );
  }, []);

  const handleFilePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - photos.length;
    const allowed = files.slice(0, remaining);
    const oversized = allowed.filter(f => f.size > MAX_FILE_MB * 1024 * 1024);
    if (oversized.length) {
      toast({ title: 'File too large', description: `Max ${MAX_FILE_MB}MB per image.`, variant: 'destructive' });
      return;
    }
    setPhotos(prev => [...prev, ...allowed.map(file => ({ file, preview: URL.createObjectURL(file) }))]);
    e.target.value = '';
  }, [photos.length, toast]);

  const removePhoto = (i: number) => {
    setPhotos(prev => { URL.revokeObjectURL(prev[i].preview); return prev.filter((_, j) => j !== i); });
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (!user || photos.length === 0) return [];
    const urls: string[] = [];
    for (const p of photos) {
      if (p.url) { urls.push(p.url); continue; }
      const ext = p.file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('issue-media').upload(path, p.file);
      if (error) throw new Error(`Upload failed: ${error.message}`);
      const { data: { publicUrl } } = supabase.storage.from('issue-media').getPublicUrl(path);
      urls.push(publicUrl);
    }
    return urls;
  };

  const handleAnalyze = async () => {
    if (!user) { authModal.open('login'); return; }
    if (!description.trim()) {
      toast({ title: 'Required', description: 'Please describe the issue first.', variant: 'destructive' });
      return;
    }
    setRoutingLoading(true);
    try {
      const profileRes = await supabase
        .from('profiles')
        .select('ward, constituency, county')
        .eq('id', user.id)
        .single();
      const profile = profileRes.data as { ward?: string; constituency?: string; county?: string } | null;
      const locationCtx = {
        lat: locationCoords?.lat,
        lng: locationCoords?.lng,
        text: locationText,
        ward: profile?.ward,
        constituency: profile?.constituency,
        county: profile?.county || 'Nairobi',
      };

      const result = await aiClient.routing(description, locationCtx, []);
      setRouting(result);
      setStep('routing');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI routing failed.';
      toast({ title: 'AI Routing Failed', description: msg, variant: 'destructive' });
    } finally {
      setRoutingLoading(false);
    }
  };

  const handleGenerateLetter = () => {
    if (!routing) return;
    setFormalLetter(routing.formal_letter || '');
    setStep('letter');
  };

  const handleSubmit = async () => {
    if (!user || !routing) return;
    setSubmitLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    try {
      const mediaUrls = await uploadPhotos();

      const { data: action, error } = await db
        .from('civic_actions')
        .insert({
          user_id: user.id,
          action_type: 'report_issue',
          title: description.substring(0, 120),
          description,
          location_text: locationText || null,
          latitude: locationCoords?.lat ?? null,
          longitude: locationCoords?.lng ?? null,
          category: selectedCategory || routing.issue_type,
          action_level: routing.jurisdiction,
          urgency: routing.severity >= 7 ? 'high' : routing.severity >= 4 ? 'medium' : 'low',
          is_public: true,
          media_urls: mediaUrls.length ? mediaUrls : null,
          assigned_to: null,
        })
        .select('id, case_number')
        .single();

      if (error) throw error;

      if (routing.institution_id) {
        await db.rpc('route_issue_to_institution', {
          p_action_id: action.id,
          p_institution_id: routing.institution_id,
          p_formal_letter: formalLetter || null,
        }).catch(console.error);
      }

      setResult({
        caseNumber: action.case_number,
        departmentName: routing.institution_name || routing.department_name || 'Relevant Authority',
      });
      setStep('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed.';
      toast({ title: 'Submission Failed', description: msg, variant: 'destructive' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const reset = () => {
    setStep('input'); setDescription(''); setLocationText('');
    setPhotos([]); setRouting(null); setFormalLetter(''); setResult(null); setSelectedCategory('');
  };

  return (
    <div className="container mx-auto px-4 sm:px-8 py-6 sm:py-10 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" className="gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white -ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">Report an Issue</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">AI-powered civic routing</p>
        </div>
        {/* Report Incident CTA */}
        <Button
          size="sm"
          variant="outline"
          className="hidden sm:flex gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30"
          onClick={() => navigate('/report-incident')}
        >
          <AlertTriangle className="w-3.5 h-3.5" />Report Incident
        </Button>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-[#0B1120] rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200/60 dark:border-slate-800/60 p-6 sm:p-10 mb-12 relative overflow-hidden">
        <StepBar current={step} />

        <div className="relative z-10">
          {/* ── Step 1: Input ── */}
          {step === 'input' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              {/* Category grid */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Issue Category</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ISSUE_CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 text-center transition-all text-xs font-semibold ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className={`${cat.color} text-white p-1.5 rounded-lg`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="leading-tight">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-base font-black text-slate-900 dark:text-slate-100">Describe the Issue *</Label>
                <Textarea
                  rows={5}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What is happening? e.g., There is a burst sewage pipe near the market entrance that has been leaking for 3 days..."
                  disabled={routingLoading}
                  className="resize-none rounded-2xl border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 bg-slate-50 dark:bg-slate-900/50 p-5 text-base shadow-inner"
                />
                <p className="text-xs text-slate-400 text-right">{description.length} chars</p>
              </div>

              {/* Location */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Location</Label>
                  <Input
                    value={locationText}
                    onChange={e => setLocationText(e.target.value)}
                    placeholder="Landmark, street, or area"
                    disabled={routingLoading}
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={routingLoading}
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
                        : 'bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
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
                  <Label className="text-sm font-bold text-slate-800 dark:text-slate-200">Evidence Photos</Label>
                  <span className="text-xs font-semibold text-slate-500">{photos.length}/{MAX_PHOTOS}</span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {photos.map((p, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group shadow-sm">
                      <img src={p.preview} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button
                        type="button"
                        className="absolute top-1.5 right-1.5 bg-white/90 dark:bg-black/70 text-slate-800 dark:text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                        onClick={() => removePhoto(i)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length < MAX_PHOTOS && (
                    <label
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all text-slate-400 hover:text-blue-500"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-semibold">Add</span>
                    </label>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple className="hidden" onChange={handleFilePick} />
                </div>
                <p className="text-xs text-slate-400">Clear photos help AI route your issue to the right department.</p>
              </div>

              <Button
                className="w-full h-14 rounded-xl font-bold text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all gap-2"
                onClick={handleAnalyze}
                disabled={routingLoading || !description.trim()}
              >
                {routingLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Routing Intelligence Processing…</> : <><Sparkles className="w-5 h-5" />Analyze &amp; Route Issue</>}
              </Button>
            </div>
          )}

          {/* ── Step 2: AI Routing Result ── */}
          {step === 'routing' && routing && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              {/* Constitutional rationale */}
              <div className="bg-[#f0f7ff] dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/50 rounded-2xl p-5 flex items-start gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-2.5 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-black text-blue-900 dark:text-blue-300 mb-1.5">Constitutional Routing</p>
                  <p className="text-sm text-blue-800/80 dark:text-blue-400/80 leading-relaxed font-medium">
                    Under the Fourth Schedule of the Kenyan Constitution 2010, the provision of{' '}
                    <strong className="text-blue-900 dark:text-blue-300">{routing.issue_type.replace(/_/g, ' ')}</strong>{' '}
                    falls under the <strong className="capitalize text-blue-900 dark:text-blue-300">{routing.jurisdiction} Government</strong>.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-sm">
                  <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <Landmark className="w-4 h-4 text-blue-500" />Jurisdiction
                  </p>
                  <p className="text-xl font-black text-slate-900 dark:text-white capitalize">{routing.jurisdiction} Gov.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-sm">
                  <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-blue-500" />Responsible Dept.
                  </p>
                  <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{routing.department_name}</p>
                </div>
              </div>

              {/* Severity bar */}
              <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <AlertTriangle className={`w-5 h-5 ${routing.severity >= 7 ? 'text-rose-500' : routing.severity >= 4 ? 'text-amber-500' : 'text-emerald-500'}`} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-end">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Severity Assessment</p>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{routing.severity}/10</p>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${routing.severity >= 7 ? 'bg-rose-500' : routing.severity >= 4 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${routing.severity * 10}%` }}
                    />
                  </div>
                </div>
                <div className="text-right hidden sm:block shrink-0 border-l border-slate-200 dark:border-slate-800 pl-4">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Resolution SLA</p>
                  <p className="text-sm font-black text-slate-900 dark:text-slate-200">{routing.estimated_resolution_days || 14} Days</p>
                </div>
              </div>

              <p className="text-xs text-center font-medium text-slate-400">AI Confidence: {Math.round(routing.confidence * 100)}%</p>

              {routing.institution_name && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm">
                  <p className="text-xs text-slate-500 font-medium mb-1">To: <strong className="text-slate-900 dark:text-slate-200">{routing.institution_name}{routing.institution_acronym ? ` (${routing.institution_acronym})` : ''}</strong></p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {routing.institution_email && <a href={`mailto:${routing.institution_email}`} className="text-xs text-blue-500 hover:underline">{routing.institution_email}</a>}
                    {routing.institution_website && <a href={routing.institution_website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />Website</a>}
                    {routing.institution_phone && <span className="text-xs text-slate-500">{routing.institution_phone}</span>}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('input')} className="h-12 sm:w-1/3 rounded-xl font-bold">Edit Details</Button>
                <Button className="flex-1 h-12 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold gap-2" onClick={handleGenerateLetter} disabled={!routing}>
                  <FileText className="w-5 h-5" />Generate Formal Letter
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Review Letter ── */}
          {step === 'letter' && routing && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-bold">Ready for official submission</span>
                </div>
              </div>

              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/40 shadow-inner overflow-hidden">
                <div className="absolute top-6 right-6 text-slate-200 dark:text-slate-800/50 pointer-events-none">
                  <FileText className="w-32 h-32 opacity-50" strokeWidth={0.5} />
                </div>
                <div className="relative z-10 p-6 sm:p-8">
                  {letterEditable ? (
                    <Textarea rows={14} value={formalLetter} onChange={e => setFormalLetter(e.target.value)}
                      className="font-serif text-sm leading-loose resize-none border-0 bg-white dark:bg-slate-950 rounded-xl shadow-sm p-5" />
                  ) : (
                    <div className="font-serif text-sm leading-loose whitespace-pre-wrap max-h-96 overflow-y-auto text-slate-800 dark:text-slate-300 pr-4">
                      {formalLetter}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-4 right-4 z-20">
                  <button
                    type="button"
                    onClick={() => setLetterEditable(!letterEditable)}
                    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-white transition-colors"
                  >
                    {letterEditable ? 'Done Editing' : 'Click to Edit'}
                  </button>
                </div>
              </div>

              {photos.length > 0 && (
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{photos.length} evidence photo{photos.length > 1 ? 's' : ''} attached</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('routing')} className="h-12 sm:w-1/3 rounded-xl font-bold">Back</Button>
                <Button className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-lg shadow-blue-600/25 transition-all" onClick={handleSubmit} disabled={submitLoading}>
                  {submitLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Submitting…</> : <><Send className="w-5 h-5" />Submit to {routing.jurisdiction === 'national' ? 'National' : 'County'}</>}
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 4: Success ── */}
          {step === 'success' && result && (
            <div className="text-center py-8 space-y-8 animate-in zoom-in-95 fade-in duration-500">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/30 rounded-full animate-ping opacity-75" />
                <div className="relative w-full h-full bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-950 shadow-xl">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Issue Submitted!</h2>
                <p className="text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed font-medium">
                  Formally logged and routed to the <strong className="text-slate-900 dark:text-slate-200">{result.departmentName}</strong>.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-left max-w-sm mx-auto shadow-sm">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tracking ID</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-mono font-black text-slate-900 dark:text-white">{result.caseNumber}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(result.caseNumber); toast({ title: 'Copied!' }); }}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
                  >
                    <Copy className="w-4 h-4" />Copy
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" style={{ width: '5%' }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">Pending Review — check back in 24-48 hours</p>
                </div>
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

export default ReportIssue;
