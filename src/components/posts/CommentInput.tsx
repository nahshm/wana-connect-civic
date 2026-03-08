import { useState, useRef, useEffect } from 'react';
import { Paperclip, Image, Smile, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { cn } from '@/lib/utils';

interface CommentInputProps {
  channelName?: string;
  placeholder?: string;
  onSubmit: (content: string) => void;
  autoFocus?: boolean;
  className?: string;
}

export function CommentInput({
  channelName,
  placeholder,
  onSubmit,
  autoFocus = false,
  className,
}: CommentInputProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const authModal = useAuthModal();

  const defaultPlaceholder = channelName
    ? `Message #${channelName}`
    : 'Add a comment...';

  const handleSubmit = () => {
    if (!user) {
      authModal.open('login');
      return;
    }
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 transition-colors',
        isFocused && 'border-primary/40 ring-1 ring-primary/20',
        className
      )}
    >
      {/* Plus / expand button */}
      <button
        type="button"
        className="flex-shrink-0 w-7 h-7 rounded-full bg-muted hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label="More options"
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* Text input */}
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder || defaultPlaceholder}
        rows={1}
        autoFocus={autoFocus}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none min-h-[28px] max-h-[120px] py-0.5 leading-snug"
      />

      {/* Action icons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          className="w-7 h-7 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="w-7 h-7 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Add image"
        >
          <Image className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="w-7 h-7 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Add emoji"
        >
          <Smile className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
