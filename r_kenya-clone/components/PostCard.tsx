import React, { useState, useRef } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, MoreHorizontal, CheckCircle, Play, VolumeX, ShieldCheck, BarChart3 } from 'lucide-react';
import { Post, PostType } from '../types';
import VerificationPanel from './VerificationPanel';

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  // Determine sentiment color
  const sentimentColor = post.sentiment 
    ? post.sentiment.positive > post.sentiment.negative 
      ? 'bg-emerald-500' 
      : 'bg-red-500'
    : 'bg-slate-500';

  return (
    <div className="bg-white rounded-lg mb-4 shadow-sm border border-slate-200 group">
      <div className="flex">
        {/* Voting Sidebar */}
        <div className="flex flex-col items-center p-3 w-12 bg-slate-50 rounded-l-lg border-r border-slate-100">
          <button className="text-slate-400 hover:text-emerald-500 transition-colors">
            <ThumbsUp className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-slate-600 my-1">{post.upvotes > 1000 ? `${(post.upvotes / 1000).toFixed(1)}k` : post.upvotes}</span>
          <button className="text-slate-400 hover:text-red-500 transition-colors">
            <ThumbsDown className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-3 flex-1">
          {/* Metadata Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-xs text-slate-500 space-x-2">
              <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                {post.community.prefix}{post.community.name}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center hover:underline cursor-pointer text-slate-600">
                Posted by {post.author.isOfficial ? 'g/' : post.author.isVerified ? 'w/' : 'u/'}{post.author.username}
                {post.author.isVerified && <CheckCircle className="h-3 w-3 text-blue-500 ml-1" />}
              </span>
              <span className="text-slate-300">•</span>
              <span>{post.timestamp}</span>
              {post.reference && (
                 <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs font-mono border border-slate-200">
                   {post.reference}
                 </span>
              )}
            </div>
            <button className="text-slate-400 hover:bg-slate-100 p-1 rounded transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold text-slate-900 mb-2 leading-snug">{post.title}</h2>

          {/* Tag Chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.map((tag, idx) => (
              <span key={idx} className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full font-medium">
                #{tag}
              </span>
            ))}
          </div>

          {/* Media Content */}
          {post.type === PostType.CIVIC_CLIP && post.mediaUrl && (
             <div 
               className="relative w-full h-96 bg-black rounded-lg overflow-hidden mb-3 group cursor-pointer border border-slate-200"
               onMouseEnter={() => {
                 if (!isInteractive && videoRef.current) {
                   videoRef.current.muted = true;
                   videoRef.current.play().catch(() => {});
                   setIsHovering(true);
                 }
               }}
               onMouseLeave={() => {
                 if (!isInteractive && videoRef.current) {
                   videoRef.current.pause();
                   setIsHovering(false);
                 }
               }}
               onClick={() => {
                 if (!isInteractive) {
                   setIsInteractive(true);
                   if (videoRef.current) {
                     videoRef.current.muted = false;
                     videoRef.current.currentTime = 0;
                     videoRef.current.play().catch(() => {});
                   }
                 }
               }}
             >
               <video 
                 ref={videoRef}
                 src={post.mediaUrl}
                 className="w-full h-full object-cover"
                 loop
                 playsInline
                 muted={!isInteractive}
                 controls={isInteractive}
               />
               
               {/* Overlay (Play Button) - Only show if not interactive and not hovering */}
               {!isInteractive && !isHovering && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full border border-white/40 shadow-xl transition-transform group-hover:scale-110">
                     <Play className="h-8 w-8 text-white fill-white" />
                   </div>
                 </div>
               )}

               {/* Badge - Hide when interactive to show full video controls clearly */}
               {!isInteractive && (
                 <div className="absolute bottom-2 left-2 right-2 text-white text-xs text-shadow pointer-events-none flex justify-between">
                   <span className="bg-black/50 px-2 py-1 rounded">CivicClip</span>
                   {isHovering && <span className="bg-black/50 px-2 py-1 rounded flex items-center"><VolumeX className="h-3 w-3 mr-1"/> Muted Preview</span>}
                 </div>
               )}
             </div>
          )}

           {post.type !== PostType.CIVIC_CLIP && post.mediaUrl && (
             <div className="relative w-full h-64 bg-slate-100 rounded-lg overflow-hidden mb-3 border border-slate-200">
               <img src={post.mediaUrl} alt="Post Content" className="w-full h-full object-cover" />
             </div>
          )}

          {/* Text Content */}
          <p className="text-slate-800 text-sm leading-relaxed mb-3">
            {post.content}
          </p>
          
          {/* Sentiment Bar (If exists) */}
          {post.sentiment && (
            <div className="mb-3 flex items-center space-x-2 text-xs">
              <BarChart3 className="h-3 w-3 text-slate-400" />
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500" style={{ width: `${post.sentiment.positive}%` }} title="Positive"></div>
                <div className="h-full bg-slate-300" style={{ width: `${post.sentiment.neutral}%` }} title="Neutral"></div>
                <div className="h-full bg-red-500" style={{ width: `${post.sentiment.negative}%` }} title="Negative"></div>
              </div>
              <span className="text-slate-500 tabular-nums">{post.sentiment.positive}% Pos</span>
            </div>
          )}

          {/* Verification Panel (Conditional) */}
          {post.verification && showVerification && (
             <VerificationPanel verification={post.verification} isExpanded={true} />
          )}

          {/* Footer Actions */}
          <div className="flex items-center space-x-4 text-slate-500 text-sm font-medium mt-2">
            <button className="flex items-center hover:bg-slate-100 px-2 py-1 rounded transition-colors hover:text-slate-900">
              <MessageSquare className="h-4 w-4 mr-2" />
              {post.comments} Comments
            </button>
            <button className="flex items-center hover:bg-slate-100 px-2 py-1 rounded transition-colors hover:text-slate-900">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </button>
            {post.verification && (
              <button 
                onClick={() => setShowVerification(!showVerification)}
                className={`flex items-center px-2 py-1 rounded transition-colors ${showVerification ? 'text-blue-600 bg-blue-50' : 'hover:bg-slate-100 hover:text-blue-600'}`}
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                {showVerification ? 'Close Verify' : 'Verify'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PostCard;