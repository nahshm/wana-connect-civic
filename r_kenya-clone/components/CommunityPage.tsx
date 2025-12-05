import React, { useState } from 'react';
import { MOCK_HIERARCHY, MOCK_MESSAGES, CURRENT_USER, MOCK_PROJECTS, MOCK_PROMISES } from '../constants';
import { Channel, CommunityLevel, Leader } from '../types';
import { Hash, Volume2, Settings, Mic, Headphones, Plus, Users, Search, Bell, HelpCircle, Shield, Award, MapPin, Menu, X, Hammer, FileText, PlusCircle, AlertCircle } from 'lucide-react';
import VerificationPanel from './VerificationPanel';

const CommunityPage = () => {
  const [activeLevelId, setActiveLevelId] = useState<string>(MOCK_HIERARCHY[0].id);
  const [activeChannelId, setActiveChannelId] = useState<string>('ch_general');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMembersOpen, setMobileMembersOpen] = useState(false);

  const activeLevel = MOCK_HIERARCHY.find(l => l.id === activeLevelId) || MOCK_HIERARCHY[0];
  const activeChannel = activeLevel.channels.find(c => c.id === activeChannelId) || activeLevel.channels[0];

  const categories = ['INFO', 'MONITORING', 'ENGAGEMENT'];

  const getChannelsByCategory = (cat: string) => activeLevel.channels.filter(c => c.categoryId === cat);

  const handleChannelSelect = (channelId: string) => {
    setActiveChannelId(channelId);
    setMobileMenuOpen(false); // Close mobile menu on selection
  };

  // Renderers for UGC Views
  const renderProjectsView = () => (
    <div className="p-4 md:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
         <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center">
             <Hammer className="mr-3 h-8 w-8 text-orange-500" /> 
             User-Reported Projects
           </h2>
           <p className="text-slate-500 text-sm mt-1">Community-tracked development projects in {activeLevel.name}</p>
         </div>
         <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md font-medium flex items-center transition-colors shadow-sm">
            <PlusCircle className="h-5 w-5 mr-2" />
            Report Project
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {MOCK_PROJECTS.map(proj => (
          <div key={proj.id} className="bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all">
            {proj.imageUrl && <img src={proj.imageUrl} alt={proj.title} className="w-full h-48 object-cover" />}
            <div className="p-4">
               <div className="flex justify-between items-start mb-2">
                 <h3 className="font-bold text-lg text-slate-900">{proj.title}</h3>
                 <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                   proj.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                   proj.status === 'STALLED' ? 'bg-red-100 text-red-700' :
                   proj.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                 }`}>{proj.status}</span>
               </div>
               <p className="text-slate-600 text-sm mb-4">{proj.description}</p>
               
               <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded border border-slate-100">
                  <div>
                    <div className="text-slate-400 text-xs uppercase font-bold">Budget</div>
                    <div className="font-mono text-slate-800">{proj.budget}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs uppercase font-bold">Location</div>
                    <div className="text-slate-800">{proj.location}</div>
                  </div>
               </div>

               <VerificationPanel verification={proj.verification} />
               
               <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
                  <span>Updated {proj.lastUpdated}</span>
                  <span>by u/{proj.submittedBy.username}</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPromisesView = () => (
    <div className="p-4 md:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
         <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center">
             <FileText className="mr-3 h-8 w-8 text-purple-600" /> 
             Promise Tracker
           </h2>
           <p className="text-slate-500 text-sm mt-1">Track & verify campaign promises for {activeLevel.name}</p>
         </div>
         <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium flex items-center transition-colors shadow-sm">
            <PlusCircle className="h-5 w-5 mr-2" />
            Log Promise
         </button>
      </div>

      <div className="space-y-4">
        {MOCK_PROMISES.map(prom => (
           <div key={prom.id} className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                 <div className="flex items-center mb-2">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded mr-2">
                       {prom.politicianName}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                       prom.status === 'KEPT' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' :
                       prom.status === 'BROKEN' ? 'border-red-500 text-red-600 bg-red-50' :
                       'border-yellow-500 text-yellow-600 bg-yellow-50'
                    }`}>{prom.status}</span>
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 mb-2">{prom.title}</h3>
                 <p className="text-slate-600 text-sm mb-4">{prom.description}</p>
                 {prom.dueDate && <div className="text-xs text-slate-500 flex items-center"><AlertCircle className="h-3 w-3 mr-1"/> Due: {prom.dueDate}</div>}
              </div>
              
              <div className="w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                 <VerificationPanel verification={prom.verification} isExpanded={true} />
              </div>
           </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-white text-slate-900 relative">
      
      {/* Mobile Backdrop Overlay */}
      {(mobileMenuOpen || mobileMembersOpen) && (
        <div 
          className="absolute inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => {
            setMobileMenuOpen(false);
            setMobileMembersOpen(false);
          }}
        />
      )}

      {/* Left Navigation Wrapper (Levels + Channels) */}
      <div className={`
        flex h-full z-40 transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        absolute inset-y-0 left-0 shadow-2xl md:shadow-none
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* 1. Level Rail (Far Left) - Keep Dark for contrast similar to Discord/Slack logic */}
        <div className="w-[72px] bg-slate-900 flex flex-col items-center py-4 space-y-4 overflow-y-auto no-scrollbar">
          {MOCK_HIERARCHY.map((level) => (
            <div key={level.id} className="relative group flex items-center justify-center w-full shrink-0">
              {activeLevelId === level.id && (
                <div className="absolute left-0 w-1 h-10 bg-white rounded-r-full transition-all"></div>
              )}
              <button
                onClick={() => setActiveLevelId(level.id)}
                className={`w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 flex items-center justify-center text-2xl bg-slate-800 group-hover:bg-emerald-600 ${
                  activeLevelId === level.id ? '!rounded-[16px] !bg-emerald-600' : ''
                }`}
                title={level.name}
              >
                {level.icon}
              </button>
              {/* Tooltip */}
              <div className="hidden md:block absolute left-16 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {level.name}
              </div>
            </div>
          ))}
          <div className="w-8 h-0.5 bg-slate-700 my-2 shrink-0"></div>
          <button className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-slate-800 hover:bg-emerald-600 text-emerald-500 hover:text-white flex items-center justify-center transition-all shrink-0">
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {/* 2. Channel Rail - Light Theme */}
        <div className="w-60 bg-slate-100 flex flex-col border-r border-slate-200">
          {/* Header */}
          <div className="h-12 border-b border-slate-200 flex items-center justify-between px-4 font-bold text-slate-800 shadow-sm shrink-0 bg-white">
            <div className="flex items-center min-w-0">
               <span className="truncate mr-2">{activeLevel.name}</span>
               {activeLevel.type === 'COUNTY' && <Shield className="h-4 w-4 text-emerald-600 shrink-0" />}
               {activeLevel.type === 'CONSTITUENCY' && <MapPin className="h-4 w-4 text-purple-600 shrink-0" />}
            </div>
            {/* Close button for mobile */}
            <button className="md:hidden text-slate-500" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Channels List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-6 px-2 scrollbar-thin scrollbar-thumb-slate-300">
            {categories.map(cat => (
              <div key={cat}>
                <div className="flex items-center justify-between px-2 mb-1 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer uppercase tracking-wide">
                  <span>{cat === 'INFO' ? 'Information' : cat === 'MONITORING' ? 'Civic Monitoring' : 'Community Engagement'}</span>
                  <Plus className="h-3 w-3" />
                </div>
                <div className="space-y-0.5">
                  {getChannelsByCategory(cat).map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => handleChannelSelect(channel.id)}
                      className={`flex items-center w-full px-2 py-1.5 rounded text-slate-600 hover:bg-slate-200 hover:text-slate-900 group transition-all ${
                        activeChannelId === channel.id ? 'bg-slate-200 !text-slate-900 font-bold' : ''
                      }`}
                    >
                      {channel.type === 'VOICE' ? (
                        <Volume2 className="h-5 w-5 mr-1.5 text-slate-500 group-hover:text-slate-700 shrink-0" />
                      ) : channel.type === 'LEADERS' ? (
                        <Award className="h-5 w-5 mr-1.5 text-yellow-600 shrink-0" />
                      ) : channel.type === 'PROJECTS' ? (
                        <Hammer className="h-5 w-5 mr-1.5 text-orange-500 shrink-0" />
                      ) : channel.type === 'PROMISES' ? (
                        <FileText className="h-5 w-5 mr-1.5 text-purple-500 shrink-0" />
                      ) : (
                        <Hash className="h-5 w-5 mr-1.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
                      )}
                      <span className="truncate">{channel.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* User Status Footer */}
          <div className="bg-white border-t border-slate-200 p-2 flex items-center shrink-0">
            <div className="relative">
               <img src={CURRENT_USER.avatarUrl} alt="User" className="w-8 h-8 rounded-full bg-slate-200 object-cover" />
               <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="ml-2 flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">u/{CURRENT_USER.username}</div>
              <div className="text-[10px] text-slate-500 truncate">#{CURRENT_USER.id.substring(0,4)}</div>
            </div>
            <div className="flex items-center space-x-1">
               <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900"><Mic className="h-4 w-4" /></button>
               <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900"><Headphones className="h-4 w-4" /></button>
               <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900"><Settings className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Chat / Content Area - White background */}
      <div className="flex-1 bg-white flex flex-col min-w-0">
        {/* Top Header */}
        <div className="h-12 border-b border-slate-200 flex items-center px-4 bg-white shadow-sm shrink-0 justify-between">
           <div className="flex items-center text-slate-900 font-bold text-lg min-w-0">
              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden mr-3 text-slate-500 hover:text-slate-700"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>

              <div className="flex items-center truncate">
                {activeChannel.type === 'VOICE' ? <Volume2 className="h-5 w-5 mr-2 text-slate-400 shrink-0" /> : <Hash className="h-5 w-5 mr-2 text-slate-400 shrink-0" />}
                <span className="truncate">{activeChannel.name}</span>
                {activeChannel.description && (
                  <>
                    <div className="mx-3 h-4 w-[1px] bg-slate-300 hidden lg:block shrink-0"></div>
                    <span className="text-xs text-slate-500 font-normal hidden lg:block truncate">{activeChannel.description}</span>
                  </>
                )}
              </div>
           </div>
           <div className="flex items-center space-x-3 sm:space-x-4 text-slate-500 shrink-0 ml-2">
              <div className="relative hidden sm:block">
                 <input type="text" placeholder="Search" className="bg-slate-100 border-none text-xs rounded px-2 py-1 w-36 focus:w-48 transition-all text-slate-900 placeholder-slate-500" />
                 <Search className="h-3 w-3 absolute right-2 top-1.5 text-slate-400" />
              </div>
              <Bell className="h-5 w-5 cursor-pointer hover:text-slate-900" />
              <Users 
                className="h-5 w-5 cursor-pointer hover:text-slate-900 xl:hidden" 
                onClick={() => setMobileMembersOpen(!mobileMembersOpen)}
              />
              <HelpCircle className="h-5 w-5 cursor-pointer hover:text-slate-900 hidden sm:block" />
           </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-900 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          
          {/* View Switcher based on Channel Type/Name */}
          {activeChannel.name === 'our-leaders' ? (
            <div className="p-4 md:p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                 <Award className="mr-3 h-8 w-8 text-yellow-500" /> 
                 Elected Leaders
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {activeLevel.leaders.map(leader => (
                   <div key={leader.id} className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm relative group hover:shadow-md transition-shadow">
                      <div className="absolute top-4 right-4">
                        <div className={`w-3 h-3 rounded-full ${leader.status === 'ONLINE' ? 'bg-green-500' : leader.status === 'BUSY' ? 'bg-red-500' : 'bg-slate-500'} border-2 border-white`} title={leader.status}></div>
                      </div>
                      <div className="flex flex-col items-center text-center">
                         <img src={leader.avatarUrl} alt={leader.name} className="w-24 h-24 rounded-full border-4 border-slate-100 mb-4 object-cover" />
                         <h3 className="text-xl font-bold text-slate-900">{leader.name}</h3>
                         <p className="text-emerald-600 font-medium mb-1">{leader.role}</p>
                         <p className="text-slate-500 text-sm mb-4">Party: {leader.party}</p>
                         
                         <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                           <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${leader.approvalRating || 50}%` }}></div>
                         </div>
                         <div className="text-xs text-slate-500 w-full text-right mb-4">Approval: {leader.approvalRating}%</div>

                         <div className="grid grid-cols-2 gap-2 w-full">
                           <button className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs py-2 rounded font-medium transition-colors border border-purple-200">
                              Log Promise
                           </button>
                           <button className="bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs py-2 rounded font-medium transition-colors border border-orange-200">
                              Review
                           </button>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          ) : activeChannel.name === 'projects-watch' ? (
            renderProjectsView()
          ) : activeChannel.name === 'promises-watch' ? (
            renderPromisesView()
          ) : (
            /* View: Standard Chat */
            <div className="flex flex-col min-h-full justify-end">
               <div className="p-4 space-y-6">
                  {/* Welcome Message */}
                  <div className="mb-8 mt-4 px-4">
                     <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                        <Hash className="h-8 w-8 text-slate-500" />
                     </div>
                     <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to #{activeChannel.name}!</h1>
                     <p className="text-slate-500">This is the start of the {activeChannel.name} channel within the {activeLevel.name} community.</p>
                  </div>

                  {/* Messages */}
                  {MOCK_MESSAGES.map((msg) => (
                    <div key={msg.id} className="flex group px-4 hover:bg-slate-100 py-1 -mx-4 transition-colors">
                      <img src={msg.author.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full mr-4 bg-slate-200 cursor-pointer hover:opacity-80 object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className={`font-medium hover:underline cursor-pointer ${msg.author.isOfficial ? 'text-blue-600' : 'text-slate-900'}`}>
                            {msg.author.username}
                          </span>
                          {msg.author.isVerified && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded">BOT</span>}
                          <span className="text-xs text-slate-400">{msg.timestamp}</span>
                        </div>
                        <p className="text-slate-800 leading-relaxed mt-0.5 break-words">
                           {msg.content}
                        </p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        {/* Input Area (Only for Text Channels) */}
        {activeChannel.type === 'TEXT' && (
          <div className="p-4 bg-white border-t border-slate-200 shrink-0">
            <div className="bg-slate-100 rounded-lg p-2.5 flex items-center border border-slate-200">
               <button className="p-1 text-slate-400 hover:text-slate-600 bg-white rounded-full mr-3 shrink-0 shadow-sm border border-slate-200">
                 <Plus className="h-4 w-4" />
               </button>
               <input 
                 type="text" 
                 placeholder={`Message #${activeChannel.name}`} 
                 className="bg-transparent border-none text-slate-900 focus:outline-none flex-1 placeholder-slate-400 min-w-0"
               />
               <div className="flex items-center space-x-2 text-slate-400 shrink-0 ml-2">
                  <Award className="h-5 w-5 hover:text-slate-600 cursor-pointer hidden sm:block" />
                  <MapPin className="h-5 w-5 hover:text-slate-600 cursor-pointer" />
               </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Right Sidebar (Members) - Light Theme */}
      <div className={`
        w-60 bg-slate-50 flex-col border-l border-slate-200 shrink-0 z-40 transition-transform duration-300 ease-in-out
        xl:relative xl:translate-x-0 xl:flex
        absolute inset-y-0 right-0 shadow-2xl xl:shadow-none
        ${mobileMembersOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
         {/* Mobile Header for Right Sidebar */}
         <div className="xl:hidden h-12 border-b border-slate-200 flex items-center justify-between px-4 bg-white">
             <span className="font-bold text-slate-800">Members</span>
             <button onClick={() => setMobileMembersOpen(false)}>
               <X className="h-5 w-5 text-slate-500" />
             </button>
         </div>

         <div className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wide mb-2">
            Leaders - {activeLevel.leaders.length}
         </div>
         <div className="px-2 space-y-1">
            {activeLevel.leaders.map(leader => (
               <div key={leader.id} className="flex items-center p-2 hover:bg-slate-200 rounded cursor-pointer opacity-90 hover:opacity-100 group transition-colors">
                  <div className="relative">
                    <img src={leader.avatarUrl} alt={leader.name} className="w-8 h-8 rounded-full bg-slate-200 object-cover" />
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-50 ${leader.status === 'ONLINE' ? 'bg-green-500' : leader.status === 'BUSY' ? 'bg-red-500' : 'bg-slate-500'}`}></div>
                  </div>
                  <div className="ml-3 min-w-0">
                     <div className="text-sm font-medium text-slate-800 truncate">{leader.name}</div>
                     <div className="text-xs text-blue-500 truncate">{leader.role}</div>
                  </div>
               </div>
            ))}
         </div>

         <div className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wide mt-4 mb-2">
            Online - 3
         </div>
         <div className="px-2 space-y-1">
             <div className="flex items-center p-2 hover:bg-slate-200 rounded cursor-pointer opacity-50 hover:opacity-100 transition-colors">
                  <img src={CURRENT_USER.avatarUrl} className="w-8 h-8 rounded-full bg-slate-200 object-cover" />
                  <div className="ml-3 min-w-0">
                     <div className="text-sm font-medium text-slate-800 truncate">{CURRENT_USER.username}</div>
                  </div>
             </div>
             {/* Mock Online Members */}
             {[1, 2].map((i) => (
                <div key={i} className="flex items-center p-2 hover:bg-slate-200 rounded cursor-pointer opacity-50 hover:opacity-100 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">U{i}</div>
                  <div className="ml-3 min-w-0">
                     <div className="text-sm font-medium text-slate-800 truncate">Citizen_{i}</div>
                  </div>
             </div>
             ))}
         </div>
      </div>

    </div>
  );
};

export default CommunityPage;