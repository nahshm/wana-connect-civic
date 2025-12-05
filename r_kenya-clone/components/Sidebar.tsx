import React from 'react';
import { Home, Zap, Users, BookOpen, BarChart2, TrendingUp, Settings, MapPin, MessageCircle } from 'lucide-react';
import { MOCK_COMMUNITIES } from '../constants';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-slate-200 fixed left-0 top-0 pt-16 z-40 overflow-y-auto">
      
      {/* Main Navigation */}
      <div className="px-4 py-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Platform</h3>
        <nav className="space-y-1">
          <Link to="/" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive('/') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'}`}>
            <Home className="mr-3 h-5 w-5" />
            Home Feed
          </Link>
          <Link to="/community" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive('/community') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'}`}>
            <MessageCircle className="mr-3 h-5 w-5" />
            Community Forums
          </Link>
          <Link to="/action-hub" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive('/action-hub') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'}`}>
            <Zap className="mr-3 h-5 w-5" />
            Action Hub
          </Link>
           <Link to="/education" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive('/education') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'}`}>
            <BookOpen className="mr-3 h-5 w-5" />
            Civic Toolkit
          </Link>
        </nav>
      </div>

      {/* Communities */}
      <div className="px-4 py-4 border-t border-slate-100">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your Communities</h3>
        <nav className="space-y-1">
          {MOCK_COMMUNITIES.map((community) => (
            <a key={community.id} href="#" className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 rounded-md hover:bg-slate-50 group">
              <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-500 mr-3 group-hover:bg-emerald-100 group-hover:text-emerald-600 font-bold">
                {community.name.charAt(0)}
              </span>
              <span className="truncate">{community.prefix}{community.name}</span>
            </a>
          ))}
          <button className="flex items-center px-3 py-2 text-sm text-emerald-600 font-medium hover:underline mt-2">
            <TrendingUp className="mr-2 h-4 w-4" />
            View All
          </button>
        </nav>
      </div>

      {/* Tracking */}
      <div className="px-4 py-4 border-t border-slate-100">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tracking</h3>
        <nav className="space-y-1">
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 rounded-md hover:bg-slate-50">
            <BarChart2 className="mr-3 h-5 w-5 text-slate-400" />
            Promise Tracker
          </a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 rounded-md hover:bg-slate-50">
            <MapPin className="mr-3 h-5 w-5 text-slate-400" />
            Project Map
          </a>
        </nav>
      </div>
      
       <div className="mt-auto px-4 py-4 border-t border-slate-100">
          <div className="flex items-center px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 cursor-pointer">
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </div>
       </div>

    </div>
  );
};

export default Sidebar;