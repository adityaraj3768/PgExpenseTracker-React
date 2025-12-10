import React, { useEffect, useState } from 'react';
import {Plus,Users,ArrowRight,TrendingUp,LogIn,LogOut,User,Globe,Plane,Home,} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import CreateGroupForm from './CreateGroupModal';
import JoinGroupModal from './JoinGroupModal';
import axios from 'axios';
import { GroupDashboard } from './GroupDashboard';
import { useGroup } from '../Context/GroupContext';
import { useUser } from '../Context/CurrentUserIdContext';
import { getApiUrl } from "../Utils/api";
import { checkNotificationSetup } from '../Utils/firebase';

import { getDeviceToken } from "../Utils/getDeviceToken";

export function LandingPage({
  
  onLogin: handleLoginClick,
  onLogout,
  
  isAuthenticated = false,
}) {
  const [showCreateGroupModal,setShowCreateGroupModal]=useState(false)
  const [showJoinGroupModal,setShowJoinGroupModal]=useState(false)
  const [showGroupSelectionModal,setShowGroupSelectionModal]=useState(false)
  const [userGroups, setUserGroups] = useState([])
  const [cachedGroups, setCachedGroups] = useState(null);
  const [isPreloadingGroups, setIsPreloadingGroups] = useState(false);
  
  const [hoveredCard, setHoveredCard] = useState(null);
  const [token, setToken] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const { setCurrentGroup, fetchAllGroups, fetchGroup, setCoins, setMonthlyLimit, setRemainingCoins } = useGroup();
  const { currentUserId } = useUser();
   

  // Check token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(true);
      
      // Preload group metadata in background (no await, fire-and-forget)
      preloadGroupMetadata(storedToken);
      
      // Check notification setup for already logged in users
      // If user is logged in, check notification setup
      // NOTE: We intentionally do NOT auto-run notification setup here on page load
      // because it can trigger network requests (and permission prompts) when the
      // user simply opens the app. Notification/device registration will be
      // performed later when the user visits the dashboard or explicitly enables
      // notifications.
    }
  }, [currentUserId]);

  const handleLogin = () => {
    if (handleLoginClick) {
      handleLoginClick();
    } else {
      navigate('/login');
    }
  };

  
  const handleLogout = async () => {
  setIsLoggingOut(true);
  let deviceToken = null;

  try {
    deviceToken = await getDeviceToken();
  } catch (e) {
    // console.log("Failed to get device token:", e);
  }

  try {
    await axios.delete(
      getApiUrl('/pg/logout'),
      {
        data: { deviceToken }, // IMPORTANT FIX
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Logout only if API succeeds
    localStorage.removeItem('token');
    setToken(false);
    if (onLogout) onLogout();

  } catch (error) {
    // console.log("Logout API error:", error.response?.data || error);
    alert("Logout failed. Try again.");
    setIsLoggingOut(false);
  }
};

  // Background preload of group metadata (fire-and-forget)
  const preloadGroupMetadata = async (token) => {
    try {
      setIsPreloadingGroups(true);
      const response = await axios.get(getApiUrl('/pg/group-metadata'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (Array.isArray(response.data)) {
        setCachedGroups(response.data);
      }
    } catch (error) {
      // Silently fail - cache will remain null and user can still click "Enter Group" to fetch
      console.warn('Failed to preload group metadata:', error);
    } finally {
      setIsPreloadingGroups(false);
    }
  };
  //this will show the create group modal
  const onCreateGroup=()=>{
      setShowCreateGroupModal(true)
    }

  //this will show the join group modal 
  const onJoinGroup=()=>{
    setShowJoinGroupModal(true)
  }
  


  //this will help to fetch user's groups and show selection modal
  const handleEnterGroup = async () => {
    // Prevent multiple clicks while a request is in progress OR while preloading
    if (isEntering || isPreloadingGroups) return;

    try {
      setIsEntering(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setIsEntering(false);
        alert('You must be logged in to enter a group.');
        return;
      }

      let groups = cachedGroups;

      // If cache is available, use it immediately (fast path)
      if (cachedGroups) {
        if (cachedGroups.length === 0) {
          setIsEntering(false);
          alert('You are not part of any group yet. Please create or join a group first.');
          return;
        }
        
        if (cachedGroups.length === 1) {
          await selectGroup(cachedGroups[0]);
          setIsEntering(false);
          return;
        }
        
        setUserGroups(cachedGroups);
        setShowGroupSelectionModal(true);
        setIsEntering(false);
        return;
      }

      // If cache is still being preloaded, wait for it
      if (isPreloadingGroups) {
        setIsEntering(false);
        return;
      }

      // If cache is empty and not preloading (not preloaded yet), fetch from backend
      const response = await axios.get(getApiUrl('/pg/group-metadata'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      groups = response.data;

      if (Array.isArray(groups) && groups.length > 0) {
        // Cache the result for future use
        setCachedGroups(groups);
        
        if (groups.length === 1) {
          // If user has only one group, fetch full data and enter
          await selectGroup(groups[0]);
          setIsEntering(false);
        } else {
          // If multiple, show selection modal with metadata
          setUserGroups(groups);
          setShowGroupSelectionModal(true);
          setIsEntering(false);
        }
      } else {
        setIsEntering(false);
        alert('You are not part of any group yet. Please create or join a group first.');
      }
    } catch (error) {
      setIsEntering(false);
      alert('Failed to fetch your groups. Please try again.');
    }
  };

  // Function to handle group selection
  const selectGroup = async (group) => {
    // Close the modal immediately and optimistically navigate to dashboard
    setShowGroupSelectionModal(false);

    // Persist metadata immediately and navigate so user sees dashboard right away.
    // The full group will be fetched in background and replace the metadata once loaded.
    try {
      const groupId = group.groupId || group.id || group.group_id || group.code || group.groupCode;
      if (!groupId) {
        alert('Invalid group selected.');
        return;
      }

      // Persist lightweight metadata (skipFetch true prevents another immediate fetch)
      setCurrentGroup(group, { skipFetch: true });
      navigate(`/dashboard/`);

      // Now trigger background fetch of the full group (fire-and-forget)
      // fetchAllGroups is not appropriate here; use fetchGroup from context.
      // We import/use fetchGroup by reading useGroup above.
      try {
        // call fetchGroup in background (no await to keep UI responsive)
        fetchGroup(group);
      } catch (bgErr) {
        // background fetch failed silently; dashboard will show skeleton until it resolves
        console.warn('Background group fetch failed', bgErr);
      }
    } catch (error) {
      alert('Failed to enter the selected group. Please try again.');
    }
  };


  //this will show the enter group modal
  // const onEnterGroup=()=>{
  //     setShowEnterGroupModal(true)
  // }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* --- Top Navigation --- */}
      <div className="absolute top-0 right-0 p-6 z-10">
        {token ? (
          <div className="flex items-center space-x-4">
            
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors border border-white/20 backdrop-blur-sm ${
                isLoggingOut 
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-60' 
                  : 'text-gray-600 hover:text-red-600 hover:bg-red-50 bg-white/70'
              }`}
            >
              {isLoggingOut ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-[1.02] transition-all shadow-lg cursor-pointer"
          >
            <LogIn className="h-5 w-5 mr-2" />
            Login
          </button>
        )}
      </div>

      {/* --- Hero Section --- */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 backdrop-blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            {/* Logo */}
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>

            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              {isAuthenticated
                ? `Welcome back, ${currentUser?.name || ''}!`
                : 'Track Expenses'}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              {isAuthenticated
                ? 'Manage your group expenses effortlessly. Create a new group or join an existing one.'
                : 'Track expenses, and manage group finances effortlessly. Perfect for roommates, friends, and travel groups.'}
            </p>

            

            {/* Action Cards */}
            {token && (
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <ActionCard
                  icon={<Plus className="h-6 w-6 text-white" />}
                  title="Create Group"
                  text="Start a new expense group and invite others to join"
                  color="from-blue-500 to-blue-600"
                  
                  onClick={onCreateGroup}
                  hovered={hoveredCard === 'create'}
                  setHovered={() => setHoveredCard('create')}
                />
                <ActionCard
                  icon={<Users className="h-6 w-6 text-white" />}
                  title="Join Group"
                  text="Enter a group code to join an existing expense group"
                  color="from-indigo-500 to-indigo-600"
                  onClick={onJoinGroup}
                  hovered={hoveredCard === 'join'}
                  setHovered={() => setHoveredCard('join')}
                />
                <ActionCard
                  icon={<LogIn className="h-6 w-6 text-white" />}
                  title="Enter Group"
                  text="Access your existing groups and continue tracking expenses"
                  color="from-green-500 to-green-600"
                  onClick={handleEnterGroup}
                  hovered={hoveredCard === 'enter'}
                  setHovered={() => setHoveredCard('enter')}
                  disabled={isEntering || isPreloadingGroups}
                  loading={isEntering || isPreloadingGroups}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* //for rendering the create group form modal */}
     {showCreateGroupModal && (
  <CreateGroupForm
    onClose={() => setShowCreateGroupModal(false)}
    onEnterGroup={() => { setShowCreateGroupModal(false); handleEnterGroup(); }}
  />
)}
      {/* //for rendering the join group form modal */}
       {showJoinGroupModal && (
    <JoinGroupModal
      onClose={() => setShowJoinGroupModal(false)}
      onEnterGroup={() => { setShowJoinGroupModal(false); handleEnterGroup(); }}
    />
  )}

      {/* Group Selection Modal */}
      {showGroupSelectionModal && (
        <GroupSelectionModal
          groups={userGroups}
          onSelectGroup={selectGroup}
          onClose={() => setShowGroupSelectionModal(false)}
        />
      )}

      {/* --- Features Section --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Choose PG Expense Tracker?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Simplify group expense management with our intuitive and powerful features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Users className="h-6 w-6 text-white" />}
            title="Easy Group Management"
            color="from-green-500 to-green-600"
            description="Create groups instantly and invite members with simple codes"
          />
          <FeatureCard
            icon={<TrendingUp className="h-6 w-6 text-white" />}
            title="Track Together, Hassle-Free"
            color="from-orange-500 to-orange-600"
            description="Effortlessly record group expenses and keep everyone in sync"
          />
          <FeatureCard
            icon={<Plus className="h-6 w-6 text-white" />}
            title="Detailed Analytics"
            color="from-purple-500 to-purple-600"
            description="Track spending patterns and get insights into group expenses"
          />
        </div>
      </div>
    </div>
  );
}

// Reuse COLORS mapping used in CreateGroupModal/AddExpenseModal
const COLORS = {
  FRIENDS: {
    bg: "bg-blue-100",
    hover: "hover:bg-blue-200",
    border: "border-blue-300",
    text: "text-blue-700",
    activeBg: "bg-blue-600",
    activeText: "text-white",
  },
  FAMILY: {
    bg: "bg-green-100",
    hover: "hover:bg-green-200",
    border: "border-green-300",
    text: "text-green-700",
    activeBg: "bg-green-600",
    activeText: "text-white",
  },
  TRIP: {
    bg: "bg-purple-100",
    hover: "hover:bg-purple-200",
    border: "border-purple-300",
    text: "text-purple-700",
    activeBg: "bg-purple-600",
    activeText: "text-white",
  },
  PERSONAL: {
    bg: "bg-yellow-100",
    hover: "hover:bg-yellow-200",
    border: "border-yellow-300",
    text: "text-yellow-700",
    activeBg: "bg-yellow-500",
    activeText: "text-white",
  },
  OTHERS: {
    bg: "bg-gray-100",
    hover: "hover:bg-gray-200",
    border: "border-gray-300",
    text: "text-gray-700",
    activeBg: "bg-gray-600",
    activeText: "text-white",
  },
};

function GroupSelectionModal({ groups, onSelectGroup, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-gray-200 animate-fadeIn">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Choose a Group</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors text-xl font-bold"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* <p className="text-gray-600 text-sm mb-4">
            You’re part of multiple groups. Please choose one to continue:
          </p> */}

          <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-1">
            {(() => {
              if (!Array.isArray(groups) || groups.length === 0) return <div className="text-sm text-gray-500">No groups available</div>;

              // Desired order: Personal, Friends, Trip, Family, Others
              const order = ["PERSONAL", "FRIENDS", "TRIP", "FAMILY", "OTHERS"];
              const normalizeType = (g) => {
                const t = (g.groupType || g.type || g.group_type || "").toString().toUpperCase();
                return order.includes(t) ? t : "OTHERS";
              };

              const sorted = [...groups].sort((a, b) => order.indexOf(normalizeType(a)) - order.indexOf(normalizeType(b)));

              return sorted.map((group) => {
                const typeKey = normalizeType(group);
                const c = COLORS[typeKey] || COLORS.OTHERS;
                const Icon =
                  typeKey === "FRIENDS"
                    ? Users
                    : typeKey === "TRIP"
                    ? Plane
                    : typeKey === "PERSONAL"
                    ? User
                    : typeKey === "FAMILY"
                    ? Home
                    : Globe;

                return (
                  <div
                    key={group.id || group.groupCode || group.code}
                    onClick={() => onSelectGroup(group)}
                    className={`p-4 bg-white border ${c.border || 'border-gray-200'} rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.01] flex items-center justify-between gap-4`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-lg font-medium text-gray-900`}>{group.groupName || group.name || 'Unnamed Group'}</h3>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${c.border || 'border-gray-200'} ${c.text || 'text-gray-700'} ${c.bg || 'bg-gray-100'}`}>{typeKey.charAt(0) + typeKey.slice(1).toLowerCase()}</span>
                        </div>
                        <p className="text-xs text-black-600 mt-1">{group.users?.length || 0} member{(group.users?.length || 0) !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Icon className={`h-7 w-7 md:h-7 md:w-7 ${c.text}`} />
                      <ArrowRight className="w-5 h-5 text-black-400" />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}


// --- Reusable Action Card ---
function ActionCard({ icon, title, text, color, onClick, hovered, setHovered, disabled = false, loading = false }) {
  return (
    <div
      className={`relative group cursor-pointer transform transition-all duration-300 ${
        hovered ? 'scale-105' : ''
      }`}
      onMouseEnter={() => { if (!disabled && typeof setHovered === 'function') setHovered(); }}
      onMouseLeave={() => { if (!disabled && typeof setHovered === 'function') setHovered(null); }}
      onClick={(e) => {
        // If disabled or loading, ignore click
        if (disabled || loading) return;
        if (typeof onClick === 'function') onClick(e);
      }}
      aria-disabled={disabled || loading}
    >
      <div className={`bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 transition-all duration-300 ${disabled || loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white/80'}`}>
        <div className="flex items-center justify-center mb-4">
          <div className={`p-3 bg-gradient-to-r ${color} rounded-xl flex items-center justify-center`}>{icon}</div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{text}</p>
        <div className="flex items-center justify-center text-blue-600 font-medium">
          <span className="inline-flex items-center">
            {loading ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : null}
            {title.includes('Enter') ? (loading ? 'Entering…' : 'Enter Now') : title.includes('Join') ? (loading ? 'Joining…' : 'Join Now') : (loading ? 'Please wait…' : 'Get Started')}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </span>
        </div>
      </div>
    </div>
  );
}

// --- Reusable Feature Card ---
function FeatureCard({ icon, title, description, color }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center mb-4">
        <div className={`p-3 bg-gradient-to-r ${color} rounded-xl`}>{icon}</div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}











