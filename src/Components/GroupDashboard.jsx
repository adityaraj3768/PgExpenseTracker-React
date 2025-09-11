import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence} from "framer-motion";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Plus,
  Users,
  TrendingUp,
  IndianRupee,
  ArrowRight,
  ArrowLeft,
  X,
  Copy,
  Check,
  Pencil,
  ArrowLeftRight,
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useSpring, animated } from 'react-spring';

// Context and utilities
import { useGroup } from "../Context/GroupContext";
import { useUser } from "../Context/CurrentUserIdContext";
import { calculateBalances, getTotalExpenses } from "../Utils/Calculation";
import { getApiUrl } from "../Utils/api";

// Components

import { ExpenseList } from "./ExpenseList";
import { MemberList } from "./MemberList";
// Modal for showing member's expenses
function MemberExpensesModal({ isOpen, onClose, member, expenses }) {
  if (!isOpen || !member) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-3 relative flex flex-col border border-gray-800"
          style={{ maxHeight: "85vh" }}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 py-3 rounded-t-2xl">
            <h3 className="text-lg font-bold text-white">
              {member.name || member.username || member.userId}’s Expenses
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Expenses list */}
          <div className="overflow-y-auto px-4 py-3 space-y-3">
            {expenses.length === 0 ? (
              <div className="text-center text-gray-500 py-10 text-sm">
                No expenses found.
              </div>
            ) : (
              [...expenses].reverse().map((expense) => (
                <motion.div
                  key={expense.id || expense._id}
                  className="rounded-xl border border-gray-800 shadow-sm p-3 bg-gray-800/70 hover:bg-gray-800 hover:shadow-md hover:shadow-indigo-500/20 transition-all"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-200">
                      {expense.description}
                    </span>
                    <span className="font-semibold text-green-400">
                      ₹{expense.amount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                    <span>{new Date(expense.paymentDate).toLocaleDateString()}</span>
                  </div>
                  {expense.tags && expense.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {expense.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-indigo-900/50 text-indigo-300 rounded-full text-xs font-medium border border-indigo-800"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>

          {/* Bottom fade effect */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none rounded-b-2xl"></div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


import { AddExpenseModal } from "./AddExpenseModal";
import { Coins } from "./Coins";

// Small popup/modal for adding coins and setting monthly limit
function CoinsPopup({ isOpen, onClose, onSave, onAddCoins, loading, monthlyLimitSet }) {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState("setLimit"); // 'setLimit' or 'addCoins'
  const [loadingButton, setLoadingButton] = useState(null); // 'setLimit' or 'addCoins' or null
  useEffect(() => {
    if (isOpen) {
      setValue("");
      setMode("setLimit");
    }
  }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg p-6 w-80 relative border border-yellow-200">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold mb-2 text-yellow-700">
          {monthlyLimitSet ? "Manage Coins" : "Set Monthly Limit"}
        </h3>
        <label className="block text-sm text-gray-700 mb-1">
          {mode === "setLimit" ? "Coins / Monthly Limit" : "Coins to Add"}
        </label>
        {mode === "setLimit" && (
          <div className="text-xs text-yellow-700 mb-2 bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
            Setting the limit will reset <b>remaining coins</b> and <b>limit</b> to the new value.
          </div>
        )}
        <input
          type="number"
          min="0"
          className="w-full border border-yellow-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-200"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={loading}
        />
        <div className="flex gap-2">
          <button
            className="flex-1 py-2 rounded font-semibold transition-colors bg-[#f1c40f] text-white hover:bg-[#ffb400]"
            onClick={async () => {
              if (value !== "") {
                setLoadingButton("setLimit");
                await onSave(Number(value));
                setLoadingButton(null);
              }
            }}
            disabled={loadingButton === "setLimit" || value === ""}
          >
            {loadingButton === "setLimit" ? "Saving..." : "Set Limit"}
          </button>
          {monthlyLimitSet && (
            <button
              className="flex-1 py-2 rounded font-semibold transition-colors bg-[#2ecc71] text-white hover:bg-[#27ae60]"
              onClick={async () => {
                if (value !== "") {
                  setLoadingButton("addCoins");
                  await onAddCoins(Number(value));
                  setLoadingButton(null);
                }
              }}
              disabled={loadingButton === "addCoins" || value === ""}
            >
              {loadingButton === "addCoins" ? "Adding..." : "Add Coins"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function GroupDashboard() {
  // State for member expenses modal
  const [selectedMember, setSelectedMember] = useState(null);
  const navigate = useNavigate();
  const [selectedMemberExpenses, setSelectedMemberExpenses] = useState([]);
  const { monthlyLimit, setMonthlyLimit, remainingCoins, setRemainingCoins, setCurrentGroup, setTotalExpenses } = useGroup();
  const [showCoinsPopup, setShowCoinsPopup] = useState(false);
  const [savingCoins, setSavingCoins] = useState(false);
  // === STATE MANAGEMENT ===
  const [activeTab, setActiveTab] = useState("expenses");
  const [showAddExpenses, setShowAddExpenses] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  // Group name edit modal state
  const [showEditGroupName, setShowEditGroupName] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupName, setEditingGroupName] = useState(false);

  // Delete confirmation modal state
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for previous months expenses
  const [previousMonthExpenses, setPreviousMonthExpenses] = useState([]);
  const [loadingPrevious, setLoadingPrevious] = useState(false);

  // Cache for previous months' expenses
  const [previousMonthsCache, setPreviousMonthsCache] = useState({});

  // === DATE INITIALIZATION ===
  // Set default month to previous month for better UX
  const today = new Date();
  const initialMonth = today.getMonth();
  const initialYear = today.getFullYear();
  const previousMonth = initialMonth === 0 ? 11 : initialMonth - 1;
  const previousYear = initialMonth === 0 ? initialYear - 1 : initialYear;

  const [selectedMonth, setSelectedMonth] = useState(previousMonth);
  const [selectedYear, setSelectedYear] = useState(previousYear);

  // === CONTEXT HOOKS ===
  const { currentGroup, fetchGroup, fetchInitialGroup, currentBalance } =
    useGroup();
  const { currentUserId } = useUser();

  // === COPY FUNCTIONALITY ===

  /**
   * Copy group code to clipboard for sharing
   */
  const handleCopyGroupCode = async () => {
    try {
      await navigator.clipboard.writeText(currentGroup.groupCode);
      setCopySuccess(true);
      toast.success("Group code copied to clipboard!", {
        duration: 2000,
        position: "top-center",
      });

      // Reset copy success state after 2 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (error) {
  toast.error("Failed to copy group code");
  // Error copying group code to clipboard
    }
  };

  // === EXPENSE DELETION HANDLERS ===

  /**
   * Refreshes group data after an expense is deleted
   * Called after successful deletion to update all calculations
   */
  const handleExpenseDeleted = useCallback(
    (deletedExpenseId, backendData) => {
      // Remove the deleted expense from local state
      if (setCurrentGroup && currentGroup) {
        setCurrentGroup({
          ...currentGroup,
          expenses: (currentGroup.expenses || []).filter(
            (exp) => exp.id !== deletedExpenseId && exp._id !== deletedExpenseId
          ),
        });
      }
      // Update totals and coins if backend returns them
      if (setTotalExpenses && backendData?.user?.totalExpenses !== undefined) {
        setTotalExpenses(backendData.user.totalExpenses);
      }
      if (setRemainingCoins && backendData?.user?.remainingCoins !== undefined) {
        setRemainingCoins(backendData.user.remainingCoins);
      }
      if (setMonthlyLimit && backendData?.user?.monthlyLimitCoins !== undefined) {
        setMonthlyLimit(backendData.user.monthlyLimitCoins);
      }
    },
    [setCurrentGroup, currentGroup, setTotalExpenses, setRemainingCoins, setMonthlyLimit]
  );

  /**
   * Shows the delete confirmation modal
   * Called when user clicks delete button on an expense
   */
  const handleDeleteRequest = useCallback((expense) => {
    setExpenseToDelete(expense);
  }, []);

  /**
   * Performs the actual expense deletion via API
   * Handles success/error states and UI feedback
   */
  const handleDelete = async (expenseId) => {
    const token = localStorage.getItem("token");
    setIsDeleting(true);

    try {
      const response = await axios.delete(getApiUrl(`/pg/delete/expense/${expenseId}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;

      toast.success("Expense deleted successfully!", {
        duration: 3000,
        position: "top-center",
      });

      setExpenseToDelete(null);
      handleExpenseDeleted(expenseId, data);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Something went wrong";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // === COMPUTED VALUES (MEMOIZED) ===

  /**
   * Calculate total expenses across all time periods
   */
  const totalExpense = useMemo(() => {
    return getTotalExpenses(currentGroup?.expenses || []);
  }, [currentGroup?.expenses]);

  /**
   * Filter expenses for current month only
   */
  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return (currentGroup?.expenses || []).filter((expense) => {
      const expenseDate = new Date(expense.paymentDate);
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    });
  }, [currentGroup?.expenses]);

  /**
   * Calculate total for current month expenses
   */
  const totalCurrentMonthExpense = useMemo(() => {
    return getTotalExpenses(currentMonthExpenses);
  }, [currentMonthExpenses]);

  // Calculate total for previous month expenses (fetched from backend)
  const totalPreviousMonthExpense = useMemo(() => {
    return getTotalExpenses(previousMonthExpenses);
  }, [previousMonthExpenses]);

  // === ANIMATED TOTAL EXPENSE ===
  const animatedTotal = useSpring({
    from: { number: 0 },
    to: { number: (
      activeTab === "previous"
        ? totalPreviousMonthExpense
        : activeTab === "expenses"
        ? totalCurrentMonthExpense
        : activeTab === "members"
        ? totalCurrentMonthExpense
        : totalExpense
    ) },
    config: { duration: 900 }, // Faster animation
    reset: true,
  });

  // === UTILITY FUNCTIONS ===

  /**
   * Filter expenses by user ID with multiple matching strategies
   * Handles different user ID formats and name matching
   */
  const getUserExpenses = useCallback((expenses, userId, users) => {
    if (!userId || !users) return [];

    const currentUser = users.find(
      (user) =>
        user.userId === userId ||
        user.userId === String(userId) ||
        String(user.userId) === String(userId)
    );

    return expenses.filter((expense) => {
      return (
        expense.paidBy === userId ||
        expense.userId === userId ||
        expense.paidBy === String(userId) ||
        expense.userId === String(userId) ||
        String(expense.paidBy) === String(userId) ||
        String(expense.userId) === String(userId) ||
        (currentUser && expense.paidBy === currentUser.name) ||
        (currentUser && expense.paidBy === currentUser.username)
      );
    });
  }, []);

  // === USER-SPECIFIC CALCULATIONS ===

  /**
   * Calculate current user's expenses for the current month
   */
  const currentUserCurrentMonthExpense = useMemo(() => {
    if (
      !currentGroup?.users ||
      !currentUserId ||
      !currentMonthExpenses.length
    ) {
      return 0;
    }

    const userExpenses = getUserExpenses(
      currentMonthExpenses,
      currentUserId,
      currentGroup.users
    );
    return userExpenses.reduce(
      (sum, expense) => sum + parseFloat(expense.amount),
      0
    );
  }, [
    currentMonthExpenses,
    currentUserId,
    currentGroup?.users,
    getUserExpenses,
  ]);

  /**
   * Calculate each user's current month expenses for MemberList component
   */
  const currentMonthUserExpenses = useMemo(() => {
    if (!currentGroup?.users || currentMonthExpenses.length === 0) return [];

    return currentGroup.users.map((user) => {
      const userExpenses = getUserExpenses(
        currentMonthExpenses,
        user.userId,
        currentGroup.users
      );
      const totalSpent = userExpenses.reduce(
        (sum, expense) => sum + parseFloat(expense.amount),
        0
      );

      return {
        userId: user.userId,
        totalSpent: totalSpent,
      };
    });
  }, [currentGroup?.users, currentMonthExpenses, getUserExpenses]);
  // === PREVIOUS MONTHS TAB CALCULATIONS ===

  /**
   * Filter expenses based on selected month and year (for Previous Months tab)
   */
  const filteredExpenses = useMemo(() => {
    if (!currentGroup?.expenses) return [];

    return currentGroup.expenses.filter((expense) => {
      const expenseDate = new Date(expense.paymentDate);
      return (
        expenseDate.getMonth() === selectedMonth &&
        expenseDate.getFullYear() === selectedYear
      );
    });
  }, [currentGroup?.expenses, selectedMonth, selectedYear]);

  /**
   * Calculate total expenses for the selected month/year period
   */
  const totalFilteredExpense = useMemo(() => {
    return getTotalExpenses(filteredExpenses);
  }, [filteredExpenses]);

  /**
   * Calculate each user's expenses for the selected month (Previous Months tab)
   */
  const filteredUserExpenses = useMemo(() => {
    if (!currentGroup?.users || filteredExpenses.length === 0) return [];

    return currentGroup.users.map((user) => {
      const userExpenses = getUserExpenses(
        filteredExpenses,
        user.userId,
        currentGroup.users
      );
      const totalSpent = userExpenses.reduce(
        (sum, expense) => sum + parseFloat(expense.amount),
        0
      );

      return {
        userId: user.userId,
        totalSpent: totalSpent,
      };
    });
  }, [currentGroup?.users, filteredExpenses, getUserExpenses]);

  /**
   * Calculate current user's expenses for the selected month (Previous Months tab)
   */
  const currentUserExpense = useMemo(() => {
    if (!currentGroup?.users || !currentUserId || !filteredExpenses.length) {
      return 0;
    }

    const userExpenses = getUserExpenses(
      filteredExpenses,
      currentUserId,
      currentGroup.users
    );
    return userExpenses.reduce(
      (sum, expense) => sum + parseFloat(expense.amount),
      0
    );
  }, [filteredExpenses, currentUserId, currentGroup?.users, getUserExpenses]);

  // Calculate each user's expenses for the selected previous month (from backend)
  const previousMonthUserExpenses = useMemo(() => {
    if (!currentGroup?.users || previousMonthExpenses.length === 0) return [];
    return currentGroup.users.map((user) => {
      const userExpenses = previousMonthExpenses.filter(
        (expense) =>
          expense.paidBy === user.userId ||
          expense.userId === user.userId ||
          expense.paidBy === String(user.userId) ||
          expense.userId === String(user.userId) ||
          String(expense.paidBy) === String(user.userId) ||
          String(expense.userId) === String(user.userId) ||
          (user.name && expense.paidBy === user.name) ||
          (user.username && expense.paidBy === user.username)
      );
      const totalSpent = userExpenses.reduce(
        (sum, expense) => sum + parseFloat(expense.amount),
        0
      );
      return {
        userId: user.userId,
        totalSpent: totalSpent,
      };
    });
  }, [currentGroup?.users, previousMonthExpenses]);

  // Calculate current user's expenses for the selected previous month (from backend)
  const previousMonthCurrentUserExpense = useMemo(() => {
    if (!currentGroup?.users || !currentUserId || previousMonthExpenses.length === 0) {
      return 0;
    }
    // Find the current user object
    const currentUser = currentGroup.users.find(
      (user) =>
        user.userId === currentUserId ||
        user.userId === String(currentUserId) ||
        String(user.userId) === String(currentUserId)
    );
    const userExpenses = previousMonthExpenses.filter(
      (expense) =>
        expense.paidBy === currentUserId ||
        expense.userId === currentUserId ||
        expense.paidBy === String(currentUserId) ||
        expense.userId === String(currentUserId) ||
        String(expense.paidBy) === String(currentUserId) ||
        String(expense.userId) === String(currentUserId) ||
        (currentUser && expense.paidBy === currentUser?.name) ||
        (currentUser && expense.paidBy === currentUser?.username)
    );
    return userExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  }, [previousMonthExpenses, currentUserId, currentGroup?.users]);

  // === EFFECTS ===

  /**
   * Load group data on component mount
   * Fetch initial group if no currentGroup exists, otherwise just set loading to false
   */
  useEffect(() => {
    const loadGroupData = async () => {
      if (!currentUserId) return;

      if (!currentGroup) {
        setIsLoading(true);
        try {
          await fetchInitialGroup();
        } catch (error) {
          // Error fetching initial group data
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadGroupData();
  }, [currentUserId, currentGroup, fetchInitialGroup]);

  // Fetch previous month expenses from backend when tab or month/year changes
  useEffect(() => {
    if (activeTab === "previous") {
      const cacheKey = `${selectedMonth + 1}-${selectedYear}`;
      if (previousMonthsCache[cacheKey]) {
        setPreviousMonthExpenses(previousMonthsCache[cacheKey]);
        return;
      }
      const fetchPreviousExpenses = async () => {
        setLoadingPrevious(true);
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(getApiUrl(`/pg/my-groups?month=${selectedMonth + 1}&year=${selectedYear}`), {
            headers: { Authorization: `Bearer ${token}` },
          });
          // Assume response.data.groups is an array, find current group
          const groups = response.data.groups;
          const groupIdentifier = currentGroup?.groupCode || currentGroup?.code || currentGroup?.id;
          const updatedGroup = Array.isArray(groups)
            ? groups.find(g => g.groupCode === groupIdentifier || g.code === groupIdentifier || g.id === groupIdentifier)
            : groups;
          const expenses = updatedGroup?.expenses || [];
          setPreviousMonthExpenses(expenses);
          setPreviousMonthsCache(prev => ({ ...prev, [cacheKey]: expenses }));
        } catch (err) {
          setPreviousMonthExpenses([]);
        } finally {
          setLoadingPrevious(false);
        }
      };
      fetchPreviousExpenses();
    }
  }, [activeTab, selectedMonth, selectedYear, currentGroup, previousMonthsCache]);

  // === LOADING AND ERROR STATES ===

  // === LOADING AND ERROR STATES ===

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your group.</p>
        </div>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <p className="text-gray-600">
            No group found. Please create or join a group.
          </p>
        </div>
      </div>
    );
  }

  // === RENDER ===

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-900">
      {/* === HEADER === */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Group Information */}
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg mr-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate max-w-48 sm:max-w-none flex items-center gap-1">
                  {currentGroup.groupName}
                  <button
                    className="ml-1 p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors text-xs"
                    title="Edit group name"
                    onClick={() => {
                      setShowEditGroupName(true);
                      setNewGroupName(currentGroup.groupName || "");
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                </h1>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs sm:text-sm text-gray-600">
                    Code: {currentGroup.groupCode}
                  </p>
                  <button
                    onClick={handleCopyGroupCode}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Copy group code"
                  >
                    {copySuccess ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Add Expense Button */}
            <button
              onClick={() => setShowAddExpenses(true)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-[1.02] transition-all text-base"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </button>
          </div>
        </div>
      </header>

      {/* Edit Group Name Modal */}
      {showEditGroupName && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm bg-black/30">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white shadow-2xl rounded-xl p-6 w-[90%] max-w-md mx-4 border border-gray-200 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Group Name</h3>
              <button
                onClick={() => setShowEditGroupName(false)}
                disabled={editingGroupName}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              disabled={editingGroupName}
              placeholder="Enter new group name"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEditGroupName(false)}
                disabled={editingGroupName}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newGroupName.trim()) return;
                  setEditingGroupName(true);
                  try {
                    const token = localStorage.getItem("token");
                    const response = await axios.post(
                      getApiUrl("/pg/update-group-name"),
                      {
                        newGroupName: newGroupName.trim(),
                        groupCode: currentGroup.groupCode,
                      },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    // Update group name in context/state
                    if (response.data) {
                      currentGroup.groupName = response.data;
                      toast.success("Group name updated!");
                    }
                    setShowEditGroupName(false);
                  } catch (err) {
                    toast.error("Failed to update group name");
                  } finally {
                    setEditingGroupName(false);
                  }
                }}
                disabled={editingGroupName || !newGroupName.trim()}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
              >
                {editingGroupName ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* === MAIN CONTENT === */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Coins Card Above Statistics (Clickable) */}
        <div className="mb-6 sm:mb-8">
          {/* If monthly limit is not set, show a prompt to the user */}
          {monthlyLimit === 0 ? (
            <div className="bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 text-gray-900 rounded-2xl px-6 py-4 mb-4 text-center shadow-md">
  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
    <span className="font-semibold text-lg">
      🚀 To set your monthly limit click below👇 
    </span>
  </div>
</div>


          ) : null}
          <div
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20 cursor-pointer hover:shadow-xl transition-shadow outline-none focus:ring-2 focus:ring-yellow-300"
            tabIndex={0}
            title="Click to set monthly limit"
            onClick={() => setShowCoinsPopup(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setShowCoinsPopup(true);
            }}
          >
            {/* Show remaining coins: limit - total spent */}
            <Coins count={remainingCoins} />
            <div className="text-xs text-gray-500 mt-1 mb-2">Remaining coins</div>
            {/* Progress Bar */}
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-1">
              <div
                className={
                  `h-full transition-all duration-500 ` +
                  (monthlyLimit === 0
                    ? 'bg-gray-300'
                    : (monthlyLimit - remainingCoins) / monthlyLimit < 0.5
                    ? 'bg-gradient-to-r from-green-400 to-green-600'
                    : (monthlyLimit - remainingCoins) / monthlyLimit < 0.8
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                    : 'bg-gradient-to-r from-red-400 to-red-600')
                }
                style={{ width: monthlyLimit > 0 ? `${Math.max(0, Math.min(100, (remainingCoins / monthlyLimit) * 100))}%` : '0%' }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>{monthlyLimit} limit</span>
            </div>
          </div>
        </div>
        {/* Coins Popup Modal */}
        <CoinsPopup
          isOpen={showCoinsPopup}
          onClose={() => setShowCoinsPopup(false)}
          loading={savingCoins}
          monthlyLimitSet={monthlyLimit > 0}
          onSave={async (newLimit) => {
            setSavingCoins(true);
            try {
              const token = localStorage.getItem("token");
              const response = await axios.post(
                getApiUrl("/pg/set-monthly-limit"),
                { limit: newLimit },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const updatedLimit =
                typeof response.data === "number"
                  ? response.data
                  : response.data.monthlyLimit ??
                    response.data.monthlyLimit ??
                    response.data.limit ??
                    newLimit;
              setMonthlyLimit(updatedLimit);
              setRemainingCoins(updatedLimit);
              toast.success("Monthly limit updated!");
              setShowCoinsPopup(false);
            } catch (err) {
              // Error updating monthly limit
              toast.error("Failed to update monthly limit");
            } finally {
              setSavingCoins(false);
            }
          }}
          onAddCoins={async (coinsToAdd) => {
            setSavingCoins(true);
            try {
              const token = localStorage.getItem("token");
              const response = await axios.post(
                getApiUrl("/pg/add-coins"),
                { coins: coinsToAdd },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              // Assume backend returns the number of coins added
              const coinsAdded = typeof response.data === "number"
                ? response.data
                : response.data.coins ?? coinsToAdd;
              setMonthlyLimit(monthlyLimit + coinsAdded);
              setRemainingCoins(remainingCoins + coinsAdded);
              toast.success("Coins added!");
              setShowCoinsPopup(false);
            } catch (err) {
              // Error adding coins
              toast.error("Failed to add coins");
            } finally {
              setSavingCoins(false);
            }
          }}
        />
        {/* === STATISTICS OVERVIEW === */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Expenses Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600">
                  Total Expenses
                </p>
                <div className="flex items-center gap-1 sm:gap-2 mt-1">
                  <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <animated.p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    {animatedTotal.number.to(n => n.toFixed(2))}
                  </animated.p>
                </div>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
            </div>
          </div>


          {/* Total Members & Give/Take Cards Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Members Card (Half Width) */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20 flex flex-col justify-between cursor-default">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600">Total Members</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{currentGroup.users?.length || 0}</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 flex-shrink-0" />
              </div>
            </div>
            {/* Give/Take Card (Half Width, Clickable) */}
            <div
              className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20 flex flex-col justify-between cursor-pointer hover:shadow-indigo-200 hover:scale-[1.03] transition-transform"
              onClick={() => navigate('/give-take-dashboard')}
              title="Go to Give & Take Dashboard"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600">Give/Take</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-700 mt-1">Track Now</p>
                </div>
                <ArrowLeftRight className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              </div>
            </div>
          </div>

          {/* Current User's Expenses Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600">
                  Your Total Spent
                </p>
                <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1 truncate">
                  ₹{" "}
                  {activeTab === "previous"
                    ? previousMonthCurrentUserExpense.toFixed(2)
                    : activeTab === "expenses"
                    ? currentUserCurrentMonthExpense.toFixed(2)
                    : activeTab === "members"
                    ? currentUserCurrentMonthExpense.toFixed(2)
                    : typeof currentBalance === "number"
                    ? currentBalance.toFixed(2)
                    : "0.00"}
                </p>
              </div>
              <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center bg-green-100 text-green-600 flex-shrink-0">
                <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* === TABBED CONTENT AREA === */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
          {/* Tab Navigation */}
          <nav className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
            <div className="flex space-x-2 sm:space-x-4 px-4 sm:px-6 min-w-max">
              {/* Current Month Expenses Tab */}
              <button
                onClick={() => setActiveTab("expenses")}
                className={`py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === "expenses"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Expenses ({currentMonthExpenses?.length || 0})
              </button>

              {/* Members Tab */}
              <button
                onClick={() => setActiveTab("members")}
                className={`py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === "members"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Members ({currentGroup.users?.length || 0})
              </button>

              {/* Previous Months Tab */}
              <button
                onClick={() => setActiveTab("previous")}
                className={`py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === "previous"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Previous Months
              </button>
              </div>
          </nav>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {/* Current Month Expenses Content */}
            {activeTab === "expenses" && (
              <ExpenseList
                expenses={currentMonthExpenses || []}
                onExpenseDeleted={handleExpenseDeleted}
                onDeleteRequest={handleDeleteRequest}
              />
            )}

            {/* Members Content */}
            {activeTab === "members" &&
              (Array.isArray(currentGroup.users) &&
              currentGroup.users.length > 0 ? (
                <MemberList
                  users={currentGroup.users}
                  balances={currentMonthUserExpenses}
                  onMemberClick={(member) => {
                    setSelectedMember(member);
                    // Find expenses for this member for the current month
                    const memberExpenses = currentMonthExpenses.filter(
                      (expense) =>
                        expense.paidBy === member.userId ||
                        expense.userId === member.userId ||
                        expense.paidBy === member.name ||
                        expense.paidBy === member.username
                    );
                    setSelectedMemberExpenses(memberExpenses);
                  }}
                />
              ) : (
                <p className="text-center text-gray-500">No members found.</p>
              ))}
      {/* Member Expenses Modal */}
      <MemberExpensesModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
        expenses={selectedMemberExpenses}
      />

            {/* Previous Months Content */}
            {activeTab === "previous" && (
              <>
                {/* Month/Year Selection Controls */}
                <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  {/* Navigation Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (selectedMonth === 0) {
                          setSelectedMonth(11);
                          setSelectedYear((prev) => prev - 1);
                        } else {
                          setSelectedMonth((prev) => prev - 1);
                        }
                      }}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Previous Month"
                    >
                      <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>

                    <span className="text-gray-700 font-medium text-sm sm:text-base px-2 sm:px-4 py-1 bg-gray-50 rounded-lg">
                      {new Date(selectedYear, selectedMonth).toLocaleString(
                        "default",
                        {
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </span>

                    <button
                      onClick={() => {
                        if (selectedMonth === 11) {
                          setSelectedMonth(0);
                          setSelectedYear((prev) => prev + 1);
                        } else {
                          setSelectedMonth((prev) => prev + 1);
                        }
                      }}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Next Month"
                    >
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>

                  {/* Dropdown Selectors */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="flex-1 sm:flex-none border border-gray-300 rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-700 bg-white"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>
                          {new Date(0, i).toLocaleString("default", {
                            month: "long",
                          })}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="flex-1 sm:flex-none border border-gray-300 rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-700 bg-white"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Member Expenses Summary for Selected Month */}
                {activeTab === "previous" && previousMonthExpenses.length > 0 && (
                  loadingPrevious ? (
                    <div className="flex justify-center items-center mb-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Member Expenses for{" "}
                        {new Date(selectedYear, selectedMonth).toLocaleString(
                          "default",
                          {
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </h3>
                      <MemberList
                        users={currentGroup.users}
                        balances={previousMonthUserExpenses}
                      />
                    </div>
                  )
                )}

                {/* Detailed Expense List for Selected Month */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Expense Details
                  </h3>
                  {loadingPrevious ? (
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <ExpenseList
                      expenses={previousMonthExpenses}
                      onExpenseDeleted={handleExpenseDeleted}
                      onDeleteRequest={handleDeleteRequest}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* === MODALS === */}

      {/* Add Expense Modal */}
      {showAddExpenses && (
        <AddExpenseModal
          isOpen={showAddExpenses}
          onClose={() => setShowAddExpenses(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm bg-black/30">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white shadow-2xl rounded-xl p-6 w-[90%] max-w-md mx-4 border border-gray-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Deletion
              </h3>
              <button
                onClick={() => setExpenseToDelete(null)}
                disabled={isDeleting}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete the expense{" "}
              <span className="font-semibold text-gray-900">
                "{expenseToDelete.description}"
              </span>{" "}
              of{" "}
              <span className="font-semibold text-red-600">
                ₹{expenseToDelete.amount.toFixed(2)}
              </span>
              ?
            </p>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setExpenseToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(expenseToDelete.id)}
                disabled={isDeleting}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
