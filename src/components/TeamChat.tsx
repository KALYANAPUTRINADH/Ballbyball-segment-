import React, { useState, useEffect, useRef } from 'react';
import { Send, Hash, Lock, MoreVertical, Image as ImageIcon, Smile, Phone, Video, Loader2, Users } from 'lucide-react';
import { dbService } from '../lib/database';
import { useAuth } from '../contexts/AuthContext';

export function TeamChat() {
  const { user: currentUser } = useAuth();
  const [activeChannel, setActiveChannel] = useState('general');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [teams, setTeams] = useState<any[]>([]);
  const [activeTeam, setActiveTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeams() {
      if (!currentUser?.phoneNumber) {
        setLoading(false);
        return;
      }
      try {
        const allPlayers = await dbService.getAll('players');
        const myPlayers = allPlayers.filter((p: any) => p.mobileNumber === currentUser.phoneNumber);
        const tIds = myPlayers.map((p: any) => p.teamId).filter(Boolean);
            
        if (tIds.length > 0) {
          const allTeams = await dbService.getAll('teams');
          const myTeams = allTeams.filter((t: any) => tIds.includes(t.id));
          setTeams(myTeams);
          if (myTeams.length > 0) {
            setActiveTeam(myTeams[0]);
          }
        }
      } catch (error) {
        console.warn('Error fetching teams:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTeams();
  }, [currentUser]);

  useEffect(() => {
    if (!activeTeam) return;
    
    const unsubscribe = dbService.subscribe(
      'team_chat', 
      { team_id: activeTeam.id.toString() }, 
      (data) => {
        setMessages(data.map((m: any) => ({
           id: m.id,
           senderId: m.sender_id,
           senderName: m.sender_name,
           text: m.message,
           content: m.message, // Ensure content is mapped
           user: m.sender_name,
           userId: m.sender_id,
           role: 'Player',
           time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
        })));
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      },
      'created_at'
    );
      
    return () => unsubscribe();
  }, [activeChannel, activeTeam]);

  const handleSend = async () => {
    if (!message.trim() || !currentUser || !activeTeam) return;
    const msgContent = message;
    setMessage('');
    try {
      await dbService.create('team_chat', {
        team_id: activeTeam.id.toString(),
        channel: activeChannel,
        message: msgContent,
        sender_name: currentUser.displayName || currentUser.phoneNumber || 'Player',
        sender_id: currentUser.uid,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.warn("Error sending message: ", error);
    }
  };

  const channels = [
    { id: 'general', name: 'General', type: 'public' },
    { id: 'tactics', name: 'Tactics & Strategy', type: 'private' },
    { id: 'recruitment', name: 'Recruitment', type: 'private' }
  ];

  if (loading) {
    return (
      <div className="flex flex-col h-[600px] items-center justify-center space-y-3 bg-white rounded-xl border border-slate-200">
        <Loader2 className="w-8 h-8 text-[#d11a2a] animate-spin" />
        <p className="text-slate-500 font-medium">Loading teams...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col h-[600px] items-center justify-center space-y-3 bg-white rounded-xl border border-slate-200">
        <Lock className="w-12 h-12 text-slate-300" />
        <h2 className="text-lg font-bold text-slate-800">Sign in required</h2>
        <p className="text-slate-500 font-medium">Please sign in to access Team Chat.</p>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex flex-col h-[600px] items-center justify-center space-y-3 bg-white rounded-xl border border-slate-200">
        <Users className="w-12 h-12 text-slate-300" />
        <h2 className="text-lg font-bold text-slate-800">No Teams</h2>
        <p className="text-slate-500 font-medium">You need to be part of a team to use chat.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-[600px] flex flex-col overflow-hidden">
      {/* Team Selection Header */}
      <div className="bg-white p-3 border-b border-slate-200 flex space-x-2 overflow-x-auto hide-scrollbar shrink-0">
        {teams.map(team => (
          <button 
            key={team.id}
            onClick={() => setActiveTeam(team)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center shrink-0 transition-colors ${
              activeTeam?.id === team.id ? 'bg-[#d11a2a] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users size={16} className="mr-2" /> {team.name}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-slate-50 border-r border-slate-200 flex-col hidden sm:flex shrink-0">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold text-slate-900">Team Comms</h2>
            <p className="text-xs text-slate-500">{activeTeam?.name}</p>
          </div>
          <div className="p-2 flex-1 overflow-y-auto">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Channels</div>
            {channels.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveChannel(c.id)}
                className={`w-full flex items-center px-2 py-2 rounded-lg text-sm transition-colors ${
                  activeChannel === c.id ? 'bg-[#d11a2a]/10 text-[#d11a2a] font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {c.type === 'private' ? <Lock className="w-4 h-4 mr-2" /> : <Hash className="w-4 h-4 mr-2" />}
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
            <div className="flex items-center min-w-0">
              {channels.find(c => c.id === activeChannel)?.type === 'private' ? <Lock className="w-5 h-5 mr-2 text-slate-400 shrink-0" /> : <Hash className="w-5 h-5 mr-2 text-slate-400 shrink-0" />}
              <h3 className="font-bold text-slate-900 truncate">{channels.find(c => c.id === activeChannel)?.name}</h3>
            </div>
            <div className="flex items-center space-x-3 text-slate-400 shrink-0">
              <Phone className="w-5 h-5 hover:text-slate-600 cursor-pointer" />
              <Video className="w-5 h-5 hover:text-slate-600 cursor-pointer" />
              <MoreVertical className="w-5 h-5 hover:text-slate-600 cursor-pointer" />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
            {messages.map(msg => {
              const isMe = msg.userId === currentUser?.uid;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-baseline space-x-2 mb-1">
                    <span className="font-bold text-sm text-slate-900">{isMe ? 'You' : msg.user}</span>
                    <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-medium">{msg.role}</span>
                    <span className="text-[10px] text-slate-400">{msg.time}</span>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm break-words ${
                    isMe ? 'bg-[#d11a2a] text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2 shrink-0">
            {!currentUser ? (
              <div className="flex-1 text-center text-sm text-slate-500 py-2">
                Please sign in to send messages.
              </div>
            ) : (
              <>
                <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100 shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </button>
                <div className="flex-1 bg-slate-100 rounded-full flex items-center px-4 py-2 border border-slate-200 focus-within:border-slate-300 focus-within:bg-white transition-colors min-w-0">
                  <input 
                    type="text" 
                    placeholder="Message..." 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm min-w-0"
                  />
                  <button className="text-slate-400 hover:text-slate-600 ml-2 shrink-0">
                    <Smile className="w-5 h-5" />
                  </button>
                </div>
                <button 
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="p-2 bg-[#d11a2a] text-white rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
