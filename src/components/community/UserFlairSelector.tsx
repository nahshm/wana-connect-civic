import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Tag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Mock list of Kenyan counties for flair
const COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu", "Kiambu", "Machakos", "Kajiado",
  "Meru", "Nyeri", "Kakamega", "Bungoma", "Kisii", "Kilifi", "Kwale", "Turkana", "Garissa",
  "Visiting", "Diaspora"
];

export const UserFlairSelector = ({ currentFlair, onFlairUpdate }: { currentFlair?: string, onFlairUpdate?: (flair: string) => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFlair, setSelectedFlair] = useState(currentFlair);
  const [loading, setLoading] = useState(false);

  const filteredFlairs = COUNTIES.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSave = async () => {
    if (!user || !selectedFlair) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_flair: selectedFlair } as any)
        .eq('id', user.id);

      if (error) throw error;

      toast({ title: "Flair updated", description: `Your flair is now ${selectedFlair}` });
      onFlairUpdate?.(selectedFlair);
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating flair:', error);
      toast({ title: "Error", description: "Failed to update flair", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="group cursor-pointer hover:bg-sidebar-accent p-2 rounded-md transition-colors flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-sidebar-muted-foreground" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">User Flair</span>
              {currentFlair ? (
                <Badge variant="secondary" className="text-xs mt-1">{currentFlair}</Badge>
              ) : (
                <span className="text-xs text-sidebar-muted-foreground">No flair selected</span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
            Edit
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] bg-sidebar-background border-sidebar-border">
        <DialogHeader>
          <DialogTitle>Select your flair</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for flair"
              className="pl-9 bg-sidebar-accent/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="h-[300px] overflow-y-auto space-y-1 pr-2">
            {filteredFlairs.map(flair => (
              <div
                key={flair}
                className={`p-2 rounded-md cursor-pointer flex items-center justify-between ${selectedFlair === flair ? 'bg-sidebar-accent' : 'hover:bg-sidebar-accent/50'}`}
                onClick={() => setSelectedFlair(flair)}
              >
                <span>{flair}</span>
                {selectedFlair === flair && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>Apply</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
