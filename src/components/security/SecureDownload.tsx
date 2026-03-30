// src/components/security/SecureDownload.tsx
// PURPOSE: Handles authenticated downloading/viewing of documents (PDFs, etc.)
// from private buckets via the Cloudflare Worker proxy.

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecureDownloadProps {
  url: string;
  filename?: string;
  children: React.ReactNode;
  className?: string;
}

export const SecureDownload: React.FC<SecureDownloadProps> = ({ 
  url, 
  filename, 
  children, 
  className 
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Authentication required', description: 'Please log in to view documents.', variant: 'destructive' });
        return;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a temporary link and click it
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || url.split('/').pop()?.split('?')[0] || 'document';
      
      // If it's a PDF, we might want to open in new tab instead of direct download
      // but 'download' attribute usually forces download.
      // For now, let's stick to download for reliability across browsers.
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL after a short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

    } catch (error: Error | unknown) {
      console.error('SecureDownload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching the document.';
      toast({ 
        title: 'Download failed', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleAction} 
      disabled={loading}
      className={className}
      type="button"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : null}
      {children}
    </button>
  );
};
