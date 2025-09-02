import React, { useEffect, useState } from 'react';
import {Plus,Users,ArrowRight,TrendingUp,LogIn,LogOut,User,} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import CreateGroupForm from './CreateGroupModal';
import JoinGroupModal from './JoinGroupModal';
import axios from 'axios';
import { GroupDashboard } from './GroupDashboard';
import { useGroup } from '../Context/GroupContext';
import { useUser } from '../Context/CurrentUserIdContext';
import { getApiUrl } from "../Utils/api";
import { checkNotificationSetup } from '../Utils/firebase';


export function LandingPage({
  
  onLogin: handleLoginClick,
  onLogout,
  
  isAuthenticated = false,
}) {
  const [showCreateGroupModal,setShowCreateGroupModal]=useState(false)
  const [showJoinGroupModal,setShowJoinGroupModal]=useState(false)
  const [showGroupSelectionModal,setShowGroupSelectionModal]=useState(false)
  const [userGroups, setUserGroups] = useState([])
  
  
  
  const [hoveredCard, setHoveredCard] = useState(null);
  const [token, setToken] = useState(false);
  const navigate = useNavigate();

  const { setCurrentGroup, fetchAllGroups, setCoins } = useGroup();
  const { currentUserId } = useUser();

  // Check token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(true);
      
      // Check notification setup for already logged in users
      // If user is logged in, check notification setup
      if (currentUserId) {
        checkNotificationSetup(currentUserId, fetchAllGroups);
      }
    }
  }, [currentUserId, fetchAllGroups]);

  const handleLogin = () => {
    if (handleLoginClick) {
      handleLoginClick();
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(false);
    if (onLogout) {
      onLogout();
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
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to enter a group.');
        return;
      }
      // Get current month (0-based, so add 1) and year
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      // Fetch only the current month's group data
      const response = await axios.get(getApiUrl(`/pg/my-groups?month=${month}&year=${year}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Log the groups received from the backend
      console.log('Groups received from backend:', response.data.groups);
      //this is the  all groups of the user that he belongs to
      const groups = response.data.groups;

  //this is the user's monthly limit coins
  const coins  = response.data.monthlyLimitCoins;
  setCoins(coins);

      if (Array.isArray(groups) && groups.length > 0) {
        if (groups.length === 1) {
          // If user has only one group, enter directly
          selectGroup(groups[0]);
        } else {
          // If user has multiple groups, show selection modal
          setUserGroups(groups);
          setShowGroupSelectionModal(true);
        }
      } else if (groups && groups.id) {
        // Handle case where API returns single group object instead of array
        selectGroup(groups);
      } else {
        alert('You are not part of any group yet. Please create or join a group first.');
      }
    } catch (error) {
      // Show alert if fetching user groups fails
      alert('Failed to fetch your groups. Please try again.');
    }
  };

  // Function to handle group selection
  const selectGroup = (group) => {
    setCurrentGroup(group);
    localStorage.setItem('currentGroupId', group.id);
    setShowGroupSelectionModal(false);
    navigate(`/dashboard/`);
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
              className="flex items-center px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors bg-white/70 backdrop-blur-sm border border-white/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
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
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* //for rendering the create group form modal */}
     {showCreateGroupModal && (
  <CreateGroupForm
    onClose={() => setShowCreateGroupModal(false)}/>
)}
      {/* //for rendering the join group form modal */}
     {showJoinGroupModal && (
  <JoinGroupModal
    onClose={() => setShowJoinGroupModal(false)}/>
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
          <p className="text-gray-600 text-sm mb-4">
            You’re part of multiple groups. Please choose one to continue:
          </p>

          <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-1">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => onSelectGroup(group)}
                className="p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-400 cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-700">
                      {group.groupName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Code: <span className="font-mono">{group.groupCode}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {group.users?.length || 0} member{group.users?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            ))}
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
function ActionCard({ icon, title, text, color, onClick, hovered, setHovered }) {
  return (
    <div
      className={`relative group cursor-pointer transform transition-all duration-300 ${
        hovered ? 'scale-105' : ''
      }`}
      onMouseEnter={setHovered}
      onMouseLeave={() => setHovered(null)}
      onClick={onClick}
    >
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 hover:bg-white/80 transition-all duration-300">
        <div className="flex items-center justify-center mb-4">
          <div className={`p-3 bg-gradient-to-r ${color} rounded-xl`}>{icon}</div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{text}</p>
        <div className="flex items-center justify-center text-blue-600 font-medium">
          {title.includes('Enter') ? 'Enter Now' : title.includes('Join') ? 'Join Now' : 'Get Started'}
          <ArrowRight className="ml-2 h-4 w-4" />
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











