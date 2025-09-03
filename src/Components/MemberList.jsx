
//this is for showing  that how  much each user have  expenses
import React from 'react';
import { Users,  Receipt ,IndianRupee} from 'lucide-react';
 
export const MemberList = ({ users, balances, onMemberClick }) => {

    

     const getTotalSpent = (userId) => {
    return balances.find(b => b.userId === userId)?.totalSpent || 0;
  };

  //total spending of the group
   const totalGroupSpending = balances.reduce((sum, balance) => sum + balance.totalSpent, 0);


 

  
  return (
    <div className="space-y-4">
      {/* <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          <Receipt className="h-5 w-5 mr-2 text-blue-600" />
          Member Spending Overview
        </h3>
        <p className="text-gray-600">
          Total group spending: <span className="font-bold text-gray-900">${totalGroupSpending.toFixed(2)}</span>
        </p>
      </div> */}

        {users.map((user) => {
        const totalSpent = getTotalSpent(user.userId);
        const percentage = totalGroupSpending > 0 ? (totalSpent / totalGroupSpending) * 100 : 0;
        
        return (
          <div
            key={user.userId}
            className="bg-white/50 rounded-lg p-6 border border-white/20 hover:bg-white/70 transition-colors cursor-pointer"
            onClick={() => typeof onMemberClick === 'function' && onMemberClick(user)}
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
                  <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                  {/* <p className="text-sm text-gray-600">{member.email}</p> */}
                  <p className="text-sm text-gray-500">
                    {/* Joined {new Date(member.joinedAt).toLocaleDateString()} */}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {totalSpent.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {percentage.toFixed(1)}% of total
                    </p>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No members yet</h3>
          <p className="text-gray-600">Invite others to join your group</p>
        </div>
      )}
    </div>
  );
  
}