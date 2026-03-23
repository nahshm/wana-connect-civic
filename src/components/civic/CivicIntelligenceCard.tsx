import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, TrendingUp } from 'lucide-react';

interface CivicIntelligenceCardProps {
  title: string;
  summary?: string | null;
  category?: string | null;
  relevance_score?: number | null;
  source_url?: string | null;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  budget: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  tender: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  scandal: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  promise: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  policy: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  infrastructure: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  official_statement: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  other: 'bg-muted text-muted-foreground',
};

export function CivicIntelligenceCard({
  title,
  summary,
  category,
  relevance_score,
  source_url,
  created_at,
}: CivicIntelligenceCardProps) {
  const cat = category ?? 'other';
  const colorClass = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other;
  const timeAgo = getTimeAgo(created_at);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className={`text-[10px] capitalize ${colorClass}`}>
                {cat.replace('_', ' ')}
              </Badge>
              {relevance_score != null && (
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(relevance_score * 100)}% relevant
                </span>
              )}
              <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo}</span>
            </div>
            <h4 className="text-sm font-medium leading-snug line-clamp-2">{title}</h4>
            {summary && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{summary}</p>
            )}
          </div>
        </div>
        {source_url && (
          <a
            href={source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Source
          </a>
        )}
      </CardContent>
    </Card>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
