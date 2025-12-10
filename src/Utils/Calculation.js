
export const calculateBalances=(expenses,users)=>{
    const balances={}

    //initialize the balance
    users.forEach(user=>{
        balances[user.userId]=0
    })

    //calculate  the money spent by each
   // Add expenses for each user
  users.forEach(user => {
    (user.expenses || []).forEach(expense => {
      balances[user.userId] += expense.amount;
    });
  });

  // balances calculated
    return Object.entries(balances).map(([userId, totalSpent]) => ({
    userId,
    totalSpent: Math.round(totalSpent * 100) / 100
  }));

}





//this will calculate the total expenses of the group
export const getTotalExpenses=(expenses)=>{
    return expenses.reduce((total, expense) => {
      const amount = Number(expense?.amount) || 0;
      return total + (Number.isFinite(amount) ? amount : 0);
    }, 0);
    
};


//for calculating the  expense of the current user
const balance=()=>{

    }

// Safe formatter for numeric values that might be undefined/null/NaN.
export function safeToFixed(value, digits = 2) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(digits) : (0).toFixed(digits);
}
