import React, { useState } from 'react';
import { CURRENT_USER, MOCK_POSTS, MOCK_PROJECTS, MOCK_PROMISES, MOCK_COMMENTS, MOCK_USER_ACTIONS } from '../constants';
import PostCard from './PostCard';
import { Award, Calendar, MapPin, Edit3, MessageSquare, Shield, Activity, Star, X, Hammer, FileText, CheckCircle, Zap, UserPlus, FileCheck, ArrowRight } from 'lucide-react';
import { Post, Comment, UserAction, CivicProject, CampaignPromise } from '../types';

// Union type for activity stream
type ActivityItem = 
  | { kind: 'post', data: Post }
  | { kind: 'comment', data: Comment }
  | { kind: 'action', data: UserAction }
  | { kind: 'project', data: CivicProject }
  | { kind: 'promise', data: CampaignPromise };

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('activity');
  const [showCompleteProfile, setShowCompleteProfile] = useState(true);
  
  // 1. Gather Data
  const userPosts = MOCK_POSTS.filter(p => p.author.id === CURRENT_USER.id);
  const userProjects = MOCK_PROJECTS.filter(p => p.submittedBy.id === CURRENT_USER.id);
  const userPromises = MOCK_PROMISES.filter(p => p.submittedBy.id === CURRENT_USER.id);
  const userComments = MOCK_COMMENTS.filter(c => c.author.id === CURRENT_USER.id);
  const userActions = MOCK_USER_ACTIONS.filter(a => a.user.id === CURRENT_USER.id);

  // 2. Helper to convert relative time strings (approximate) to minutes for sorting
  const parseRelativeTime = (timeStr: string): number => {
    if (!timeStr) return 999999;
    if (timeStr.includes('now')) return 0;
    if (timeStr.includes('m ago')) return parseInt(timeStr) || 0;
    if (timeStr.includes('h ago')) return (parseInt(timeStr) || 0) * 60;
    if (timeStr.includes('day') || timeStr.includes('d ago')) return (parseInt(timeStr) || 0) * 60 * 24;
    if (timeStr.includes('week')) return (parseInt(timeStr) || 0) * 60 * 24 * 7;
    return 10000; // Default fallback for unknown formats
  };

  // 3. Combine and Sort Activities
  const combinedActivities: ActivityItem[] = [
    ...userPosts.map(p => ({ kind: 'post', data: p } as const)),
    ...userComments.map(c => ({ kind: 'comment', data: c } as const)),
    ...userActions.map(a => ({ kind: 'action', data: a } as const)),
    ...userProjects.map(p => ({ kind: 'project', data: p } as const)),
    ...userPromises.map(p => ({ kind: 'promise', data: p } as const)),
  ].sort((a, b) => {
    // Get timestamp string based on type
    const getTs = (item: ActivityItem) => {
      if (item.kind === 'post') return item.data.timestamp;
      if (item.kind === 'comment') return item.data.timestamp;
      if (item.kind === 'action') return item.data.timestamp;
      if (item.kind === 'project') return item.data.lastUpdated;
      if (item.kind === 'promise') return item.data.timestamp;
      return '99y ago';
    };
    return parseRelativeTime(getTs(a)) - parseRelativeTime(getTs(b));
  });

  // Check for missing fields
  const requiredFields = [
    { key: 'bio', label: 'Add a bio', icon: Edit3 },
    { key: 'location', label: 'Add location', icon: MapPin },
    { key: 'title', label: 'Add title', icon: Award }
  ];

  // Cast CURRENT_USER to any to allow dynamic key access for check
  const missingInfo = requiredFields.filter(field => !(CURRENT_USER as any)[field.key]);
  const completionPercentage = Math.round(((requiredFields.length - missingInfo.length) / requiredFields.length) * 100);

  // --- Render Helpers ---

  const renderActionIcon = (type: string) => {
    switch(type) {
      case 'JOIN_COMMUNITY': return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'VERIFY_POST': return <FileCheck className="h-4 w-4 text-emerald-500" />;
      case 'SUBMIT_REPORT': return <Hammer className="h-4 w-4 text-orange-500" />;
      default: return <Zap className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 pb-24">
      
      {/* Complete Profile Prompt */}
      {showCompleteProfile && missingInfo.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 relative animate-in fade-in slide-in-from-top-2">
            <button 
                onClick={() => setShowCompleteProfile(false)} 
                className="absolute top-3 right-3 text-blue-400 hover:text-blue-600 transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
            <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <div className="mr-4 mb-3 sm:mb-0 relative">
                   <div className="w-12 h-12 rounded-full border-4 border-blue-200 flex items-center justify-center text-blue-600 font-bold text-xs bg-white">
                      {completionPercentage}%
                   </div>
                </div>
                <div className="flex-1">
                    <h3 className="text-blue-900 font-bold text-sm mb-1">Complete your profile</h3>
                    <p className="text-blue-700 text-xs mb-3">Add missing information to improve your credibility in the community.</p>
                    <div className="flex flex-wrap gap-2">
                        {missingInfo.map(item => (
                            <button key={item.label} className="bg-white border border-blue-200 text-blue-600 text-xs px-3 py-1.5 rounded-full font-medium hover:bg-blue-100 hover:text-blue-700 transition-colors flex items-center shadow-sm">
                                <item.icon className="h-3 w-3 mr-1.5" />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        {/* Cover Image Placeholder */}
        <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-700"></div>
        
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 mb-4">
            <div className="relative">
              <img 
                src={CURRENT_USER.avatarUrl} 
                alt={CURRENT_USER.username} 
                className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-white"
              />
              {CURRENT_USER.isVerified && (
                <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white" title="Verified User">
                   <Shield className="h-3 w-3" />
                </div>
              )}
            </div>
            
            <div className="mt-4 md:mt-0 md:ml-4 flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                   <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                     {CURRENT_USER.username}
                     {CURRENT_USER.isOfficial && <span className="ml-2 bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded border border-slate-200">Official</span>}
                   </h1>
                   <p className="text-emerald-600 font-medium">{CURRENT_USER.title || 'Community Member'}</p>
                </div>
                <button className="mt-3 md:mt-0 flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium border border-slate-200">
                   <Edit3 className="h-4 w-4 mr-2" />
                   Edit Profile
                </button>
              </div>
            </div>
          </div>
          
          <p className="text-slate-600 mb-4 max-w-2xl text-sm leading-relaxed">
            {CURRENT_USER.bio || 'No bio available.'}
          </p>
          
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
             <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1.5 text-slate-400" />
                Joined {CURRENT_USER.joinDate}
             </div>
             <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1.5 text-slate-400" />
                {CURRENT_USER.location || 'Location not set'}
             </div>
             <div className="flex items-center text-emerald-600 font-bold">
                <Activity className="h-4 w-4 mr-1.5" />
                {CURRENT_USER.karma} Karma
             </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Left Sidebar: Stats & Badges */}
         <div className="space-y-6">
            {/* Badges */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
               <h3 className="font-bold text-slate-900 mb-3 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-yellow-500" />
                  Badges
               </h3>
               {CURRENT_USER.badges && CURRENT_USER.badges.length > 0 ? (
                 <div className="flex flex-wrap gap-2">
                    {CURRENT_USER.badges.map((badge, index) => (
                      <div key={index} className="flex items-center bg-yellow-50 text-yellow-800 text-xs px-2 py-1.5 rounded-full border border-yellow-200 cursor-help" title={badge}>
                         <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                         {badge}
                      </div>
                    ))}
                 </div>
               ) : (
                 <p className="text-xs text-slate-400 italic">No badges earned yet.</p>
               )}
            </div>

            {/* Community Stats */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
               <h3 className="font-bold text-slate-900 mb-3">Community Impact</h3>
               <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                     <span className="text-slate-600">Verification Score</span>
                     <span className="font-bold text-emerald-600">92%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                     <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                     <span className="text-slate-600">Reports Filed</span>
                     <span className="font-bold text-slate-900">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-slate-600">Promises Tracked</span>
                     <span className="font-bold text-slate-900">5</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Main Feed */}
         <div className="md:col-span-2">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-4">
               <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => setActiveTab('activity')}
                    className={`flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors whitespace-nowrap ${activeTab === 'activity' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                     Recent Activity
                  </button>
                  <button 
                    onClick={() => setActiveTab('posts')}
                    className={`flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors whitespace-nowrap ${activeTab === 'posts' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                     Posts
                  </button>
                  <button 
                    onClick={() => setActiveTab('saved')}
                    className={`flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors whitespace-nowrap ${activeTab === 'saved' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                     Saved
                  </button>
               </div>
            </div>

            {activeTab === 'activity' ? (
              <div className="space-y-6 relative pl-4 sm:pl-0">
                 {/* Timeline Vertical Line */}
                 <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-200 hidden sm:block"></div>

                 {combinedActivities.map((item, idx) => (
                   <div key={idx} className="relative sm:pl-16 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 50}ms` }}>
                      
                      {/* Timeline Icon */}
                      <div className="absolute left-0 top-0 w-14 h-14 hidden sm:flex items-center justify-center">
                         <div className={`w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10 ${
                           item.kind === 'post' ? 'bg-blue-100' : 
                           item.kind === 'comment' ? 'bg-slate-100' : 
                           item.kind === 'project' ? 'bg-orange-100' :
                           item.kind === 'promise' ? 'bg-purple-100' : 'bg-emerald-100'
                         }`}>
                            {item.kind === 'post' && <Edit3 className="h-4 w-4 text-blue-600" />}
                            {item.kind === 'comment' && <MessageSquare className="h-4 w-4 text-slate-600" />}
                            {item.kind === 'action' && renderActionIcon(item.data.type)}
                            {item.kind === 'project' && <Hammer className="h-4 w-4 text-orange-600" />}
                            {item.kind === 'promise' && <FileText className="h-4 w-4 text-purple-600" />}
                         </div>
                      </div>

                      {/* Content Card */}
                      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                         {/* Header: Action Description */}
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                               {item.kind === 'post' ? 'Created Post' : 
                                item.kind === 'comment' ? 'Commented' : 
                                item.kind === 'project' ? 'Reported Project' :
                                item.kind === 'promise' ? 'Logged Promise' : 'User Action'}
                            </span>
                            <span className="text-xs text-slate-400">
                               {item.kind === 'post' && item.data.timestamp}
                               {item.kind === 'comment' && item.data.timestamp}
                               {item.kind === 'action' && item.data.timestamp}
                               {item.kind === 'project' && item.data.lastUpdated}
                               {item.kind === 'promise' && item.data.timestamp}
                            </span>
                         </div>

                         {/* Body */}
                         {item.kind === 'post' && (
                           <div>
                              <h3 className="font-bold text-slate-900 mb-1 hover:text-emerald-600 cursor-pointer">{item.data.title}</h3>
                              <p className="text-sm text-slate-600 line-clamp-2">{item.data.content}</p>
                           </div>
                         )}

                         {item.kind === 'comment' && (
                           <div>
                              <div className="text-xs text-slate-400 mb-1">On: <span className="font-medium text-slate-600">{item.data.postTitle}</span></div>
                              <div className="bg-slate-50 p-2 rounded text-sm text-slate-700 italic border border-slate-100">
                                 "{item.data.content}"
                              </div>
                           </div>
                         )}

                         {item.kind === 'action' && (
                           <div className="flex items-start">
                              <div>
                                <p className="text-sm font-medium text-slate-800">{item.data.description}</p>
                                {item.data.targetName && <div className="text-xs text-emerald-600 mt-1 flex items-center cursor-pointer hover:underline">
                                   View {item.data.targetName} <ArrowRight className="h-3 w-3 ml-1" />
                                </div>}
                              </div>
                           </div>
                         )}

                         {item.kind === 'project' && (
                           <div>
                              <h3 className="font-bold text-slate-900 mb-1">{item.data.title}</h3>
                              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-2">
                                 <span className="bg-slate-100 px-2 py-0.5 rounded">{item.data.status}</span>
                                 <span>•</span>
                                 <span>{item.data.location}</span>
                              </div>
                           </div>
                         )}

                          {item.kind === 'promise' && (
                           <div>
                              <h3 className="font-bold text-slate-900 mb-1">{item.data.title}</h3>
                              <div className="text-xs text-slate-500">
                                 Linked to: <span className="font-medium text-slate-700">{item.data.politicianName}</span>
                              </div>
                           </div>
                         )}
                      </div>
                   </div>
                 ))}
              </div>
            ) : activeTab === 'posts' ? (
               <div className="space-y-4">
                  {userPosts.length > 0 ? (
                    userPosts.map(post => <PostCard key={post.id} post={post} />)
                  ) : (
                    <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-500">
                       <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                       <p>u/{CURRENT_USER.username} hasn't posted anything yet.</p>
                       <button className="mt-4 text-emerald-600 font-medium hover:underline text-sm">Create your first post</button>
                    </div>
                  )}
               </div>
            ) : (
               <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-500">
                  <p>This section is under construction.</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default UserProfile;