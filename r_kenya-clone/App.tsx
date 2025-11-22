import React from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Feed } from './components/Feed';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-reddit-dark text-reddit-text pt-12">
      <Navbar />
      
      {/* Banner */}
      <div className="h-32 sm:h-48 md:h-64 w-full bg-cover bg-center relative" style={{ backgroundImage: 'url("https://styles.redditmedia.com/t5_2t74u/styles/bannerBackgroundImage_1z9z0z8z0z8z.png")' }}>
          <div className="w-full h-full bg-gradient-to-t from-black/60 to-transparent"></div>
          {/* Subreddit Header Info embedded in banner/just below */}
          <div className="absolute -bottom-4 left-0 right-0 max-w-7xl mx-auto px-4 flex items-end">
               <div className="flex items-end gap-4 pb-4">
                   <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full p-1 translate-y-2">
                       <img src="https://styles.redditmedia.com/t5_2t74u/styles/communityIcon_ln7j30467w761.png" className="w-full h-full rounded-full object-cover bg-black" alt="icon" />
                   </div>
                   <div className="mb-3 sm:mb-6">
                       <h1 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2">
                          r/Kenya 
                          <span className="text-sm bg-reddit-accent text-white px-2 py-0.5 rounded-full hidden sm:inline-block font-normal">Check</span>
                        </h1>
                       <span className="text-sm font-medium text-gray-300">r/Kenya</span>
                   </div>
                   <div className="mb-4 sm:mb-7 flex gap-2">
                       <button className="px-6 py-1.5 rounded-full border border-white text-white font-bold hover:bg-white/10 transition-colors text-sm">Create Post</button>
                       <button className="p-1.5 rounded-full border border-white text-white hover:bg-white/10 transition-colors"><BellIcon /></button>
                       <button className="px-6 py-1.5 rounded-full bg-white text-black font-bold hover:opacity-90 transition-colors text-sm">Joined</button>
                   </div>
               </div>
          </div>
      </div>
      
      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-0 sm:px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left/Center Column (Feed) */}
        <div className="md:col-span-2">
          <Feed />
        </div>

        {/* Right Column (Sidebar) - Hidden on mobile */}
        <div className="hidden md:block md:col-span-1">
          <Sidebar />
        </div>
      </div>
    </div>
  );
};

// Helper Icon
const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
)

export default App;
