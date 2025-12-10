//this is for showing  that how  much each user have  expenses
import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Users, IndianRupee, ArrowLeftRight } from "lucide-react";
import { safeToFixed } from "../Utils/Calculation";

export const MemberList = ({ users = [], balances = [], onMemberClick }) => {
  const [showSettlements, setShowSettlements] = useState(false);

  // Compute settlement transactions: list of { from, to, amount }
  const settlements = useMemo(() => {
    if (!users || users.length === 0) return [];
    // Map totalSpent for each userId
    const totalGroupSpending = balances.reduce(
      (sum, balance) => sum + (balance?.totalSpent || 0),
      0
    );
    const share = totalGroupSpending / users.length;

    // Build nets: positive => should receive, negative => owes
    const nets = users.map((u) => {
      const spent = balances.find((b) => String(b.userId) === String(u.userId))?.totalSpent || 0;
      return { userId: u.userId, net: +(spent - share) };
    });

    const creditors = nets.filter((n) => n.net > 0).map(n => ({...n})).sort((a,b) => b.net - a.net);
    const debtors = nets.filter((n) => n.net < 0).map(n => ({...n})).sort((a,b) => a.net - b.net);

    const txs = [];
    const EPS = 0.01;
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const owe = -debtor.net;
      const receive = creditor.net;
      const amount = Math.min(owe, receive);
        if (amount > EPS) {
        txs.push({ from: debtor.userId, to: creditor.userId, amount: Number(safeToFixed(amount)) });
        debtor.net += amount; // less negative
        creditor.net -= amount;
      }
      if (Math.abs(debtor.net) <= EPS) i++;
      if (creditor.net <= EPS) j++;
    }

    return txs;
  }, [users, balances]);

  const getTotalSpent = (userId) => {
    return balances.find((b) => String(b.userId) === String(userId))?.totalSpent || 0;
  };

  // total spending of the group
  const totalGroupSpending = balances.reduce(
    (sum, balance) => sum + (balance?.totalSpent || 0),
    0
  );
  // average spending per person (only if more than 1 member)
  const averageSpent = users.length > 1 ? totalGroupSpending / users.length : 0;

  return (
    <div className="space-y-4">
      {/* Show average only if more than 1 member */}
      {users.length > 1 && (
  <div className="flex justify-end mb-2 items-center gap-2">

    {/* Avg Badge */}
    <span className="px-3 py-1.5 text-xs font-medium text-blue-500 
                     bg-blue-50/10 border border-blue-500/20 
                     rounded-full shadow-sm">
      Avg: {safeToFixed(averageSpent)}
    </span>

    {/* Settle Up Button */}
    <button
      onClick={() => setShowSettlements(true)}
      className="px-3 py-1.5 rounded-full bg-[#1b1c22] border border-[#2a2a33] 
                 text-gray-200 text-xs font-medium hover:bg-[#22242b] 
                 transition shadow-sm hover:shadow-md"
    >
      Settle Up
    </button>

  </div>
)}

      {/* Members list */}
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
                        {safeToFixed(totalSpent)}
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
                      {safeToFixed(totalSpent)}
                    </p>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full shadow-sm ${
                        isPositive
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {isPositive
                        ? `+${safeToFixed(Math.abs(diff))}`
                        : `-${safeToFixed(Math.abs(diff))}`}
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

      {/* Settlement Modal (portal to body to cover full viewport) */}
      {showSettlements && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-3xl bg-[#111217] rounded-2xl shadow-2xl border border-[#1f1f25] overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#111217]/80 border-b border-[#2a2a33]">
              <h3 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                💸 Settle Up
              </h3>
              <button
                onClick={() => setShowSettlements(false)}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-[#2a2a33]/60 transition"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">

              {settlements.length === 0 ? (
                <div className="text-center text-gray-300 py-12">
                  All settled — no transfers needed.
                </div>
              ) : (
                settlements.map((s, idx) => {
                  const fromUser = users.find(u => String(u.userId) === String(s.from));
                  const toUser = users.find(u => String(u.userId) === String(s.to));
                  const fromName = fromUser?.name || fromUser?.username || fromUser?.userId;
                  const toName = toUser?.name || toUser?.username || toUser?.userId;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-[#17181e] hover:bg-[#1d1f26] 
                                 border border-[#23242b] transition rounded-xl px-5 py-4 shadow-sm"
                    >
                      <div className="flex items-center gap-2 text-gray-200 text-sm font-medium">
                        <span>{fromName}</span>
                        <span className="text-gray-500">→</span>
                        <span>{toName}</span>
                      </div>

                      <div className="text-green-400 font-semibold text-sm">
                        ₹{safeToFixed(s.amount)}
                      </div>
                    </div>
                  );
                })
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#2a2a33] bg-[#111217]/80 flex justify-end">
              <button
                onClick={() => setShowSettlements(false)}
                className="px-4 py-2 bg-[#1c1d23] hover:bg-[#272830] text-gray-200 font-medium rounded-lg transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}


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
