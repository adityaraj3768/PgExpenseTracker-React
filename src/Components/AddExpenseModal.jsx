import { useState, useEffect } from "react";
import axios from 'axios';
import { IndianRupee, X, Plus, Tag, Calendar, Hash, Users, Check } from "lucide-react";
import { useGroup } from "../Context/GroupContext";
import { getApiUrl } from "../Utils/api";
import { toast } from "react-hot-toast";

export const AddExpenseModal = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [allGroups, setAllGroups] = useState([]);
  const [selectedGroupsForExpense, setSelectedGroupsForExpense] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  
  const { fetchGroup, currentGroup, fetchAllGroups: contextFetchAllGroups } = useGroup();

 const commonTags = [
  // 🍴 Food & Snacks
  "canteen", "mess", "maggi", "chai", "coffee", "snacks",
  "pizza", "burger", "cold drink", "fast food",

  // 🏠 Hostel / PG Essentials
  "rent", "electricity", "water", "laundry", "cleaning",

  // 📚 Study & College Stuff
  "stationery", "books", "photocopy", "printing", "exam fees",

  // 🚌 Travel
  "bus", "auto", "cab", "fuel", "metro",

  // 🎉 Lifestyle & Fun
  "movie", "outing", "party", "gaming", "subscription",

  // 🛒 Household / Groceries (your original list)
  "grocery", "vegetables", "fruits", "bread", "paneer", "milk",
  "gas", "rice", "dal", "atta", "others"
];

  // Helper function to get group ID
  const getGroupId = (group) => group?.groupCode || group?.code || group?.id;

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(new Date().toISOString().split("T")[0]);
      // Fetch groups immediately when modal opens
      fetchAllGroups();
    } else {
      // Reset state when modal closes
      setAllGroups([]);
      setSelectedGroupsForExpense([]);
    }
  }, [isOpen, currentGroup]);

  const fetchAllGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const groups = await contextFetchAllGroups();
      setAllGroups(groups || []);
    } catch (error) {
      // Failed to fetch groups
      setAllGroups([]);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (amount && tags.length > 0 && selectedDate && currentGroup) {
      const groupCodes = [
        getGroupId(currentGroup),
        ...selectedGroupsForExpense.map(group => getGroupId(group))
      ];

      const expense = {
        amount: Math.round(parseFloat(amount) * 100) / 100,
        paymentDate: selectedDate,
        tags: tags.filter(tag => tag.trim() !== ''),
        groupCodes: groupCodes
      };

      try {
        const token = localStorage.getItem('token');
        
        await axios.post(
          getApiUrl('/pg/addExpenseToGroups'),
          expense,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        await fetchGroup();
        const totalGroups = groupCodes.length;
        toast.success(`Expense added successfully !`, {
          duration: 2000,
          position: 'top-center',
        });
        handleClose();
      } catch (error) {
        // Failed to add expense
        toast.error('First set your monthly limit', {
          duration: 2000,
          position: 'top-center',
        });
      } finally {
        setIsLoading(false);
      }
    } else if (!currentGroup) {
      toast.error('No group selected. Please select a group first.', {
        duration: 3000,
        position: 'top-center',
      });
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setSelectedDate(new Date().toISOString().split("T")[0]);
    setTags([]);
    setNewTag("");
    setSelectedGroupsForExpense([]);
    setAllGroups([]);
    setIsLoadingGroups(false); // Reset loading state
    onClose();
  };

  const toggleGroupSelection = (group) => {
    const groupId = getGroupId(group);
    
    setSelectedGroupsForExpense(prev => {
      const isSelected = prev.some(selectedGroup => getGroupId(selectedGroup) === groupId);
      
      if (isSelected) {
        return prev.filter(selectedGroup => getGroupId(selectedGroup) !== groupId);
      } else {
        return [...prev, group];
      }
    });
  };

  const addTag = (tag) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTag("");
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleNewTagKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(newTag);
    }
  };

  const suggestedTags = commonTags
    .filter(tag => !tags.includes(tag) && tag.includes(newTag.toLowerCase()))
    .slice(0, 8);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200 rounded-t-2xl flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add New Expense</h2>
            {currentGroup && (
              <div className="text-sm text-gray-600 mt-1">
                <p>
                  Adding to: <span className="font-medium text-blue-600">{currentGroup.groupName || currentGroup.name || 'Current Group'}</span>
                </p>
                {selectedGroupsForExpense.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    + {selectedGroupsForExpense.length} additional group{selectedGroupsForExpense.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form Container with Scroll */}
        <div className="flex-1 overflow-y-auto">
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <IndianRupee className="h-4 w-4 inline mr-1" />
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
              placeholder="0.00"
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="h-4 w-4 inline mr-1" />
              Tags
            </label>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    <strong>{tag}</strong>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:text-blue-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleNewTagKeyPress}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Add tags (e.g., grocery, milk)"
              />
              {newTag && (
                <button
                  type="button"
                  onClick={() => addTag(newTag)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            {suggestedTags.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-600 mb-2">Suggested tags:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Additional Groups Selection */}
          {(allGroups.length > 1 || isLoadingGroups) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Users className="h-4 w-4 inline mr-1" />
                Want to add this expense to more groups?
              </label>
              
              {isLoadingGroups ? (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Loading groups...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const currentGroupId = getGroupId(currentGroup);
                    const otherGroups = allGroups.filter(group => getGroupId(group) !== currentGroupId);

                    if (otherGroups.length === 0) {
                      return <div className="text-sm text-gray-500">No other groups available</div>;
                    }

                    return (
                      <div className="flex flex-wrap gap-2">
                        {otherGroups.map((group) => {
                          const groupId = getGroupId(group);
                          const isSelected = selectedGroupsForExpense.some(selectedGroup => 
                            getGroupId(selectedGroup) === groupId
                          );
                          
                          return (
                            <button
                              key={groupId}
                              type="button"
                              onClick={() => toggleGroupSelection(group)}
                              className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                isSelected 
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                              }`}
                            >
                              {isSelected && (
                                <Check className="h-3 w-3 mr-1" />
                              )}
                              {group.groupName || group.name || 'Unnamed Group'}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!amount || tags.length === 0 || !currentGroup || isLoading}
              className={`flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 ${isLoading ? 'cursor-not-allowed' : ''}`}
            >
              {isLoading ? "Adding..." : "Add Expense"}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};
