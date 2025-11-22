import React, { useState } from 'react';
import { Post } from '../types';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Bookmark, MoreHorizontal } from 'lucide-react';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [voteStatus, setVoteStatus] = useState<'up' | 'down' | null>(null);
  const [votes, setVotes] = useState(post.upvotes);

  const handleVote = (type: 'up' | 'down') => {
    if (voteStatus === type) {
      setVoteStatus(null);
      setVotes(type === 'up' ? votes - 1 : votes + 1);
    } else {
      if (voteStatus === 'up') setVotes(votes - 2);
      else if (voteStatus === 'down') setVotes(votes + 2);
      else setVotes(type === 'up' ? votes + 1 : votes - 1);
      
      setVoteStatus(type);
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row bg-reddit-gray border border-reddit-border rounded-md hover:border-gray-500 transition-colors cursor-pointer mb-4 ${post.isSponsored ? 'border-transparent' : ''}`}>
      {/* Vote Sidebar - Desktop */}
      <div className="hidden sm:flex flex-col items-center p-2 bg-[#151f23] rounded-l-md w-10 shrink-0">
        <button 
          onClick={(e) => { e.stopPropagation(); handleVote('up'); }}
          className={`p-1 hover:bg-gray-800 rounded ${voteStatus === 'up' ? 'text-reddit-accent' : 'text-gray-400'}`}
        >
          <ArrowBigUp size={24} fill={voteStatus === 'up' ? 'currentColor' : 'none'} />
        </button>
        <span className={`text-xs font-bold my-1 ${voteStatus === 'up' ? 'text-reddit-accent' : voteStatus === 'down' ? 'text-blue-500' : 'text-white'}`}>
          {votes === 0 ? 'Vote' : votes < 1000 ? votes : `${(votes / 1000).toFixed(1)}k`}
        </span>
        <button 
          onClick={(e) => { e.stopPropagation(); handleVote('down'); }}
          className={`p-1 hover:bg-gray-800 rounded ${voteStatus === 'down' ? 'text-blue-500' : 'text-gray-400'}`}
        >
          <ArrowBigDown size={24} fill={voteStatus === 'down' ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-2 sm:p-3">
        {/* Header */}
        <div className="flex items-center text-xs text-reddit-textMuted mb-2 flex-wrap gap-1">
           {post.subreddit.startsWith('u/') ? (
             <span className="font-bold text-white mr-1">{post.subreddit}</span>
           ) : (
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-full bg-black border border-white mr-1 overflow-hidden">
                 <img src="https://styles.redditmedia.com/t5_2t74u/styles/communityIcon_ln7j30467w761.png" alt="icon" className="w-full h-full object-cover" onError={(e) => e.currentTarget.src='https://www.redditstatic.com/avatars/defaults/v2/avatar_default_4.png'} />
              </div>
              <span className="font-bold text-white hover:underline mr-1">{post.subreddit}</span>
            </div>
           )}
           <span className="mx-1">•</span>
           <span className="hover:underline">Posted by {post.author}</span>
           <span className="mx-1">{post.timeAgo}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-reddit-text mb-2 leading-snug">{post.title}</h3>

        {/* Flair */}
        {post.flair && (
          <div 
            className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2"
            style={{ 
              backgroundColor: post.flair.color, 
              color: post.flair.textColor || 'white' 
            }}
          >
            {post.flair.text}
          </div>
        )}

        {/* Media/Content */}
        <div className="mb-2">
          {post.image ? (
            <div className="w-full rounded-md overflow-hidden border border-reddit-border bg-black max-h-[500px] flex items-center justify-center">
               <img src={post.image} alt={post.title} className="max-w-full object-contain max-h-[500px]" />
            </div>
          ) : post.content ? (
            <div className="text-sm text-reddit-text line-clamp-6" style={{ whiteSpace: 'pre-line' }}>
              {post.content}
            </div>
          ) : null}
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-1 text-reddit-textMuted text-xs font-bold">
            {/* Mobile Vote (Visible only on small screens) */}
           <div className="flex sm:hidden items-center bg-reddit-hover px-2 py-1.5 rounded-full mr-2">
              <button onClick={(e) => { e.stopPropagation(); handleVote('up'); }} className={voteStatus === 'up' ? 'text-reddit-accent' : ''}><ArrowBigUp size={20} /></button>
              <span className="mx-1">{votes}</span>
              <button onClick={(e) => { e.stopPropagation(); handleVote('down'); }} className={voteStatus === 'down' ? 'text-blue-500' : ''}><ArrowBigDown size={20} /></button>
           </div>

           <button className="flex items-center gap-2 hover:bg-reddit-hover px-3 py-2 rounded-sm transition-colors">
             <MessageSquare size={20} />
             <span>{post.comments} Comments</span>
           </button>
           <button className="flex items-center gap-2 hover:bg-reddit-hover px-3 py-2 rounded-sm transition-colors">
             <Share2 size={20} />
             <span>Share</span>
           </button>
           <button className="flex items-center gap-2 hover:bg-reddit-hover px-3 py-2 rounded-sm transition-colors">
             <Bookmark size={20} />
             <span>Save</span>
           </button>
           <button className="flex items-center hover:bg-reddit-hover px-2 py-2 rounded-sm transition-colors">
             <MoreHorizontal size={20} />
           </button>
        </div>
      </div>
    </div>
  );
};
