import React, { useState, useEffect } from 'react';
import { Search, X, User } from 'lucide-react';
import { dbService } from '../lib/database';

export function PlayerSearchModal({ onClose, onSelectPlayer }: { onClose: () => void, onSelectPlayer: (player: any) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersData = await dbService.getAll('profiles');
        
        const filtered = usersData.filter((u: any) => 
          (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (u.phone && u.phone.includes(searchQuery))
        );
        
        setResults(filtered);
      } catch (error) {
        console.warn('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center z-[100] p-4 pt-20">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
        <div className="flex items-center p-4 border-b border-gray-100 shrink-0">
          <Search className="text-gray-400 w-5 h-5 mr-3" />
          <input 
            autoFocus
            type="text" 
            placeholder="Search players by name or phone..." 
            className="flex-1 bg-transparent border-none focus:outline-none text-lg"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Searching...</div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {results.map(user => (
                <div 
                  key={user.id} 
                  className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onSelectPlayer(user)}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.full_name || user.username} className="w-10 h-10 rounded-full mr-4" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold mr-4">
                      {user.full_name ? user.full_name.charAt(0) : user.username ? user.username.charAt(0) : 'U'}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{user.full_name || user.username || 'Unknown User'}</div>
                    {user.phone && <div className="text-xs text-gray-500">{user.phone}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery.trim().length >= 2 ? (
            <div className="p-8 text-center text-gray-500">No players found.</div>
          ) : (
            <div className="p-8 text-center text-gray-500">Start typing to search</div>
          )}
        </div>
      </div>
    </div>
  );
}
