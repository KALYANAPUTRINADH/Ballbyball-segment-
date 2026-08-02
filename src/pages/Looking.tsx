import React, { useState, useEffect } from 'react';
import { useToast } from '../components/ToastContext';
import { Search, MapPin, MessageSquare, Plus, User, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Removed supabase import
import { dbService } from '../lib/database';
import { useAuth } from '../contexts/AuthContext';



const Looking = () => {
  const { showToast } = useToast();
  const { user, isAdmin } = useAuth();
  const [activeFilter, setActiveFilter] = useState('Opponent');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isYouModalOpen, setIsYouModalOpen] = useState(false);
  const [postCategory, setPostCategory] = useState('Opponent');
  const [postSport, setPostSport] = useState('Cricket');
  const [postText, setPostText] = useState('');
  const [postTime, setPostTime] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [tick, setTick] = useState(0);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Hyderabad (Telangana)');
  const [searchLocation, setSearchLocation] = useState('');
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePost = (id: string) => {
    setPostToDelete(id);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      const success = await dbService.remove('looking_posts', postToDelete);
      if (success) {
        setPosts(prev => prev.filter(p => p.id !== postToDelete));
        showToast("Post deleted successfully");
        setPostToDelete(null);
      } else {
        showToast("Failed to delete post. You may not have permission.", "error");
      }
    } catch(e: any) { 
      console.warn(e); 
      showToast("Error deleting post: " + (e.message || "Unknown error"), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleCompleted = async (id: string, currentState: boolean) => {
    try {
      await dbService.update('looking_posts', id, { is_completed: !currentState });
      setPosts(posts.map(p => p.id === id ? { ...p, is_completed: !currentState } : p));
    } catch (e) {
      console.warn('Error toggling completion:', e);
    }
  };

  const handleContact = (post: any) => {
    if (post.author_phone) {
      window.location.href = `tel:${post.author_phone}`;
    } else {
      showToast(`Contacting ${post.author_name || post.name}... Phone not available.`);
    }
  };
  const popularLocations = [
  'Mumbai (Maharashtra)',
  'Delhi (NCR)',
  'Bangalore (Karnataka)',
  'Hyderabad (Telangana)',
  'Ahmedabad (Gujarat)',
  'Chennai (Tamil Nadu)',
  'Kolkata (West Bengal)',
  'Surat (Gujarat)',
  'Pune (Maharashtra)',
  'Jaipur (Rajasthan)',
  'Lucknow (Uttar Pradesh)',
  'Kanpur (Uttar Pradesh)',
  'Nagpur (Maharashtra)',
  'Indore (Madhya Pradesh)',
  'Thane (Maharashtra)',
  'Bhopal (Madhya Pradesh)',
  'Visakhapatnam (Andhra Pradesh)',
  'Pimpri-Chinchwad (Maharashtra)',
  'Patna (Bihar)',
  'Vadodara (Gujarat)',
  'Ghaziabad (Uttar Pradesh)',
  'Ludhiana (Punjab)',
  'Agra (Uttar Pradesh)',
  'Nashik (Maharashtra)',
  'Ranchi (Jharkhand)',
  'Faridabad (Haryana)',
  'Meerut (Uttar Pradesh)',
  'Rajkot (Gujarat)',
  'Kalyan-Dombivli (Maharashtra)',
  'Vasai-Virar (Maharashtra)',
  'Varanasi (Uttar Pradesh)',
  'Srinagar (Jammu and Kashmir)',
  'Aurangabad (Maharashtra)',
  'Dhanbad (Jharkhand)',
  'Amritsar (Punjab)',
  'Navi Mumbai (Maharashtra)',
  'Allahabad (Uttar Pradesh)',
  'Howrah (West Bengal)',
  'Gwalior (Madhya Pradesh)',
  'Jabalpur (Madhya Pradesh)',
  'Coimbatore (Tamil Nadu)',
  'Vijayawada (Andhra Pradesh)',
  'Jodhpur (Rajasthan)',
  'Madurai (Tamil Nadu)',
  'Raipur (Chhattisgarh)',
  'Kota (Rajasthan)',
  'Guwahati (Assam)',
  'Chandigarh (Chandigarh)',
  'Solapur (Maharashtra)',
  'Hubli-Dharwad (Karnataka)',
  'Mysore (Karnataka)',
  'Tiruchirappalli (Tamil Nadu)',
  'Bareilly (Uttar Pradesh)',
  'Aligarh (Uttar Pradesh)',
  'Tiruppur (Tamil Nadu)',
  'Gurgaon (Haryana)',
  'Moradabad (Uttar Pradesh)',
  'Jalandhar (Punjab)',
  'Bhubaneswar (Odisha)',
  'Salem (Tamil Nadu)',
  'Warangal (Telangana)',
  'Mira-Bhayandar (Maharashtra)',
  'Jalgaon (Maharashtra)',
  'Guntur (Andhra Pradesh)',
  'Thiruvananthapuram (Kerala)',
  'Bhiwandi (Maharashtra)',
  'Saharanpur (Uttar Pradesh)',
  'Gorakhpur (Uttar Pradesh)',
  'Bikaner (Rajasthan)',
  'Amravati (Maharashtra)',
  'Noida (Uttar Pradesh)',
  'Jamshedpur (Jharkhand)',
  'Bhilai (Chhattisgarh)',
  'Cuttack (Odisha)',
  'Firozabad (Uttar Pradesh)',
  'Kochi (Kerala)',
  'Nellore (Andhra Pradesh)',
  'Bhavnagar (Gujarat)',
  'Dehradun (Uttarakhand)',
  'Durgapur (West Bengal)',
  'Asansol (West Bengal)',
  'Rourkela (Odisha)',
  'Nanded (Maharashtra)',
  'Kolhapur (Maharashtra)',
  'Ajmer (Rajasthan)',
  'Akola (Maharashtra)',
  'Gulbarga (Karnataka)',
  'Jamnagar (Gujarat)',
  'Ujjain (Madhya Pradesh)',
  'Loni (Uttar Pradesh)',
  'Siliguri (West Bengal)',
  'Jhansi (Uttar Pradesh)',
  'Ulhasnagar (Maharashtra)',
  'Jammu (Jammu and Kashmir)',
  'Sangli-Miraj & Kupwad (Maharashtra)',
  'Mangalore (Karnataka)',
  'Erode (Tamil Nadu)',
  'Belgaum (Karnataka)',
  'Kurnool (Andhra Pradesh)',
  'Ambattur (Tamil Nadu)',
  'Rajahmundry (Andhra Pradesh)',
  'Tirunelveli (Tamil Nadu)',
  'Malegaon (Maharashtra)',
  'Gaya (Bihar)',
  'Udaipur (Rajasthan)',
];


  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchPosts = async () => {
      try {
        const data = await dbService.getAll('looking_posts');
        if (Array.isArray(data)) setPosts(data);
      } catch (e) { console.warn(e); }
    };
    fetchPosts();
    // Refresh every 10s as a fallback
    const interval = setInterval(fetchPosts, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handlePost = async () => {
    if(!postText.trim() || !user) return;
    try {
      const postData = {
        type: postCategory,
        sport: postSport,
        author_id: user?.uid || 'guest',
        author_name: user?.displayName || 'Guest Player',
        author_phone: user?.phoneNumber || '',
        content: postText,
        location: selectedLocation,
        time: postTime,
        created_at: new Date().toISOString()
      };
      
      const res = await dbService.create('looking_posts', postData);
      
      if (!res) throw new Error('Failed to post');
      
      // refresh posts
      try {
        const data = await dbService.getAll('looking_posts');
        if (Array.isArray(data)) setPosts(data);
      } catch (e) {}
      
      setIsPostModalOpen(false);
      setPostText('');
      setPostTime('');
      showToast('Posted successfully!');
    } catch (err) {
      console.warn(err);
      showToast('Failed to post');
    }
  };

  const getPostedAgo = (timestamp: number) => {
    if (!timestamp) return "Just now";
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return `${Math.max(1, diff)} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const filters = ['Opponent', 'Team to Join', 'Player'];

  const filteredPosts = posts.filter(post => (post.category || post.type) === activeFilter);

  return (
    <div className="flex flex-col h-full bg-gray-100 pb-16 md:pb-6">
      <div className="bg-white sticky top-0 z-10 border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <h1 className="text-[15px] font-bold text-teal-600">Looking for Players, Teams or Opponents?</h1>
          <div className="flex space-x-2">
            <button className="flex items-center space-x-1 bg-teal-600 text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-teal-700 transition-colors" onClick={() => setIsPostModalOpen(true)}>
              <Plus size={14} />
              <span>Post</span>
            </button>
            <button className="flex items-center space-x-1 bg-teal-600 text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-teal-700 transition-colors" onClick={() => setIsYouModalOpen(true)}>
              <User size={14} />
              <span>You</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center px-3 py-2 space-x-2 overflow-x-auto hide-scrollbar">
          <button className="text-teal-600 font-bold text-sm underline underline-offset-8 decoration-2 shrink-0 hover:text-teal-800 transition-colors flex items-center gap-1" onClick={() => setIsLocationModalOpen(true)}>
            <MapPin size={16} />
            {selectedLocation}
          </button>
          <div className="w-px h-5 bg-gray-300 mx-1 shrink-0" />
          {filters.map(filter => (
             <button 
               key={filter}
               onClick={() => setActiveFilter(filter)}
               className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                 activeFilter === filter ? 'bg-teal-600 text-white' : 'border border-teal-600 text-teal-600 hover:bg-teal-50'
               }`}
             >
               {filter}
             </button>
          ))}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <div key={post.id} className={`bg-white rounded-lg shadow-sm border ${post.is_completed ? 'border-green-300 opacity-70' : 'border-gray-200'} p-3 hover:shadow-md transition-shadow cursor-pointer`} onClick={() => showToast(`View post by ${post.author_name || post.name}`)}>
              <div className="flex items-start space-x-3 mb-3">
                <div className="relative shrink-0">
                  {post.avatar ? (
                    <img src={post.avatar} alt={post.author_name || post.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                      <span className="text-teal-700 font-bold">{(post.author_name || post.name) ? (post.author_name || post.name).charAt(0).toUpperCase() : 'U'}</span>
                    </div>
                  )}
                  {post.pro && (
                    <div className="absolute -top-1 -right-1 bg-teal-600 text-white text-[8px] font-bold px-1 rounded">
                      PRO
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[15px] text-gray-900 leading-snug">
                    <span className="font-semibold">{post.author_name || post.name}</span> {post.content || post.action}
                  </p>
                  
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      <span>{post.time}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      <span>{post.location || post.ground}</span>
                    </div>
                    {post.sport && (
                      <div className="flex items-center space-x-2 text-sm font-bold text-teal-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        <span>{post.sport}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-gray-400 font-bold text-2xl px-2">
                  {post.type === 'match' ? 'V/S' : '#'}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">{getPostedAgo(post.created_at || post.createdAt)}</span>
                  <div className={`w-4 h-4 rounded-full ${post.is_completed ? 'bg-green-400' : post.type === 'match' ? 'bg-[#d11a2a]' : 'bg-teal-400'}`} />
                </div>
                
                <div className="flex items-center space-x-1 text-teal-600 text-sm font-medium">
                  <MapPin size={16} />
                  <span>{post.distance || post.location || 'Local'}</span>
                </div>
                
                {((user?.uid === (post.author_id || post.authorId)) || isAdmin) ? (
                  <div className="flex space-x-3">
                    {!post.is_completed && (
                      <button className="text-green-600 text-xs font-bold hover:text-green-800" onClick={(e) => { e.stopPropagation(); handleToggleCompleted(post.id, post.is_completed); }}>Mark Completed</button>
                    )}
                    <button className="text-red-500 text-xs font-bold hover:text-red-700" onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}>Delete</button>
                  </div>
                ) : (
                  <button className="flex items-center space-x-1 text-teal-600 text-sm font-medium hover:text-teal-800 transition-colors" onClick={(e) => { e.stopPropagation(); handleContact(post); }}>
                    <MessageSquare size={16} />
                    <span>Contact</span>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            No posts found for this category.
          </div>
        )}
      </div>

      <AnimatePresence>
        {postToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Post?</h3>
                <p className="text-slate-500 text-sm">
                  Are you sure you want to remove this post? This action cannot be undone.
                </p>
              </div>
              <div className="flex border-t border-slate-100">
                <button 
                  onClick={() => setPostToDelete(null)}
                  className="flex-1 py-4 text-slate-600 font-semibold hover:bg-slate-50 transition-colors border-r border-slate-100"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-4 text-rose-600 font-bold hover:bg-rose-50 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isPostModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-teal-600 text-white">
              <h2 className="font-bold text-lg">Create Post</h2>
              <button onClick={() => setIsPostModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Sport / Game Type</label>
              <select 
                className="w-full border rounded-lg p-2 mb-4 focus:ring-2 focus:ring-teal-600 outline-none"
                value={postSport}
                onChange={(e) => setPostSport(e.target.value)}
              >
                <option value="Cricket">Cricket</option>
                <option value="Football">Football</option>
                <option value="Tennis">Tennis</option>
                <option value="Badminton">Badminton</option>
                <option value="Basketball">Basketball</option>
                <option value="Volleyball">Volleyball</option>
                <option value="Table Tennis">Table Tennis</option>
                <option value="Hockey">Hockey</option>
                <option value="Pickleball">Pickleball</option>
                <option value="Other">Other</option>
              </select>

              <label className="block text-sm font-semibold text-gray-700 mb-1">What are you looking for?</label>
              <select 
                className="w-full border rounded-lg p-2 mb-4 focus:ring-2 focus:ring-teal-600 outline-none"
                value={postCategory}
                onChange={(e) => setPostCategory(e.target.value)}
              >
                <option value="Opponent">Opponent to play a match</option>
                <option value="Team to Join">Team to Join</option>
                <option value="Player">Player for my team</option>
              </select>

              
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ground/Location details</label>
              <input 
                type="text"
                className="w-full border rounded-lg p-2 mb-4 focus:ring-2 focus:ring-teal-600 outline-none"
                placeholder="E.g. Open ground, Any Ground, specific location..."
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
              />

              <label className="block text-sm font-semibold text-gray-700 mb-1">Time details</label>
              <input 
                type="datetime-local"
                className="w-full border rounded-lg p-2 mb-4 focus:ring-2 focus:ring-teal-600 outline-none"
                value={postTime}
                onChange={(e) => setPostTime(e.target.value)}
              />

            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button 
                onClick={handlePost}
                className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-teal-700"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {isYouModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-teal-600 text-white">
              <h2 className="font-bold text-lg">Your Posts</h2>
              <button onClick={() => setIsYouModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto h-64">
              {posts.filter(p => (p.author_id || p.authorId) === user?.uid).length > 0 ? (
                posts.filter(p => (p.author_id || p.authorId) === user?.uid).map(post => (
                  <div key={post.id} className="border-b p-3 last:border-0 relative">
                    <p className="font-bold">{post.type || post.category}</p>
                    <p className="text-sm text-gray-600">{post.content || post.ground}</p>
                    <p className="text-xs text-gray-400 mt-1">{getPostedAgo(post.created_at || post.createdAt)}</p>
                    
                    <div className="flex space-x-3 mt-3">
                      {!post.is_completed && (
                        <button onClick={() => handleToggleCompleted(post.id, post.is_completed)} className="text-green-600 text-xs font-semibold hover:text-green-800">
                          Mark Completed
                        </button>
                      )}
                      {post.is_completed && (
                        <span className="text-green-500 text-xs font-bold">Completed</span>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }} className="text-red-500 text-xs font-semibold hover:text-red-700">Delete</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-10">You haven't posted anything yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {isLocationModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center bg-teal-600 text-white">
              <h2 className="font-bold text-lg">Select Location</h2>
              <button onClick={() => setIsLocationModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  className="w-full border rounded-lg pl-9 pr-4 py-2 focus:ring-2 focus:ring-teal-600 outline-none"
                  placeholder="Search city..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {popularLocations
                .filter(loc => loc.toLowerCase().includes(searchLocation.toLowerCase()))
                .map(loc => (
                <button 
                  key={loc}
                  className="w-full text-left px-4 py-3 border-b hover:bg-gray-50 flex items-center justify-between"
                  onClick={() => {
                    setSelectedLocation(loc);
                    setIsLocationModalOpen(false);
                  }}
                >
                  <span className={selectedLocation === loc ? "font-bold text-teal-600" : "text-gray-700"}>{loc}</span>
                  {selectedLocation === loc && <span className="text-teal-600 text-sm font-bold">✓</span>}
                </button>
              ))}
              {searchLocation && popularLocations.filter(loc => loc.toLowerCase().includes(searchLocation.toLowerCase())).length === 0 && (
                <button 
                  className="w-full text-left px-4 py-3 text-teal-600 font-bold hover:bg-gray-50 flex items-center space-x-2"
                  onClick={() => {
                    setSelectedLocation(searchLocation);
                    setIsLocationModalOpen(false);
                  }}
                >
                  <MapPin size={16} />
                  <span>Use "{searchLocation}"</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Looking;
