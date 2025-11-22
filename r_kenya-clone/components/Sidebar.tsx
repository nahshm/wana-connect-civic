import React from 'react';
import { SUBREDDIT_RULES, FLAIRS, RELATED_SUBS } from '../constants';
import { Shield, Mail, Cake, Circle, ChevronDown, ChevronRight } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const [rulesOpen, setRulesOpen] = React.useState<number[]>([]);

  const toggleRule = (id: number) => {
    setRulesOpen(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col gap-4">
      
      {/* About Community */}
      <div className="bg-reddit-gray rounded-md border border-reddit-border overflow-hidden">
        <div className="bg-reddit-dark p-3 flex justify-between items-center text-xs font-bold text-white">
          <span>About Community</span>
          <button><MoreHorizontalIcon /></button>
        </div>
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white bg-black">
                <img src="https://styles.redditmedia.com/t5_2t74u/styles/communityIcon_ln7j30467w761.png" className="w-full h-full object-cover" alt="r/Kenya" />
             </div>
             <span className="text-base font-medium">r/Kenya</span>
          </div>
          <p className="text-sm text-reddit-text mb-4">
            Welcome to the official Kenyan community on Reddit. This is a dynamic space for everything Kenyan. Karibu.
          </p>
          
          <div className="flex items-center text-sm text-reddit-textMuted mb-4 gap-2">
            <Cake size={16} />
            <span>Created Nov 14, 2009</span>
          </div>

          <div className="flex justify-between border-b border-reddit-border pb-3 mb-3">
             <div className="flex flex-col">
                <span className="text-base font-bold text-white">117k</span>
                <span className="text-xs text-reddit-textMuted">Members</span>
             </div>
             <div className="flex flex-col">
                <span className="text-base font-bold text-white flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                    489
                </span>
                <span className="text-xs text-reddit-textMuted">Online</span>
             </div>
             <div className="flex flex-col">
                <span className="text-base font-bold text-white">Top 1%</span>
                <span className="text-xs text-reddit-textMuted">Ranked by Size</span>
             </div>
          </div>

          <button className="w-full bg-white text-black font-bold py-1.5 rounded-full hover:bg-gray-200 transition-colors mb-2">
            Create Post
          </button>
        </div>
      </div>

      {/* Rules */}
      <div className="bg-reddit-gray rounded-md border border-reddit-border">
         <div className="p-3 border-b border-reddit-border">
             <h3 className="text-xs font-bold uppercase text-reddit-textMuted">r/Kenya Rules</h3>
         </div>
         <div>
            {SUBREDDIT_RULES.map((rule, idx) => (
               <div key={rule.id} className="border-b border-reddit-border last:border-0">
                  <button 
                    onClick={() => toggleRule(rule.id)}
                    className="w-full flex justify-between items-center p-3 text-sm text-white hover:bg-reddit-hover text-left"
                  >
                     <span className="font-medium mr-2">{idx + 1}. {rule.title}</span>
                     {rulesOpen.includes(rule.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {rulesOpen.includes(rule.id) && (
                      <div className="p-3 text-xs text-reddit-text pt-0">
                          Description for rule "{rule.title}" would go here.
                      </div>
                  )}
               </div>
            ))}
         </div>
      </div>

      {/* Filter by Flair */}
      <div className="bg-reddit-gray rounded-md border border-reddit-border p-3">
         <h3 className="text-xs font-bold uppercase text-reddit-textMuted mb-3">Filter by Flair</h3>
         <div className="flex flex-wrap gap-2">
            {FLAIRS.map(flair => (
                <span 
                    key={flair.id} 
                    className="text-xs px-2 py-1 rounded-full text-white cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: flair.bg }}
                >
                    {flair.text}
                </span>
            ))}
         </div>
      </div>
      
      {/* Related Subreddits */}
      <div className="bg-reddit-gray rounded-md border border-reddit-border p-3">
         <h3 className="text-xs font-bold uppercase text-reddit-textMuted mb-3">Related Subreddits</h3>
         <div className="flex flex-col gap-3">
            {RELATED_SUBS.map(sub => (
                <div key={sub.name} className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                       <div className={`w-8 h-8 rounded-full ${sub.icon}`}></div>
                       <div className="flex flex-col">
                          <span className="text-sm font-medium text-white hover:underline cursor-pointer">{sub.name}</span>
                          <span className="text-xs text-reddit-textMuted">{sub.members}</span>
                       </div>
                   </div>
                   <button className="text-xs font-bold bg-white text-black px-3 py-1 rounded-full hover:bg-gray-200">Join</button>
                </div>
            ))}
         </div>
      </div>

       {/* Moderators */}
       <div className="bg-reddit-gray rounded-md border border-reddit-border p-3">
         <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase text-reddit-textMuted">Moderators</h3>
            <button className="p-1 hover:bg-reddit-hover rounded"><Mail size={16} className="text-reddit-textMuted" /></button>
         </div>
         <ul className="text-xs text-reddit-text font-medium flex flex-col gap-2">
             <li className="flex items-center gap-1"><div className="w-5 h-5 bg-purple-500 rounded text-center">u</div> u/grandboyman</li>
             <li className="flex items-center gap-1"><div className="w-5 h-5 bg-green-500 rounded text-center">u</div> u/AutoModerator</li>
             <li className="flex items-center gap-1"><div className="w-5 h-5 bg-blue-500 rounded text-center">u</div> u/d3vini</li>
             <li className="flex items-center gap-1"><div className="w-5 h-5 bg-red-500 rounded text-center">u</div> u/AlvinAhaoa</li>
             <li className="text-reddit-textMuted text-right cursor-pointer hover:underline">View All Moderators</li>
         </ul>
      </div>

      <div className="text-xs text-reddit-textMuted px-2">
         Reddit, Inc. © 2024. All rights reserved.
      </div>
    </div>
  );
};

// Simple Icon for the header of sidebar widgets
const MoreHorizontalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
)
