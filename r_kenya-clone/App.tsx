import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Feed from './components/Feed';
import ActionHub from './components/ActionHub';
import CommunityPage from './components/CommunityPage';
import CivicAssistant from './components/CivicAssistant';
import UserProfile from './components/UserProfile';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Navbar />
        
        <div className="flex pt-16">
          <Sidebar />
          
          <main className="flex-1 md:ml-64 relative min-h-[calc(100vh-4rem)]">
            <Routes>
              <Route path="/" element={<Feed />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/action-hub" element={<ActionHub />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="*" element={<Feed />} /> {/* Fallback */}
            </Routes>
          </main>
        </div>

        <CivicAssistant />
      </div>
    </Router>
  );
}

export default App;