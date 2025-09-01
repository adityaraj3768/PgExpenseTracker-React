
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
    return expenses.reduce((total, expense) => total + expense.amount, 0);
    
};


//for calculating the  expense of the current user
const balance=()=>{

    }
