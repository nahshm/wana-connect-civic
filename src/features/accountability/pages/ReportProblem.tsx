import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wrench, ShieldAlert, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import PageMeta from '@/components/seo/PageMeta';

const ReportIssue = lazy(() => import('./ReportIssue'));
const ReportIncident = lazy(() => import('./ReportIncident'));

export type ReportKind = 'issue' | 'incident';
export const parseReportKind = (v: string | null): ReportKind => (v === 'incident' ? 'incident' : 'issue');

const OPTIONS: { kind: ReportKind; title: string; hint: string; icon: typeof Wrench }[] = [
  { kind: 'issue', title: 'Everyday problem', hint: 'Roads, water, garbage, street lights — sent to the right office.', icon: Wrench },
  { kind: 'incident', title: 'Serious incident', hint: 'Corruption, safety, rights abuse. You can stay anonymous and set how urgent it is.', icon: ShieldAlert },
];

/** Single "Report a Problem" entry: one page, one choice, then the matching form. */
export default function ReportProblem() {
  const [params, setParams] = useSearchParams();
  const kind = parseReportKind(params.get('type'));
  return (
    <div className="max-w-3xl mx-auto px-4 pt-6">
      <PageMeta title="Report a problem" description="Report a local problem or a serious incident and track it to resolution." />
      <h1 className="text-2xl font-black tracking-tight mb-1">Report a problem</h1>
      <p className="text-sm text-muted-foreground mb-4">What kind of problem is it?</p>
      <div role="radiogroup" className="grid sm:grid-cols-2 gap-3 mb-2">
        {OPTIONS.map(o => (
          <button key={o.kind} role="radio" aria-checked={kind === o.kind}
            onClick={() => setParams({ type: o.kind }, { replace: true })}
            className={cn('text-left rounded-xl border p-4 transition-colors flex gap-3',
              kind === o.kind ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50')}>
            <o.icon className={cn('w-5 h-5 shrink-0 mt-0.5', kind === o.kind ? 'text-primary' : 'text-muted-foreground')} />
            <span><span className="block font-semibold">{o.title}</span><span className="block text-xs text-muted-foreground">{o.hint}</span></span>
          </button>
        ))}
      </div>
      <Suspense fallback={<div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}>
        {kind === 'incident' ? <ReportIncident /> : <ReportIssue />}
      </Suspense>
    </div>
  );
}
