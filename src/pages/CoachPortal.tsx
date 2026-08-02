import React from 'react';
import { Users, FileText, Target, Activity, MessageSquare } from 'lucide-react';

export default function CoachPortal() {
  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-full pb-10">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-lg text-gray-900">Tactical Adjustments</h2>
          <Target className="text-[#d11a2a] w-5 h-5" />
        </div>
        <p className="text-sm text-gray-600 mb-4">Set strategies for upcoming matches based on AI opponent analysis.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 hover:bg-blue-50 transition-colors cursor-pointer">
            <Target className="text-blue-600 mb-2 w-6 h-6" />
            <div className="font-bold text-blue-900 text-sm">Bowling Plans</div>
            <div className="text-xs text-blue-700 mt-1">3 active strategies</div>
          </div>
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 hover:bg-emerald-50 transition-colors cursor-pointer">
            <Activity className="text-emerald-600 mb-2 w-6 h-6" />
            <div className="font-bold text-emerald-900 text-sm">Field Settings</div>
            <div className="text-xs text-emerald-700 mt-1">Death overs focus</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-gray-900">Scouting Reports</h2>
          <FileText className="text-[#d11a2a] w-5 h-5" />
        </div>
        <div className="space-y-3">
          <div className="text-center py-6">
            <p className="text-sm text-gray-500">No scouting reports available yet.</p>
          </div>
        </div>
        <button className="w-full mt-4 py-2.5 text-sm text-[#d11a2a] hover:bg-red-50 font-bold border border-[#d11a2a] rounded-lg transition-colors">
          View Full Reports
        </button>
      </div>
      
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h2 className="font-bold text-lg text-gray-900 mb-2">Team Communication</h2>
        <p className="text-sm text-gray-600 mb-4">Broadcast important updates to the squad.</p>
        <button className="flex items-center justify-center w-full py-2.5 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors">
          <MessageSquare className="w-4 h-4 mr-2" /> Message Team
        </button>
      </div>
    </div>
  );
}
