import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { aiClient, RAGResult, Source } from '@/services/aiClient';
import { v4 as uuidv4 } from 'uuid';
import { 
    Search, 
    ArrowRight, 
    Sparkles, 
    BookOpen, 
    ThumbsUp, 
    ThumbsDown, 
    Globe, 
    Clock,
    X,
    ArrowLeft,
    Share2,
    MessageSquare,
    MoreHorizontal,
    Send,
    Users
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';




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
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<RAGResult | null>(null);
    const [sessionId] = useState(() => localStorage.getItem('wana_brain_session') || uuidv4());
    const [language, setLanguage] = useState<'en' | 'sw'>('en');
    const [recentQueries, setRecentQueries] = useState<{ id: string, query: string, answer: string, sources: Source[], created_at: string }[]>([]);
    const [followUp, setFollowUp] = useState('');
    const [civicContext, setCivicContext] = useState<{
        communities: any[];
        projects: any[];
        posts: any[];
    }>({ communities: [], projects: [], posts: [] });
    const [userContext, setUserContext] = useState<UserContext | null>(null);

    // Fetch User Context
    useEffect(() => {
        // ... (existing code)
    }, []);

    // ... (existing Fetch Civic Context)

    // Fetch History on Mount
    useEffect(() => {
        const fetchHistory = async () => {
             if (!sessionId) return;
             try {
                 const history = await aiClient.getHistory(sessionId);
                 if (history) {
                     // Transform DB history to partial RAGResult format for list
                     interface HistoryItem {
                         id: string;
                         query: string;
                         answer: string;
                         sources: Source[];
                         created_at: string;
                     }
                     const formatted = (history as unknown as HistoryItem[]).map((h) => ({
                         id: h.id,
                         query: h.query,
                         answer: h.answer,
                         sources: h.sources,
                         created_at: h.created_at
                     }));
                     setRecentQueries(formatted);
                 }
             } catch (error) {
                 console.error("Failed to fetch history:", error);
             }
        };
        
        localStorage.setItem('wana_brain_session', sessionId);
        fetchHistory();
    }, [sessionId]);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim() || loading) return;

        setLoading(true);
        setResult(null);

        try {
            const response = await aiClient.rag(query, sessionId, language);
            setResult(response);
            
            // Optimistically update history with temp ID
            setRecentQueries(prev => [{
                id: `temp-${Date.now()}`,
                query,
                answer: response.answer,
                sources: response.sources,
                created_at: new Date().toISOString()
            }, ...prev]);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestionClick = (text: string) => {
        setQuery(text);
        // If it exists in history, just show it
        const existing = recentQueries.find(h => h.query === text);
        if (existing) {
             setResult({
                 answer: existing.answer,
                 sources: existing.sources,
                 confidence: 0, // Not stored in history list for now, or could add
                 processing_time_ms: 0
             });
             return;
        }
        // Otherwise, no auto-search to avoid accidental API costs, just pre-fill
    };

    const clearRecent = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        
        // Optimistic UI update
        setRecentQueries(prev => prev.filter(q => q.id !== id));

        // If it's not a temp ID, delete from DB
        if (!id.startsWith('temp-')) {
            try {
                await aiClient.deleteHistoryItem(id);
            } catch (error) {
                console.error("Failed to delete item:", error);
                // Revert on error? Or just suppress. Suppressing for smoother UX.
            }
        }
    };

    const handleClearAll = async () => {
        if (!confirm("Are you sure you want to clear your entire chat history?")) return;
        
        setRecentQueries([]);
        try {
            await aiClient.clearHistory(sessionId);
        } catch (error) {
            console.error("Failed to clear history:", error);
        }
    };

    const resetSearch = () => {
        setResult(null);
        setQuery('');
        setFollowUp('');
    };

    // --- RENDER: RESULTS VIEW ---
    if (result || loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                {/* Result Header */}
                <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 h-16 flex items-center justify-between shadow-sm">
                   <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={resetSearch} className="rounded-full hover:bg-gray-100">
                            <ArrowLeft className="w-5 h-5 text-gray-700" />
                        </Button>
                        <div className="flex items-center gap-2">
                             <div className="bg-gradient-to-tr from-blue-600 to-purple-600 p-1.5 rounded-lg">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-gray-900 hidden sm:inline">WanaIQ Answers</span>
                        </div>
                   </div>
                   {userContext && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-900 rounded-full text-xs border border-blue-100">
                             <span>🎯 Personalized for <strong>{userContext.name}</strong> ({userContext.county})</span>
                        </div>
                   )}
                   <Button variant="outline" onClick={resetSearch} className="rounded-full text-sm font-medium border-gray-300 hover:bg-gray-50">
                        New question
                   </Button>
                </header>

                <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 pb-32">
                    {/* Query Title */}
                    <div className="mb-6">
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight tracking-tight mb-4">
                            {query}
                        </h1>
                        
                        {/* Sources Bar */}
                        {!loading && result?.sources && (
                            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                                <div className="flex items-center -space-x-2">
                                     {result.sources.slice(0, 3).map((_, i) => (
                                         <div key={i} className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px]">
                                             🏛️
                                         </div>
                                     ))}
                                </div>
                                <div className="text-sm text-gray-500 font-medium whitespace-nowrap flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors">
                                    Sources: 
                                    {result.sources.slice(0, 2).map(s => s.title).join(', ')} 
                                    {result.sources.length > 2 && ` +${result.sources.length - 2} more`}
                                    <ArrowRight className="w-3 h-3" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content Answer */}
                    <div className="space-y-8">
                        {loading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-11/12" />
                                <Skeleton className="h-4 w-full" />
                                <div className="h-8"></div>
                                <Skeleton className="h-32 w-full rounded-xl" />
                            </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="prose prose-lg prose-slate max-w-none text-gray-800"
                            >
                                <div className="whitespace-pre-wrap leading-7">
                                    <ReactMarkdown components={{
                                        h1: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4" {...props} />,
                                        h2: ({node, ...props}) => <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3" {...props} />,
                                        p: ({node, ...props}) => <p className="mb-4 text-gray-800" {...props} />,
                                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
                                        li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                        a: ({node, ...props}) => <a className="text-blue-600 hover:underline font-medium" {...props} />,
                                    }}>
                                        {result?.answer || ''}
                                    </ReactMarkdown>
                                </div>

                                {/* Confidence / Feedback */}
                                <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-100">
                                   <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600 gap-2">
                                        <ThumbsUp className="w-4 h-4" /> Helpful
                                   </Button>
                                   <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-600 gap-2">
                                        <ThumbsDown className="w-4 h-4" /> Not Helpful
                                   </Button>
                                   <div className="flex-1"></div>
                                   <Button variant="ghost" size="sm" className="text-gray-500 gap-2">
                                        <Share2 className="w-4 h-4" /> Share
                                   </Button>
                                   <Button variant="ghost" size="icon" className="text-gray-500">
                                        <MoreHorizontal className="w-4 h-4" />
                                   </Button>
                                </div>
                            </motion.div>
                        )}



                        {/* Local Civic Context */}
                        {!loading && (
                            <div className="pt-8 border-t border-gray-100 space-y-8">
                                
                                {/* Communities */}
                                {civicContext.communities.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Users className="w-5 h-5 text-blue-600" /> 
                                            Active Communities
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {civicContext.communities.map((comm) => (
                                                <Card 
                                                    key={comm.id} 
                                                    onClick={() => window.location.href = `/community/${comm.name}`}
                                                    className="p-4 border border-gray-200 hover:border-blue-300 transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-between group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                         <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl">
                                                            🏙️
                                                         </div>
                                                         <div className="min-w-0">
                                                             <div className="font-bold text-gray-900 truncate group-hover:underline decoration-blue-500/30 underline-offset-4">
                                                                {comm.display_name || comm.name}
                                                             </div>
                                                             <div className="text-xs text-gray-500">{comm.member_count} members • {comm.category}</div>
                                                         </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Projects */}
                                {civicContext.projects.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Globe className="w-5 h-5 text-green-600" /> 
                                            Recent Projects
                                        </h3>
                                        <div className="space-y-3">
                                            {civicContext.projects.map((proj) => (
                                                <div 
                                                    key={proj.id}
                                                    onClick={() => window.location.href = `/projects/${proj.id}`}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 cursor-pointer transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${
                                                            proj.status === 'ongoing' ? 'bg-green-500' : 
                                                            proj.status === 'planned' ? 'bg-blue-500' : 'bg-gray-400'
                                                        }`} />
                                                        <div>
                                                            <div className="font-medium text-gray-900">{proj.title}</div>
                                                            <div className="text-xs text-gray-500 capitalize">{proj.status} • {proj.county || 'National'}</div>
                                                        </div>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-gray-400" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}


                                {/* Posts */}
                                {civicContext.posts.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <MessageSquare className="w-5 h-5 text-purple-600" /> 
                                            Trending Discussions
                                        </h3>
                                        <div className="space-y-3">
                                            {civicContext.posts.map((post) => (
                                                <div 
                                                    key={post.id}
                                                    onClick={() => window.location.href = `/post/${post.id}`}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 cursor-pointer transition-all"
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                                                            <MessageSquare className="w-4 h-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-gray-900 truncate">{post.title}</div>
                                                            <div className="text-xs text-gray-500">{post.upvotes} upvotes • {post.comment_count} comments</div>
                                                        </div>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>

                {/* Sticky Footer Input - Floating Style */}
                <div className="fixed bottom-6 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
                    <div className="max-w-2xl w-full relative pointer-events-auto">
                        <div className="bg-white rounded-full shadow-2xl border border-gray-200 p-1 flex items-center">
                            <Input 
                                value={followUp}
                                onChange={(e) => setFollowUp(e.target.value)}
                                placeholder="Ask a followup..."
                                className="flex-1 border-0 shadow-none focus-visible:ring-0 h-12 rounded-full pl-6 pr-12 text-gray-700 placeholder:text-gray-400 bg-transparent"
                            />
                            <Button 
                                 size="icon" 
                                 className="h-10 w-10 rounded-full bg-gray-100 hover:bg-blue-600 text-gray-500 hover:text-white transition-all mr-1"
                                 disabled={!followUp.trim()}
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER: INITIAL SEARCH VIEW ---
    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col items-center pt-24 px-4">
             {/* Large Centered Header */}
             <div className="flex flex-col items-center mb-10 space-y-4 text-center">
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-4">
                    <Sparkles className="w-10 h-10 text-blue-600" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                    WanaIQ Answers
                </h1>
                <p className="text-gray-500 font-medium text-xl max-w-md">
                    Real answers from Kenya's constitution, laws, and community data.
                </p>
            </div>

            {/* Main Search Input */}
            <div className="w-full max-w-2xl relative z-10 mb-12">
                 <form onSubmit={handleSearch} className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-20 blur-lg group-hover:opacity-30 transition duration-500"></div>
                    <div className="relative">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={language === 'sw' ? 'Uliza swali lolote...' : 'Ask a question (e.g., How to report a pothole?)'}
                            className="w-full border-0 shadow-xl rounded-2xl h-20 pl-6 pr-20 text-xl placeholder:text-gray-400 focus-visible:ring-0"
                            autoFocus
                        />
                         <Button 
                            type="submit"
                            size="icon" 
                            disabled={!query.trim()}
                            className="absolute right-3 top-3 h-14 w-14 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all"
                        >
                            <ArrowRight className="w-6 h-6" />
                        </Button>
                    </div>
                </form>
            </div>



            {/* Personalization Banner */}
             {userContext && (
                <div className="mb-8 bg-blue-50/80 backdrop-blur-sm border border-blue-100 p-3 rounded-full flex items-center gap-3 shadow-sm px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <p className="text-blue-900 text-sm">
                        🎯 Personalized for <strong>{userContext.name}</strong> ({userContext.role}) in {userContext.county}
                        {userContext.interests.length > 0 && <span> • Focused on {userContext.interests[0]}</span>}
                    </p>
                    <div className="h-4 w-px bg-blue-200 mx-1" />
                    <button 
                        onClick={() => window.location.href = '/profile/setup?return=/civic-assistant'}
                        className="text-blue-600 text-xs font-semibold hover:underline"
                    >
                        Update preferences
                    </button>
                </div>
            )}

            {/* Recents & Recommended */}
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                {/* Recent */}
                {recentQueries.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pr-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">
                                Full History
                            </h3>
                            <button 
                                onClick={handleClearAll}
                                className="text-xs text-gray-400 hover:text-red-500 hover:underline transition-colors"
                            >
                                Clear All
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {recentQueries.map((q, i) => (
                                <div 
                                    key={q.id || i}
                                    onClick={() => handleSuggestionClick(q.query)}
                                    className="group flex items-center justify-between p-3 rounded-lg hover:bg-white hover:shadow-sm cursor-pointer transition-all border border-transparent hover:border-gray-100"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-700 truncate">{q.query}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => clearRecent(q.id, e)}
                                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1 hover:bg-red-50 rounded"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommended */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">
                        Trending Questions
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                         {RECOMMENDED_QUESTIONS.map((item, i) => (
                            <div
                                key={i}
                                onClick={() => handleSuggestionClick(item.text)}
                                className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group"
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Language Toggle Fixed Bottom */}
             <div className="fixed bottom-6 right-6 flex gap-2 bg-white p-1 rounded-full shadow-lg border border-gray-100">
                 <button
                    onClick={() => setLanguage('en')}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        language === 'en' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    EN
                </button>
                <button
                    onClick={() => setLanguage('sw')}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        language === 'sw' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    SW
                </button>
            </div>
        </div>
    );
}
