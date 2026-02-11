// Shared constants for office governance features

export const PROMISE_CATEGORIES = [
    { value: 'infrastructure', label: '🏗️ Infrastructure', color: 'bg-orange-500/10 text-orange-700' },
    { value: 'education', label: '📚 Education', color: 'bg-blue-500/10 text-blue-700' },
    { value: 'healthcare', label: '🏥 Healthcare', color: 'bg-red-500/10 text-red-700' },
    { value: 'security', label: '🛡️ Security', color: 'bg-slate-500/10 text-slate-700' },
    { value: 'environment', label: '🌿 Environment', color: 'bg-green-500/10 text-green-700' },
    { value: 'economy', label: '💰 Economy & Jobs', color: 'bg-yellow-500/10 text-yellow-700' },
    { value: 'governance', label: '⚖️ Governance', color: 'bg-purple-500/10 text-purple-700' },
    { value: 'social', label: '🤝 Social Welfare', color: 'bg-pink-500/10 text-pink-700' },
    { value: 'technology', label: '💻 Technology', color: 'bg-cyan-500/10 text-cyan-700' },
    { value: 'other', label: '📌 Other', color: 'bg-gray-500/10 text-gray-700' },
];

export const STATUS_OPTIONS = [
    { value: 'pending', label: 'Not Started', icon: '⏳', color: 'bg-gray-100 text-gray-700' },
    { value: 'in_progress', label: 'In Progress', icon: '🔄', color: 'bg-blue-100 text-blue-700' },
    { value: 'completed', label: 'Completed', icon: '✅', color: 'bg-green-100 text-green-700' },
    { value: 'failed', label: 'Could Not Fulfill', icon: '❌', color: 'bg-red-100 text-red-700' },
];

export function getCategoryInfo(categoryValue: string) {
    return PROMISE_CATEGORIES.find(c => c.value === categoryValue) || PROMISE_CATEGORIES[PROMISE_CATEGORIES.length - 1];
}

export function getStatusInfo(statusValue: string) {
    return STATUS_OPTIONS.find(s => s.value === statusValue) || STATUS_OPTIONS[0];
}

export function getStatusColor(status: string): string {
    switch (status) {
        case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'failed': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
}

export function getProgressColor(progress: number): string {
    if (progress >= 80) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-gray-400';
}

export function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
}
