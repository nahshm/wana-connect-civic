import React, { useState } from 'react';
import { Search, Bell, PlusCircle, Menu, Hammer, FileText, PenTool } from 'lucide-react';
import { CURRENT_USER } from '../constants';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 fixed top-0 w-full z-50 flex items-center px-4 justify-between shadow-sm">
      
      {/* Logo & Mobile Menu */}
      <div className="flex items-center">
        <button className="md:hidden p-2 mr-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
           <Menu className="h-6 w-6" />
        </button>
        <Link to="/" className="flex items-center space-x-2">
          <div className="bg-emerald-600 text-white font-black text-xl px-2 py-0.5 rounded italic tracking-tighter transform -skew-x-6">
            W
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">
            WanaIQ
          </span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="hidden md:flex flex-1 max-w-xl mx-4 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input 
          type="text" 
          placeholder="Search for c/communities, g/officials, or p/projects..." 
          className="block w-full pl-10 pr-3 py-1.5 border border-slate-300 rounded-md leading-5 bg-slate-50 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all shadow-sm"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        
        {/* UGC Create Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
            className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-full text-sm font-medium transition-colors shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Create</span>
          </button>
          
          {createMenuOpen && (
             <>
              <div className="fixed inset-0 z-10" onClick={() => setCreateMenuOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl border border-slate-200 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <button className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                   <PenTool className="h-4 w-4 mr-3" /> New Post
                </button>
                <button className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                   <FileText className="h-4 w-4 mr-3" /> Log Promise
                </button>
                <button className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition-colors">
                   <Hammer className="h-4 w-4 mr-3" /> Report Project
                </button>
              </div>
             </>
          )}
        </div>
        
        <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full relative transition-colors">
           <Bell className="h-5 w-5" />
           <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <Link to="/profile" className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 p-1 rounded-full border border-transparent hover:border-slate-200 transition-all">
          <img 
            src={CURRENT_USER.avatarUrl} 
            alt="Profile" 
            className="h-8 w-8 rounded-full object-cover border border-slate-200"
          />
          <div className="hidden sm:flex flex-col text-right mr-2">
            <span className="text-xs font-bold text-slate-700">u/{CURRENT_USER.username}</span>
            <span className="text-[10px] text-emerald-600 font-medium">{CURRENT_USER.karma} Karma</span>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;