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

  const { currentUserId } = useUser(); // ✅ keep here, but read it in useEffect
   

  // Fetch current group data from backend (refreshes the current selected group)
  const fetchGroup = async (groupParam) => {
    const groupToFetch = groupParam || currentGroup;
    if (!groupToFetch?.groupCode && !groupToFetch?.code && !groupToFetch?.id) {
  // No current group selected to fetch
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        getApiUrl('/pg/my-groups'),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  // Fetch group backend response handled
      const groups = Array.isArray(response.data.groups) ? response.data.groups : [response.data.groups];
      const groupIdentifier = groupToFetch.groupCode || groupToFetch.code || groupToFetch.id;
      // Find the current group in the list
      const updatedGroup = groups.find(g => 
        g.groupCode === groupIdentifier || g.code === groupIdentifier || g.id === groupIdentifier
      );
      if (updatedGroup) {
        setCurrentGroup(updatedGroup);
        setMonthlyLimit(response.data.monthlyLimitCoins || 0);
        setRemainingCoins(response.data.remainingCoins || 0);
      } else {
  // Current group not found in user's groups
      }
    } catch (error) {
  // Error fetching current group
    }
  };

  // Fetch and set initial group (for page refresh or first load)
  const fetchInitialGroup = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch all groups that the user belongs to
      const response = await axios.get(
        getApiUrl('/pg/my-groups'), 
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  // Fetch initial group backend response handled
      
  const groups = Array.isArray(response.data.groups) ? response.data.groups : [response.data.groups];
      setMonthlyLimit(response.data.monthlyLimitCoins || 0);
      setRemainingCoins(response.data.remainingCoins || 0);
  
      if (groups.length > 0) {
        // Check if there's a stored group preference
        const storedGroupCode = localStorage.getItem('currentGroupCode');
        
        if (storedGroupCode) {
          // Try to find the stored group
          const storedGroup = groups.find(g => 
            g.groupCode === storedGroupCode || g.code === storedGroupCode || g.id === storedGroupCode
          );
          
          if (storedGroup) {
            setCurrentGroup(storedGroup);
            return;
          }
        }
        
        // If no stored group or stored group not found, use the first group
        setCurrentGroupWithStorage(groups[0]);
      } else {
  // User is not part of any groups
        setCurrentGroup(null);
      }
    } catch (error) {
  // Error fetching initial group
      setCurrentGroup(null);
    }
  };

  // Custom setCurrentGroup that also stores in localStorage
  const setCurrentGroupWithStorage = async (group) => {
    setCurrentGroup(group);
    if (group) {
      const groupCode = group.groupCode || group.code || group.id;
      localStorage.setItem('currentGroupCode', groupCode);
      // Fetch latest group data (including coins) after selecting group
      await fetchGroup(group);
    } else {
      localStorage.removeItem('currentGroupCode');
    }
  };

  // Fetch all groups that the user belongs to
  const fetchAllGroups = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        getApiUrl('/pg/my-groups'),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  return Array.isArray(response.data.groups) ? response.data.groups : [response.data.groups];
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

  return (
    <GroupContext.Provider
      value={{
        currentGroup,
        setCurrentGroup: setCurrentGroupWithStorage,
        balances,
        totalExpenses,
        currentBalance,
        fetchGroup,
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
