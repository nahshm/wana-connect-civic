import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Book } from 'lucide-react';

export const CommunityBookmarks = () => {
    const bookmarks = [
        { label: 'Wiki', url: '#' },
        { label: 'Rules', url: '#' },
        { label: 'FAQ', url: '#' },
        { label: 'Discord', url: '#' },
    ];

    return (
        <Card className="bg-sidebar-background border-sidebar-border">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase text-sidebar-muted-foreground">
                    Community Bookmarks
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2">
                    {bookmarks.map((bookmark) => (
                        <a
                            key={bookmark.label}
                            href={bookmark.url}
                            className="flex items-center justify-center gap-2 p-2 rounded-md bg-sidebar-accent/30 hover:bg-sidebar-accent transition-colors text-sm font-medium"
                        >
                            <Book className="w-3 h-3" />
                            {bookmark.label}
                        </a>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
