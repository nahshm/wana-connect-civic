import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Community } from '@/types';
import { CommunityCard } from './CommunityCard';
import { ChevronRight } from 'lucide-react';

interface ExploreCommunitiesProps {
    communities: Community[];
    onToggleFollow: (communityId: string) => void;
}

export const ExploreCommunities = ({ communities, onToggleFollow }: ExploreCommunitiesProps) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const categories = [
        'All', 'Governance', 'Accountability', 'Civic Education', 'Discussion',
        'Technology', 'Business', 'Sports'
    ];

    // Map internal categories to display categories for demo purposes
    // In a real app, these would match exactly or be mapped properly
    const getDisplayCategory = (cat: string) => {
        if (cat === 'governance') return 'Governance';
        if (cat === 'accountability') return 'Accountability';
        if (cat === 'civic-education') return 'Civic Education';
        return 'Discussion';
    };

    const filteredCommunities = selectedCategory === 'All'
        ? communities
        : communities.filter(c => getDisplayCategory(c.category) === selectedCategory);

    const recommended = filteredCommunities.slice(0, 6);
    const trending = filteredCommunities.slice(6, 12);

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Explore Communities</h1>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(category => (
                    <Button
                        key={category}
                        variant={selectedCategory === category ? "secondary" : "outline"}
                        className="rounded-full"
                        onClick={() => setSelectedCategory(category)}
                    >
                        {category}
                    </Button>
                ))}
            </div>

            {/* Recommended Section */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-muted-foreground uppercase tracking-wide">Recommended for you</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommended.map(community => (
                        <CommunityCard
                            key={community.id}
                            community={community}
                            onToggleFollow={onToggleFollow}
                            showDescription={true}
                        />
                    ))}
                </div>

                {recommended.length > 0 && (
                    <div className="mt-4 flex justify-center">
                        <Button variant="secondary" className="rounded-full px-6">
                            Show more
                        </Button>
                    </div>
                )}
            </div>

            {/* More Like Section (Trending) */}
            {trending.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-muted-foreground uppercase tracking-wide">Trending Communities</h2>
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                            See All <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trending.map(community => (
                            <CommunityCard
                                key={community.id}
                                community={community}
                                onToggleFollow={onToggleFollow}
                                showDescription={true}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
