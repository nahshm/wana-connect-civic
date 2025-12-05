import React from 'react';
import { CIVIC_ACTIONS } from '../constants';
import { Map, FileText, Activity, AlertTriangle, ArrowRight } from 'lucide-react';

const ActionHub = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Action Hub</h1>
        <p className="text-slate-500">Track services, report issues, and engage with your local representatives.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-emerald-600 text-white rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="relative z-10">
             <div className="text-sm font-medium opacity-90 mb-1">Impact Score</div>
             <div className="text-3xl font-bold">Level 4</div>
             <div className="text-xs opacity-75 mt-2">Top 5% in Nairobi County</div>
          </div>
          <Activity className="absolute right-[-10px] bottom-[-10px] h-24 w-24 opacity-20" />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
           <div className="text-sm font-bold text-slate-400 uppercase mb-2">Open Issues</div>
           <div className="text-3xl font-bold text-slate-900">2</div>
           <div className="text-sm text-yellow-600 flex items-center mt-2">
             <AlertTriangle className="h-3 w-3 mr-1" />
             Waiting for response
           </div>
        </div>
         <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
           <div className="text-sm font-bold text-slate-400 uppercase mb-2">Next Deadline</div>
           <div className="text-2xl font-bold text-slate-900">Oct 30</div>
           <div className="text-sm text-slate-500 mt-1">Bursary Application</div>
        </div>
      </div>

      {/* Action Sections */}
      <div className="space-y-8">
        
        {/* Ward Level */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-bold flex items-center text-slate-800">
               <span className="w-2 h-6 bg-blue-500 rounded mr-2"></span>
               Ward Actions (Local)
             </h2>
             <span className="text-xs font-mono bg-slate-200 text-slate-600 px-2 py-1 rounded">Kilimani Ward</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CIVIC_ACTIONS.filter(a => a.type === 'WARD').map(action => (
              <div key={action.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {/* Simplified icon rendering logic */}
                    <Map className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{action.status}</span>
                </div>
                <h3 className="font-bold text-slate-900 mt-3">{action.title}</h3>
                <p className="text-sm text-slate-500 mt-1 mb-3">{action.description}</p>
                <div className="text-blue-600 text-sm font-medium flex items-center">
                  Start Action <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Constituency Level */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-bold flex items-center text-slate-800">
               <span className="w-2 h-6 bg-purple-500 rounded mr-2"></span>
               Constituency Actions
             </h2>
             <span className="text-xs font-mono bg-slate-200 text-slate-600 px-2 py-1 rounded">Dagoretti North</span>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CIVIC_ACTIONS.filter(a => a.type === 'CONSTITUENCY').map(action => (
              <div key={action.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-start justify-between">
                   <div className="p-2 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <FileText className="h-6 w-6" />
                  </div>
                  {action.deadline && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">Due {action.deadline}</span>}
                </div>
                <h3 className="font-bold text-slate-900 mt-3">{action.title}</h3>
                <p className="text-sm text-slate-500 mt-1 mb-3">{action.description}</p>
                <div className="text-purple-600 text-sm font-medium flex items-center">
                  Start Action <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default ActionHub;