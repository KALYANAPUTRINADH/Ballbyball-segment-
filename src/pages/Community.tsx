import React, { useState, useEffect } from "react";
import { useToast } from "../components/ToastContext";
import { dbService } from '../lib/database';
import { useAuth } from '../contexts/AuthContext';
import { LocationSelectorModal } from '../components/LocationSelectorModal';

import {
  LayoutList,
  UserPlus,
  Mic,
  Radio,
  Users,
  Building2,
  Map,
  Tent,
  MapPin,
  Search,
  X,
  Plus,
  Check,
} from "lucide-react";

const categories = [
  { id: 1, name: "Scorers", icon: LayoutList },
  { id: 2, name: "Umpires", icon: UserPlus },
  { id: 3, name: "Commentators", icon: Mic },
  { id: 4, name: "Streamers", icon: Radio },
  { id: 5, name: "Organisers", icon: Users },
  { id: 6, name: "Academies", icon: Building2 },
  { id: 7, name: "Grounds", icon: Map },
  { id: 8, name: "Box Cricket & Nets", icon: Tent },
];

const locations = [
  "Hyderabad",
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
];

const Community = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [location, setLocation] = useState("Hyderabad");
  const [sport, setSport] = useState("Cricket");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
  const [communityProfiles, setCommunityProfiles] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Directory");
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [skillFilter, setSkillFilter] = useState("All");
  const [isFeedAddModalOpen, setIsFeedAddModalOpen] = useState(false);
  const [feedContent, setFeedContent] = useState("");
  const [feedSkill, setFeedSkill] = useState("Beginner");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await dbService.getAll('community_posts');
        const filteredData = (Array.isArray(data) ? data : []).filter((d: any) => (!d.sport || d.sport === sport) && (!d.location || d.location === location));
        setFeedPosts(filteredData);
      } catch (e) { console.warn(e); }
    };
    if (activeTab === "Activity Feed") {
      fetchPosts();
      const interval = setInterval(fetchPosts, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab, sport, location]);

  useEffect(() => {
    if (!selectedCategory) return;
    const fetchProfiles = async () => {
      try {
        const data = await dbService.getAll('community_profiles');
        setCommunityProfiles((Array.isArray(data) ? data : []).filter((d: any) => d.category === selectedCategory && (!d.sport || d.sport === sport)));
      } catch (e) { console.warn(e); }
    };
    fetchProfiles();
    const interval = setInterval(fetchProfiles, 10000);
    return () => clearInterval(interval);
  }, [selectedCategory]);

  const handleAddProfile = async () => {
    if (!newName.trim() || !newDetails.trim()) return;
    setLoading(true);
    try {
      await dbService.create('community_profiles', {
        category: selectedCategory,
        name: newName,
        details: newDetails,
        location: location,
        sport: sport,
        createdAt: new Date().toISOString()
      });
      setIsAddModalOpen(false);
      setNewName("");
      setNewDetails("");
      showToast("Profile added successfully!");
    } catch (e) {
      console.warn(e);
      showToast("Error adding profile");
    }
    setLoading(false);
  };
  const handleAddFeedPost = async () => {
    if (!feedContent.trim()) return;
    setLoading(true);
    try {
      await dbService.create('community_posts', {
          content: feedContent,
          location: location,
          sport: sport,
          skillLevel: feedSkill,
          authorName: user?.displayName || "You",
          createdAt: new Date().toISOString()
      });
      setIsFeedAddModalOpen(false);
      setFeedContent("");
      showToast("Post added successfully!");
      // Re-fetch immediately
      const data = await dbService.getAll('community_posts');
      const filteredData = (Array.isArray(data) ? data : []).filter((d: any) => (!d.sport || d.sport === sport) && (!d.location || d.location === location));
      setFeedPosts(filteredData);
    } catch (e) {
      console.warn(e);
      showToast("Error adding post");
    }
    setLoading(false);
  };

  const [viewedProfiles, setViewedProfiles] = useState<any[]>([]);

  const filteredLocations = locations.filter((l) =>
    l.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full bg-white pb-16">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-sm font-bold text-gray-900 flex items-center">
            Community in
            <button
              onClick={() => setShowLocationModal(true)}
              className="ml-1 text-[#d11a2a] hover:underline flex items-center bg-red-50 px-2 py-0.5 rounded-md"
            >
              <MapPin className="w-3 h-3 mr-1" />
              {location}
            </button>
          </h1>
          <select 
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none"
          >
                        <option>Cricket</option>
            <option>Football</option>
            <option>Basketball</option>
            <option>Tennis</option>
            <option>Pickleball</option>
            <option>Hockey</option>
            <option>Volleyball</option>
            <option>Badminton</option>
            <option>Table Tennis</option>
            <option>Other</option>
          </select>
        </div>

        <div className="flex space-x-2 mb-4 bg-slate-50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("Directory")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === "Directory" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Directory
          </button>
          <button
            onClick={() => setActiveTab("Activity Feed")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === "Activity Feed" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Activity Feed
          </button>
        </div>

        {activeTab === "Directory" && (
          <>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex flex-col items-center justify-center border rounded-lg p-4 space-y-3 transition-colors shadow-sm ${selectedCategory === cat.name ? "border-[#d11a2a] bg-red-50" : "border-gray-200 hover:bg-slate-50"}`}
            >
              <cat.icon
                size={32}
                strokeWidth={1.5}
                className={
                  selectedCategory === cat.name
                    ? "text-[#d11a2a]"
                    : "text-gray-800"
                }
              />
              <span
                className={`text-[11px] font-semibold text-center leading-tight ${selectedCategory === cat.name ? "text-[#d11a2a]" : "text-gray-800"}`}
              >
                {cat.name}
              </span>
            </button>
          ))}
        </div>

        {selectedCategory && (
          <div className="mt-8 border-t border-slate-200 pt-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              {selectedCategory} in {location}
            </h2>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>
                Connecting to local {selectedCategory.toLowerCase()} database...
              </p>
              <p className="text-sm mt-1">
                Found {communityProfiles.length} active profiles in your area.
              </p>
              <div className="mt-6 flex justify-center items-center space-x-3">
                <button onClick={() => {
                  setViewedProfiles(communityProfiles);
                  setIsViewAllModalOpen(true);
                }} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors">
                  View All {selectedCategory}
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-[#d11a2a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 shadow-sm transition-colors flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add New{" "}
                  {selectedCategory.endsWith("s")
                    ? selectedCategory.slice(0, -1)
                    : selectedCategory}
                </button>
              </div>
            </div>
          </div>
        )}
        </>
      )}

      {activeTab === "Activity Feed" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none"
            >
              <option value="All">All Skill Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Pro">Pro</option>
            </select>

            <button
              onClick={() => setIsFeedAddModalOpen(true)}
              className="bg-[#d11a2a] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors flex items-center"
            >
              <Plus className="w-3 h-3 mr-1" />
              Post
            </button>
          </div>

          <div className="space-y-3">
            {feedPosts.filter(p => skillFilter === "All" || p.skillLevel === skillFilter).length > 0 ? (
              feedPosts.filter(p => skillFilter === "All" || p.skillLevel === skillFilter).map(post => (
                <div key={post.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.dispatchEvent(new CustomEvent('openPlayerProfile', { detail: { id: post.authorId || post.id, name: post.authorName, displayName: post.authorName } }))}>
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <span className="text-slate-600 font-bold text-xs">{post.authorName ? post.authorName.charAt(0) : 'U'}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{post.authorName}</p>
                        <div className="flex items-center text-[10px] text-slate-500 space-x-1 mt-0.5">
                          <span>{new Date(post.createdAt || Date.now()).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-600">{post.skillLevel || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                    {post.sport && (
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        {post.sport}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 mt-2">{post.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm">No activity posts found.</p>
                <p className="text-xs mt-1">Be the first to post in {location} for {sport}!</p>
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {isAddModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-[#d11a2a]" />
                Add New{" "}
                {selectedCategory.endsWith("s")
                  ? selectedCategory.slice(0, -1)
                  : selectedCategory}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-sm text-slate-500 mb-4">
                Fill out the details below to add a new{" "}
                {selectedCategory.endsWith("s")
                  ? selectedCategory.slice(0, -1).toLowerCase()
                  : selectedCategory.toLowerCase()}{" "}
                to the community network.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="City or Area"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Experience / Details
                  </label>
                  <textarea
                    placeholder="Tell us more..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a] resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end space-x-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast("Added successfully!");
                  setIsAddModalOpen(false);
                }}
                className="bg-[#d11a2a] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-red-700 shadow-md transition-all active:scale-95 flex items-center"
              >
                <Check className="w-4 h-4 mr-1.5" /> Save
              </button>
            </div>
          </div>
        </div>
      )}


      {isViewAllModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center">
                All {selectedCategory} in {location}
              </h2>
              <button onClick={() => setIsViewAllModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {viewedProfiles.map(profile => (
                <div key={profile.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => window.dispatchEvent(new CustomEvent('openPlayerProfile', { detail: { ...profile, displayName: profile.name } }))}>
                   <div>
                     <h3 className="font-bold text-slate-800">{profile.name}</h3>
                     <p className="text-xs text-slate-500 mt-1">{profile.details}</p>
                   </div>
                   <button className="bg-[#d11a2a] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors" onClick={(e) => { e.stopPropagation(); showToast('Request sent to ' + profile.name); }}>
                     Contact
                   </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {isFeedAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-[#d11a2a]" />
                New Activity Post
              </h2>
              <button
                onClick={() => setIsFeedAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Your Skill Level
                  </label>
                  <select
                    value={feedSkill}
                    onChange={(e) => setFeedSkill(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Pro">Pro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Message
                  </label>
                  <textarea
                    placeholder="What's happening? Looking for a game?"
                    rows={4}
                    value={feedContent}
                    onChange={(e) => setFeedContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a] resize-none"
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end space-x-3">
              <button
                onClick={() => setIsFeedAddModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFeedPost}
                disabled={loading || !feedContent.trim()}
                className={`px-6 py-2 rounded-lg text-sm font-bold shadow-md transition-all flex items-center ${loading || !feedContent.trim() ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-[#d11a2a] text-white hover:bg-red-700 active:scale-95'}`}
              >
                {loading ? 'Posting...' : <><Check className="w-4 h-4 mr-1.5" /> Post</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Selector Modal */}
      <LocationSelectorModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        selectedLocation={location}
        onSelectLocation={(loc) => setLocation(loc)}
        title="Select Community Location (USA & Worldwide)"
      />
    </div>
  );
};
export default Community;
