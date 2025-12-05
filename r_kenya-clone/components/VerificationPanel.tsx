import React, { useState } from 'react';
import { Verification, VerificationStatus } from '../types';
import { CheckCircle, AlertTriangle, XCircle, Info, ThumbsUp, ThumbsDown, Clock, ExternalLink } from 'lucide-react';

interface VerificationPanelProps {
  verification: Verification;
  onVote?: (type: 'true' | 'misleading' | 'outdated') => void;
  isExpanded?: boolean;
}

const VerificationPanel: React.FC<VerificationPanelProps> = ({ verification, onVote, isExpanded = false }) => {
  const [expanded, setExpanded] = useState(isExpanded);
  
  const getBadgeColor = (status: VerificationStatus) => {
    switch (status) {
      case 'VERIFIED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DISPUTED': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'DEBUNKED': return 'bg-red-50 text-red-700 border-red-200';
      case 'PENDING': return 'bg-slate-50 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'VERIFIED': return <CheckCircle className="h-4 w-4 mr-1.5" />;
      case 'DISPUTED': return <AlertTriangle className="h-4 w-4 mr-1.5" />;
      case 'DEBUNKED': return <XCircle className="h-4 w-4 mr-1.5" />;
      case 'PENDING': return <Clock className="h-4 w-4 mr-1.5" />;
    }
  };

  return (
    <div className="mt-3">
      {/* Summary Header */}
      <div 
        className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${getBadgeColor(verification.status)} ${expanded ? 'rounded-b-none border-b-0' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          {getIcon(verification.status)}
          <span className="font-bold text-sm">Community Verification: {verification.status}</span>
        </div>
        <div className="flex items-center text-xs font-mono opacity-80">
          <span className="font-bold mr-1">{verification.truthScore}%</span> Truth Score
          <Info className="h-3 w-3 ml-2" />
        </div>
      </div>

      {/* Expanded Detail Panel */}
      {expanded && (
        <div className="bg-slate-50 border border-t-0 border-slate-200 rounded-b-lg p-3 text-sm animate-in fade-in slide-in-from-top-1">
          <div className="text-slate-600 mb-3 text-xs leading-relaxed">
            Based on <span className="text-slate-900 font-bold">{verification.totalVotes}</span> community votes. 
            This content has been reviewed by the community.
          </div>

          {/* Voting Progress Bars */}
          <div className="space-y-2 mb-4">
             {/* True */}
             <div className="flex items-center text-xs">
                <span className="w-20 text-emerald-600 font-medium">Accurate</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full mx-2 overflow-hidden">
                   <div 
                     className="h-full bg-emerald-500" 
                     style={{ width: `${(verification.breakdown.true / verification.totalVotes) * 100}%` }}
                   ></div>
                </div>
                <span className="w-8 text-right text-slate-500">{verification.breakdown.true}</span>
             </div>
             {/* Misleading */}
             <div className="flex items-center text-xs">
                <span className="w-20 text-yellow-600 font-medium">Misleading</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full mx-2 overflow-hidden">
                   <div 
                     className="h-full bg-yellow-500" 
                     style={{ width: `${(verification.breakdown.misleading / verification.totalVotes) * 100}%` }}
                   ></div>
                </div>
                <span className="w-8 text-right text-slate-500">{verification.breakdown.misleading}</span>
             </div>
             {/* Outdated */}
             <div className="flex items-center text-xs">
                <span className="w-20 text-red-600 font-medium">Outdated</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full mx-2 overflow-hidden">
                   <div 
                     className="h-full bg-red-500" 
                     style={{ width: `${(verification.breakdown.outdated / verification.totalVotes) * 100}%` }}
                   ></div>
                </div>
                <span className="w-8 text-right text-slate-500">{verification.breakdown.outdated}</span>
             </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
             <div className="text-xs text-slate-500">Vote on accuracy:</div>
             <div className="flex space-x-2">
                <button className="p-1.5 hover:bg-slate-200 rounded text-emerald-600" title="Mark as Accurate">
                   <ThumbsUp className="h-4 w-4" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded text-yellow-600" title="Mark as Misleading">
                   <AlertTriangle className="h-4 w-4" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded text-red-600" title="Mark as Outdated">
                   <Clock className="h-4 w-4" />
                </button>
             </div>
          </div>
          
          <button className="w-full mt-3 flex items-center justify-center text-xs text-blue-600 hover:text-blue-500 py-1">
             <ExternalLink className="h-3 w-3 mr-1" />
             View Evidence Links
          </button>
        </div>
      )}
    </div>
  );
};

export default VerificationPanel;