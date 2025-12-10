import { createContext, useContext, useState, useEffect } from "react";
import { calculateBalances, getTotalExpenses } from "../Utils/Calculation";
import axios from "axios";
import { useUser } from "./CurrentUserIdContext";
import { getApiUrl } from "../Utils/api";

const GroupContext = createContext();
export const useGroup = () => useContext(GroupContext);

export const GroupProvider = ({ children }) => {
  const [currentGroup, setCurrentGroup] = useState(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [balances, setBalances] = useState([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [coins, setCoins] = useState(0);
  const [monthlyLimit, setMonthlyLimit] = useState(0);
  const [remainingCoins, setRemainingCoins] = useState(0);
  const [groupLoading, setGroupLoading] = useState(false);

  const { currentUserId } = useUser(); // ✅ keep here, but read it in useEffect
   

  // Fetch current group data from backend (refreshes the current selected group)
  const fetchGroup = async (groupParam) => {
    const groupToFetch = groupParam || currentGroup;
    if (!groupToFetch?.groupCode && !groupToFetch?.code && !groupToFetch?.id) {
  // No current group selected to fetch
      return;
    }
    try {
      setGroupLoading(true);
      const token = localStorage.getItem("token");

      // Get current month (0-based, so add 1) and year
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const groupId = groupToFetch.groupId || groupToFetch.id || groupToFetch.groupCode || groupToFetch.code;
      if (!groupId) return;

      // Fetch single-group endpoint (backend may return the group object directly)
      const response = await axios.get(
        getApiUrl(`/pg/my-group?groupId=${groupId}&month=${month}&year=${year}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const fullGroup = response.data.group || response.data;
      if (fullGroup) {
        setCurrentGroup(fullGroup);
        setMonthlyLimit(response.data.monthlyLimitCoins || response.data.monthlyLimit || 0);
        setRemainingCoins(response.data.remainingCoins || 0);
      }
    } catch (error) {
      // Error fetching current group
    }
    finally {
      setGroupLoading(false);
    }
  };

  // Fetch and set initial group (for page refresh or first load)
  const fetchInitialGroup = async () => {
    try {
      // First try to restore a stored snapshot to avoid showing "No group found" briefly
      try {
        // First try to restore a stored snapshot to avoid showing "No group found" briefly
        const raw = localStorage.getItem('currentGroup');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed) {
            setCurrentGroup(parsed);
            // refresh the snapshot from backend
            await fetchGroup(parsed);
            return;
          }
        }
      } catch (e) {
        // ignore parse errors and continue to restore by id
      }

      // If we have a stored numeric group id, fetch that single group directly
      const storedGroupId = localStorage.getItem('currentGroupId');
      if (storedGroupId) {
        try {
          const token = localStorage.getItem('token');
          const now = new Date();
          const month = now.getMonth() + 1;
          const year = now.getFullYear();

          const response = await axios.get(
            getApiUrl(`/pg/my-group?groupId=${storedGroupId}&month=${month}&year=${year}`),
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const fullGroup = response.data.group || response.data;
          if (fullGroup) {
            setCurrentGroup(fullGroup);
            setMonthlyLimit(response.data.monthlyLimitCoins || response.data.monthlyLimit || 0);
            setRemainingCoins(response.data.remainingCoins || 0);
            return;
          }
        } catch (err) {
          // Failed to restore by id - fall through to no-group state
        }
      }

      // No stored snapshot or id could be used - don't call /pg/my-groups per request
      setCurrentGroup(null);
    } catch (error) {
      // Error fetching initial group
      setCurrentGroup(null);
    }
  };

  // Custom setCurrentGroup that also stores in localStorage
  // Accepts an options object: { skipFetch: boolean }
  const setCurrentGroupWithStorage = async (group, options = {}) => {
    const { skipFetch = false } = options || {};
    setCurrentGroup(group);
    if (group) {
      const groupCode = group.groupCode || group.code || group.id;
      // Prefer numeric id for restore if available
      const groupIdVal = group.groupId ?? group.id ?? null;
      // Persist both a compact identifier, numeric id, and a snapshot to aid fast restore on refresh
      try {
        if (groupIdVal !== null && typeof groupIdVal !== 'undefined') {
          localStorage.setItem('currentGroupId', String(groupIdVal));
        }
        localStorage.setItem('currentGroupCode', groupCode);
        localStorage.setItem('currentGroup', JSON.stringify(group));
      } catch (e) {
        // ignore storage errors
      }
      // Fetch latest group data (including coins) after selecting group
      if (!skipFetch) {
        await fetchGroup(group);
      }
    } else {
      try {
        localStorage.removeItem('currentGroupCode');
        localStorage.removeItem('currentGroup');
        localStorage.removeItem('currentGroupId');
      } catch (e) {}
    }
  };

  // Fetch all groups that the user belongs to
  const fetchAllGroups = async () => {
    try {
      const token = localStorage.getItem("token");

      // Get current month (0-based, so add 1) and year
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      // Prefer returning the current group via single-group endpoint if we have an id
      const storedGroupId = localStorage.getItem('currentGroupId') || (currentGroup?.groupId ?? currentGroup?.id);
      if (storedGroupId) {
        try {
          const response = await axios.get(
            getApiUrl(`/pg/my-group?groupId=${storedGroupId}&month=${month}&year=${year}`),
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const fullGroup = response.data.group || response.data;
          return fullGroup ? [fullGroup] : [];
        } catch (err) {
          // fallback to empty array on error
          return [];
        }
      }

      // No stored id found, return empty list (avoid calling /pg/my-groups)
      return [];
    } catch (error) {
  // Error fetching all groups
      return [];
    }
  };

  // Recalculate balances when group or user changes
  useEffect(() => {
    if (currentGroup && currentUserId) {
      const users = currentGroup.users || [];
      const expenses = currentGroup.expenses || [];

      // Calculate balances and update state
      const computedBalances = calculateBalances(expenses, users);
      const total = getTotalExpenses(expenses);
      const currentUserBalance = computedBalances.find(
        (b) => b.userId.toString() === currentUserId.toString()
      );
      setBalances(computedBalances);
      setTotalExpenses(total);
      setCurrentBalance(currentUserBalance?.totalSpent || 0);

    }
  }, [currentGroup, currentUserId]);

  // Auto-load initial group when a user is available (helps on page refresh)
  // NOTE: We no longer auto-fetch the initial group on every app mount when
  // `currentUserId` becomes available. This prevents unexpected backend
  // requests when the user lands on non-dashboard pages (e.g., LandingPage).
  // Components that need the initial group (like `GroupDashboard`) should call
  // `fetchInitialGroup()` explicitly when they're mounted.

  return (
    <GroupContext.Provider
      value={{
        currentGroup,
        setCurrentGroup: setCurrentGroupWithStorage,
        balances,
        totalExpenses,
        currentBalance,
        fetchGroup,
        groupLoading,
        fetchAllGroups,
        fetchInitialGroup,
        coins,
        setCoins,
        monthlyLimit,
        setMonthlyLimit,
        remainingCoins,
        setRemainingCoins,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};
 