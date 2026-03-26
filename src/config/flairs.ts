// Civic post flairs for categorization and filtering

export interface Flair {
    id: string
    label: string
    color: string
    bgColor: string
    description: string
}

export const CIVIC_FLAIRS: Flair[] = [
    {
        id: 'corruption',
        label: 'Corruption',
        color: 'text-red-600',
        bgColor: 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20',
        description: 'Report corruption or misuse of public resources'
    },
    {
        id: 'project-update',
        label: 'Project Update',
        color: 'text-blue-600',
        bgColor: 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20',
        description: 'Updates on government or community projects'
    },
    {
        id: 'discussion',
        label: 'Discussion',
        color: 'text-green-600',
        bgColor: 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20',
        description: 'General civic discussion or debate'
    },
    {
        id: 'question',
        label: 'Question',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20',
        description: 'Ask questions about civic matters'
    },
    {
        id: 'fact-check',
        label: 'Fact-Check',
        color: 'text-purple-600',
        bgColor: 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20',
        description: 'Verify claims or provide fact-checking'
    },
    {
        id: 'promise-tracker',
        label: 'Promise Tracker',
        color: 'text-orange-600',
        bgColor: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20',
        description: 'Track campaign promises and commitments'
    },
    {
        id: 'official-response',
        label: 'Official Response',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20',
        description: 'Responses from government officials or authorities'
    },
    {
        id: 'critique',
        label: 'Critique',
        color: 'text-pink-600',
        bgColor: 'bg-pink-500/10 border-pink-500/20 hover:bg-pink-500/20',
        description: 'Constructive criticism of policies or actions'
    },
    {
        id: 'evidence',
        label: 'Evidence',
        color: 'text-teal-600',
        bgColor: 'bg-teal-500/10 border-teal-500/20 hover:bg-teal-500/20',
        description: 'Share documented evidence or proof'
    },
    {
        id: 'clarification',
        label: 'Clarification',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20',
        description: 'Provide clarification or context'
    },
    {
        id: 'support',
        label: 'Support',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20',
        description: 'Show support for an initiative or cause'
    }
]

export const getFlairById = (id: string): Flair | undefined => {
    return CIVIC_FLAIRS.find(flair => flair.id === id)
}

export const getFlairColor = (id: string): string => {
    const flair = getFlairById(id)
    return flair ? flair.bgColor : 'bg-gray-100'
}
