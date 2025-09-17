//this is for showing  that how  much each user have  expenses
import React from "react";
import { Users, Receipt, IndianRupee } from "lucide-react";

export const MemberList = ({ users, balances, onMemberClick }) => {
  const getTotalSpent = (userId) => {
    return balances.find((b) => b.userId === userId)?.totalSpent || 0;
  };

  // total spending of the group
  const totalGroupSpending = balances.reduce(
    (sum, balance) => sum + balance.totalSpent,
    0
  );
  // average spending per person (only if more than 1 member)
  const averageSpent = users.length > 1 ? totalGroupSpending / users.length : 0;

  return (
    <div className="space-y-4">
      {/* Show average only if more than 1 member */}
      {users.length > 1 && (
        <div className="flex justify-end mb-2">
          <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full shadow-sm">
            Avg: {averageSpent.toFixed(2)}
          </span>
        </div>
      )}

      {users.map((user) => {
        const totalSpent = getTotalSpent(user.userId);
        if (users.length === 1) {
          // Only one member: just show their total
          return (
            <div
              key={user.userId}
              className="bg-white/50 rounded-lg p-6 border border-white/20 hover:bg-white/70 transition-colors cursor-pointer"
              onClick={() =>
                typeof onMemberClick === "function" && onMemberClick(user)
              }
              title="Click to view expenses"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {user.name}
                    </h3>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">
                        {totalSpent.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-2 rounded-full bg-green-100">
                      <IndianRupee className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        // More than one member: show diff from average
        const diff = totalSpent - averageSpent;
        const isPositive = diff >= 0;
        return (
          <div
            key={user.userId}
            className="bg-white/50 rounded-lg p-6 border border-white/20 hover:bg-white/70 transition-colors cursor-pointer"
            onClick={() =>
              typeof onMemberClick === "function" && onMemberClick(user)
            }
            title="Click to view expenses"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {user.name}
                  </h3>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">
                      {totalSpent.toFixed(2)}
                    </p>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full shadow-sm ${
                        isPositive
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {isPositive
                        ? `+${Math.abs(diff).toFixed(2)}`
                        : `-${Math.abs(diff).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="p-2 rounded-full bg-green-100">
                    <IndianRupee className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {users.length === 0 && (
        <div className="text-center py-12">
          <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No members yet
          </h3>
          <p className="text-gray-600">Invite others to join your group</p>
        </div>
      )}
    </div>
  );
};
