import React from 'react';
import { Search, Bell, Plus, MessageSquare, Menu, User } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-12 bg-reddit-gray border-b border-reddit-border flex items-center justify-between px-4 z-50">
      
      {/* Logo Area */}
      <div className="flex items-center gap-2 lg:w-64">
        <div className="lg:hidden p-1 hover:bg-reddit-hover rounded">
             <Menu size={20} />
        </div>
        <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-reddit-accent rounded-full flex items-center justify-center">
                <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-white"><path d="M16.67,10A1.46,1.46,0,0,0,14.2,9a7.12,7.12,0,0,0-3.85-1.23L11,4.65,13.14,5.1a1,1,0,1,0,.13-0.61L10.82,4a0.31,0.31,0,0,0-.37.24L9.71,7.71A7.14,7.14,0,0,0,5.8,9,1.45,1.45,0,1,0,2.91,11.4A7.17,7.17,0,0,0,5,14.74a4.17,4.17,0,0,0,.09,2.67A1.25,1.25,0,0,0,6.2,18.78,1.26,1.26,0,0,0,7.38,18a4.67,4.67,0,0,1,5.24,0,1.26,1.26,0,0,0,1.18.73,1.25,1.25,0,0,0,1.11-1.37,4.17,4.17,0,0,0,.09-2.67,7.19,7.19,0,0,0,2.12-3.34A1.46,1.46,0,0,0,16.67,10Z"/></svg>
            </div>
            <span className="hidden lg:block text-xl font-bold tracking-tight">reddit</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-2xl px-4">
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-reddit-textMuted" />
            </div>
            <input 
                type="text" 
                placeholder="Search r/Kenya" 
                className="block w-full pl-10 pr-3 py-1.5 border border-reddit-border rounded-full leading-5 bg-[#272729] text-reddit-text placeholder-reddit-textMuted focus:outline-none focus:bg-reddit-dark focus:border-reddit-text hover:bg-reddit-gray hover:border-gray-500 transition-colors sm:text-sm"
            />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-3 text-reddit-text">
         <button className="hidden sm:flex items-center gap-2 hover:bg-reddit-hover px-2 py-1 rounded transition-colors">
            <span className="text-reddit-textMuted hover:text-white"><MessageSquare size={20} /></span>
         </button>
         <button className="hover:bg-reddit-hover p-2 rounded-full relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
         </button>
         <button className="flex items-center gap-2 hover:bg-reddit-hover p-1 rounded transition-colors">
            <div className="flex items-center gap-1 font-medium">
                <Plus size={24} />
                <span className="hidden sm:inline text-sm">Create</span>
            </div>
         </button>
         
         <div className="relative">
             <button className="flex items-center gap-2 hover:bg-reddit-hover p-1 px-2 rounded border border-transparent hover:border-reddit-border transition-colors">
                <div className="w-6 h-6 bg-green-600 rounded relative">
                    <User size={16} className="absolute inset-0 m-auto text-white" />
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-reddit-gray"></div>
                </div>
                <div className="hidden lg:flex flex-col items-start">
                   <span className="text-xs font-medium">User Name</span>
                   <span className="text-[10px] text-reddit-textMuted flex items-center gap-1">1 karma</span>
                </div>
                <ChevronDown size={14} className="text-reddit-textMuted" />
             </button>
         </div>
      </div>
    </nav>
  );
};

// Helper Icon
const ChevronDown = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
)
