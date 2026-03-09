import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { aiClient, Source, ChatMessage } from '@/services/aiClient';
import { v4 as uuidv4 } from 'uuid';
import { 
  ArrowRight, 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown, 
  Globe, 
  Clock,
  X,
  Send,
  Loader2,
  User,
  Bot
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

const RECOMMENDED_QUESTIONS = [
  { text: "How do I report a pothole?", icon: "🛣️" },
  { text: "What are the requirements for a business permit?", icon: "💼" },
  { text: "Where is the nearest huduma center?", icon: "📍" },
  { text: "Who is my MCA?", icon: "👤" },
  { text: "How is the county budget allocated?", icon: "💰" },
  { text: "Report illegal dumping procedure", icon: "🗑️" },
];

interface UserContext {
  name: string;
  county: string;
  role: string;
  interests: string[];
}

export function CivicChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId] = useState(() => localStorage.getItem('wana_brain_session') || uuidv4());
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save session ID
  useEffect(() => {
    localStorage.setItem('wana_brain_session', sessionId);
  }, [sessionId]);

  // Fetch user context
  useEffect(() => {
    const fetchUserContext = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, county, persona')
        .eq('id', user.id)
        .single();

      const { data: interests } = await supabase
        .from('user_interests')
        .select('civic_interests(display_name)')
        .eq('user_id', user.id);

      if (profile) {
        setUserContext({
          name: profile.display_name || 'Citizen',
          county: profile.county || 'Kenya',
          role: profile.persona || 'citizen',
          interests: (interests || [])
            .map((i: any) => i.civic_interests?.display_name)
            .filter(Boolean),
        });
      }
    };
    fetchUserContext();
  }, []);

  // Fetch history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await aiClient.getHistory(sessionId);
        if (history.length > 0) {
          setMessages(history);
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
      }
    };
    fetchHistory();
  }, [sessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const query = text || input.trim();
    if (!query || isStreaming) return;

    setInput('');
    setIsStreaming(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: query,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Add empty assistant message for streaming
    const assistantId = `temp-assistant-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    }]);

    try {
      await aiClient.ragStream(
        query,
        sessionId,
        language,
        // onDelta - append each token
        (delta) => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantId 
                ? { ...msg, content: msg.content + delta }
                : msg
            )
          );
        },
        // onDone
        () => {
          setIsStreaming(false);
          inputRef.current?.focus();
        },
        // onError
        (error) => {
          console.error('Stream error:', error);
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantId 
                ? { ...msg, content: `Error: ${error.message}. Please try again.` }
                : msg
            )
          );
          setIsStreaming(false);
        }
      );
    } catch (error) {
      console.error('RAG error:', error);
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Clear all chat history?')) return;
    setMessages([]);
    try {
      await aiClient.clearHistory(sessionId);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const handleNewSession = () => {
    const newSessionId = uuidv4();
    localStorage.setItem('wana_brain_session', newSessionId);
    window.location.reload();
  };

  // If no messages, show welcome screen
  if (messages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center pt-16 md:pt-24 px-4 pb-32">
        {/* Header */}
        <div className="flex flex-col items-center mb-10 space-y-4 text-center">
          <div className="bg-primary/10 p-4 rounded-3xl mb-4">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            WanaIQ Answers
          </h1>
          <p className="text-muted-foreground font-medium text-xl max-w-md">
            Real answers from Kenya's constitution, laws, and community data.
          </p>
        </div>

        {/* Search Input */}
        <div className="w-full max-w-2xl relative z-10 mb-12">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl opacity-20 blur-lg group-hover:opacity-30 transition duration-500" />
            <div className="relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={language === 'sw' ? 'Uliza swali lolote...' : 'Ask a question (e.g., How to report a pothole?)'}
                className="w-full border-0 shadow-xl rounded-2xl h-20 pl-6 pr-20 text-xl placeholder:text-muted-foreground focus-visible:ring-0 bg-card"
                autoFocus
              />
              <Button 
                type="submit"
                size="icon" 
                disabled={!input.trim()}
                className="absolute right-3 top-3 h-14 w-14 rounded-xl"
              >
                <ArrowRight className="w-6 h-6" />
              </Button>
            </div>
          </form>
        </div>

        {/* Personalization Banner */}
        {userContext && (
          <div className="mb-8 bg-primary/5 border border-primary/10 p-3 rounded-full flex items-center gap-3 shadow-sm px-6">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="text-foreground text-sm">
              🎯 Personalized for <strong>{userContext.name}</strong> ({userContext.role}) in {userContext.county}
              {userContext.interests.length > 0 && <span> • {userContext.interests[0]}</span>}
            </p>
          </div>
        )}

        {/* Recommended Questions */}
        <div className="w-full max-w-2xl">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 pl-2">
            Trending Questions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {RECOMMENDED_QUESTIONS.map((item, i) => (
              <Card
                key={i}
                onClick={() => handleSend(item.text)}
                className="flex items-center gap-3 p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-medium text-foreground group-hover:text-primary">{item.text}</span>
              </Card>
            ))}
          </div>
        </div>

        {/* Language Toggle */}
        <div className="fixed bottom-6 right-6 flex gap-2 bg-card p-1 rounded-full shadow-lg border">
          <button
            onClick={() => setLanguage('en')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-bold transition-all",
              language === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('sw')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-bold transition-all",
              language === 'sw' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            SW
          </button>
        </div>
      </div>
    );
  }

  // Chat view with messages
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="font-semibold text-foreground hidden sm:inline">WanaIQ Answers</span>
        </div>
        
        {userContext && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/5 text-foreground rounded-full text-xs border">
            🎯 {userContext.name} • {userContext.county}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleNewSession} className="rounded-full">
            New chat
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClearHistory} className="text-muted-foreground">
            Clear
          </Button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 pb-32 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3",
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-br-md' 
                  : 'bg-muted text-foreground rounded-bl-md'
              )}>
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        a: ({ href, children }) => (
                          <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                            {children}
                          </a>
                        ),
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      }}
                    >
                      {message.content || (isStreaming ? '...' : '')}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p>{message.content}</p>
                )}

                {/* Sources */}
                {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">Sources:</p>
                    <div className="flex flex-wrap gap-2">
                      {message.sources.slice(0, 3).map((source, i) => (
                        <span 
                          key={i} 
                          className="text-xs bg-background/50 px-2 py-1 rounded-full"
                        >
                          {source.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm pl-11">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={language === 'sw' ? 'Uliza swali...' : 'Ask a question...'}
              disabled={isStreaming}
              className="flex-1 h-12 rounded-full px-6"
            />
            <Button 
              type="submit"
              size="icon"
              disabled={!input.trim() || isStreaming}
              className="h-12 w-12 rounded-full"
            >
              {isStreaming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Language Toggle */}
      <div className="fixed bottom-20 right-6 flex gap-2 bg-card p-1 rounded-full shadow-lg border">
        <button
          onClick={() => setLanguage('en')}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
            language === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          )}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('sw')}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
            language === 'sw' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          )}
        >
          SW
        </button>
      </div>
    </div>
  );
}
