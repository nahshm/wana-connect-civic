import { useState } from 'react'
import { Check, ChevronsUpDown, MapPin, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

interface Community {
    id: string
    name: string
    display_name: string
    member_count: number
    type?: string         // 'location' | 'interest' | undefined
    location_type?: string // 'county' | 'constituency' | 'ward' | null
}

interface CommunitySelectorProps {
    communities: Community[]
    selectedCommunityId?: string
    onSelectCommunity: (communityId: string | undefined) => void
    disabled?: boolean
}

// Hierarchy order for location communities
const GEO_ORDER: Record<string, number> = { county: 0, constituency: 1, ward: 2 };

export const CommunitySelector = ({
    communities = [],
    selectedCommunityId,
    onSelectCommunity,
    disabled = false,
}: CommunitySelectorProps) => {
    const [open, setOpen] = useState(false)

    const selectedCommunity = communities.find(c => c.id === selectedCommunityId)

    // Split into geographic (location hierarchy) and interest communities
    const geoCommunities = communities
        .filter(c => c.type === 'location' && c.location_type)
        .sort((a, b) => (GEO_ORDER[a.location_type!] ?? 9) - (GEO_ORDER[b.location_type!] ?? 9));

    const interestCommunities = communities.filter(c => c.type !== 'location');

    const renderItem = (community: Community) => (
        <CommandItem
            key={community.id}
            value={community.name}
            onSelect={() => {
                onSelectCommunity(community.id === selectedCommunityId ? undefined : community.id)
                setOpen(false)
            }}
        >
            <Check
                className={cn(
                    'mr-2 h-4 w-4 shrink-0',
                    selectedCommunityId === community.id ? 'opacity-100' : 'opacity-0'
                )}
            />
            <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">c/{community.name}</span>
                <span className="text-xs text-muted-foreground truncate">
                    {community.display_name} · {(community.member_count ?? 0).toLocaleString()} members
                </span>
            </div>
        </CommandItem>
    )

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">
                Choose a community <span className="text-muted-foreground">(optional)</span>
            </label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                        disabled={disabled}
                    >
                        {selectedCommunity
                            ? `c/${selectedCommunity.name}`
                            : 'Post to your profile or select a community'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search communities..." />
                        <CommandList>
                            <CommandEmpty>No community found.</CommandEmpty>

                            {/* Profile option */}
                            <CommandGroup>
                                <CommandItem
                                    value="profile"
                                    onSelect={() => {
                                        onSelectCommunity(undefined)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            !selectedCommunityId ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    Post to your profile
                                </CommandItem>
                            </CommandGroup>

                            {/* Geographic hierarchy — County > Constituency > Ward */}
                            {geoCommunities.length > 0 && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup heading={
                                        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            <MapPin className="w-3 h-3" /> Your Location
                                        </span>
                                    }>
                                        {geoCommunities.map(renderItem)}
                                    </CommandGroup>
                                </>
                            )}

                            {/* Interest / other communities */}
                            {interestCommunities.length > 0 && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup heading={
                                        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            <Hash className="w-3 h-3" /> Communities
                                        </span>
                                    }>
                                        {interestCommunities.map(renderItem)}
                                    </CommandGroup>
                                </>
                            )}

                            {/* Fallback: untyped communities (backwards compat) */}
                            {geoCommunities.length === 0 && interestCommunities.length === 0 && communities.length > 0 && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup>
                                        {communities.map(renderItem)}
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {selectedCommunity && (
                <p className="text-xs text-muted-foreground">
                    Posting to c/{selectedCommunity.name}
                </p>
            )}
        </div>
    )
}