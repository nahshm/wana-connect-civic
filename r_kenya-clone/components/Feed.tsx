import React, { useState } from 'react';
import PostCard from './PostCard';
import { MOCK_POSTS } from '../constants';
import { Filter, Flame, Clock, TrendingUp } from 'lucide-react';

const Feed = () => {
  const [filter, setFilter] = useState('hot');

  const FilterButton = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
    <button 
      onClick={() => setFilter(id)}
      className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        filter === id 
        ? 'bg-slate-200 text-slate-900' 
        : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-24">
      {/* Create Post Input Trigger */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 mb-4 flex items-center space-x-3 shadow-sm">
        <div className="h-8 w-8 bg-slate-200 rounded-full flex-shrink-0"></div>
        <input 
          type="text" 
          placeholder="Speak your mind or report an issue..." 
          className="flex-1 bg-slate-50 hover:bg-slate-100 border border-transparent rounded-md px-4 py-2 text-sm text-slate-700 focus:outline-none transition-colors cursor-pointer"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2 mb-4 overflow-x-auto no-scrollbar pb-1">
        <FilterButton id="hot" label="Hot" icon={Flame} />
        <FilterButton id="new" label="New" icon={Clock} />
        <FilterButton id="top" label="Top" icon={TrendingUp} />
      </div>

      {/* Feed List */}
      <div className="space-y-4">
        {MOCK_POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      
      {/* End of Feed */}
      <div className="py-8 text-center text-slate-400 text-sm">
        <p>You're all caught up!</p>
        <button className="mt-2 text-emerald-600 font-medium hover:underline">Explore other c/communities</button>
      </div>
    </div>
  );
};

export default Feed;