import React, { useState, useEffect } from 'react';
import { Post } from '../types';
import { PostCard } from './PostCard';
import { INITIAL_POSTS } from '../constants';
import { generateMorePosts } from '../services/geminiService';
import { Loader2, LayoutList, LayoutGrid } from 'lucide-react';

export const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [loading, setLoading] = useState(false);

  const handleLoadMore = async () => {
    setLoading(true);
    const newPosts = await generateMorePosts(posts.length);
    setPosts(prev => [...prev, ...newPosts]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Community Highlights Carousel Placeholder */}
      <div className="hidden md:flex gap-4 overflow-x-auto no-scrollbar pb-2">
         <div className="min-w-[280px] h-[120px] bg-reddit-gray rounded-md border border-reddit-border p-3 flex flex-col justify-between cursor-pointer hover:border-gray-500 bg-[url('https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&q=80&w=300')] bg-cover bg-center relative group">
             <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors"></div>
             <div className="relative z-10">
                 <h4 className="text-sm font-bold text-white leading-tight">Share your business/hobbies/Job Opportunities/Job requests!!</h4>
                 <div className="text-xs text-gray-300 mt-1">5 votes • 21 comments</div>
             </div>
             <div className="relative z-10 flex items-center gap-1">
                 <div className="w-5 h-5 rounded-full bg-reddit-gray flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                 </div>
                 <span className="text-xs font-medium">r/Kenya</span>
             </div>
         </div>
         <div className="min-w-[280px] h-[120px] bg-reddit-gray rounded-md border border-reddit-border p-3 flex flex-col justify-between cursor-pointer hover:border-gray-500 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=300')] bg-cover bg-center relative group">
             <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors"></div>
             <div className="relative z-10">
                 <h4 className="text-sm font-bold text-white leading-tight">Mental Health Emergency Contacts...</h4>
                 <div className="text-xs text-gray-300 mt-1">2 votes • 1 comment</div>
             </div>
              <div className="relative z-10 flex items-center gap-1">
                 <div className="w-5 h-5 rounded-full bg-reddit-gray flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                 </div>
                 <span className="text-xs font-medium">r/Kenya</span>
             </div>
         </div>
      </div>

      {/* Create Post Input */}
      <div className="bg-reddit-gray p-2 sm:p-3 rounded-md border border-reddit-border flex items-center gap-2">
         <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden shrink-0">
             <img src="https://www.redditstatic.com/avatars/defaults/v2/avatar_default_4.png" alt="user" />
         </div>
         <input 
            type="text" 
            placeholder="Create Post" 
            className="flex-1 bg-reddit-highlight border border-reddit-border hover:bg-reddit-dark hover:border-gray-500 rounded-md py-2 px-3 text-sm focus:outline-none focus:bg-reddit-dark"
         />
         <button className="p-2 hover:bg-reddit-hover rounded text-reddit-textMuted"><i className="fas fa-image"></i></button>
         <button className="p-2 hover:bg-reddit-hover rounded text-reddit-textMuted"><i className="fas fa-link"></i></button>
      </div>

      {/* Filter Bar */}
      <div className="bg-reddit-gray p-2 rounded-md border border-reddit-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-reddit-textMuted">
             <button className="px-3 py-1 bg-reddit-hover text-reddit-text rounded-full hover:bg-gray-700">Best</button>
             <button className="px-3 py-1 hover:bg-reddit-hover rounded-full">Hot</button>
             <button className="px-3 py-1 hover:bg-reddit-hover rounded-full">New</button>
             <button className="px-3 py-1 hover:bg-reddit-hover rounded-full">Top</button>
          </div>
          <div className="flex items-center gap-2 text-reddit-textMuted">
              <button className="p-1 hover:bg-reddit-hover rounded"><LayoutList size={20} /></button>
          </div>
      </div>

      {/* Posts List */}
      <div className="flex flex-col">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Load More Trigger */}
      <div className="flex justify-center py-4">
        <button 
          onClick={handleLoadMore}
          disabled={loading}
          className="px-6 py-2 bg-reddit-text text-reddit-dark font-bold rounded-full hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
               <Loader2 className="animate-spin" size={20} />
               <span>Generating Content (AI)...</span>
            </>
          ) : (
             "View More Posts"
          )}
        </button>
      </div>
    </div>
  );
};
