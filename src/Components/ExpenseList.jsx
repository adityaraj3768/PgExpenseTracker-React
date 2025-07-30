import { Trash, Hash, ReceiptIndianRupee, CheckCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { getApiUrl } from "../Utils/api";
import { useState } from "react";
import { toast } from "react-hot-toast";

export const ExpenseList = ({ expenses, onExpenseDeleted, onDeleteRequest }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);

  const handleDelete = async (expenseId) => {
    const token = localStorage.getItem("token");
    setIsDeleting(true);
    setDeletingExpenseId(expenseId);
    
    try {
      await axios.delete(getApiUrl(`/pg/delete/expense/${expenseId}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Show success message
      toast.success("Expense deleted successfully!", {
        duration: 3000,
        position: 'top-center',
      });
      
      // Close confirmation modal
      setExpenseToDelete(null);
      
      // Wait for animation to complete before notifying parent
      setTimeout(() => {
        // Notify parent component to refresh the expense list
        if (onExpenseDeleted) {
          onExpenseDeleted(expenseId);
        }
        setDeletingExpenseId(null);
      }, 500);
      
    } catch (error) {
      if (error.response && error.response.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Something went wrong");
      }
      setDeletingExpenseId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const reversedExpenses = [...expenses].reverse();

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <ReceiptIndianRupee className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No expenses yet
        </h3>
        <p className="text-gray-600">Add your first expense to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <AnimatePresence initial={false}>
          {reversedExpenses.map((expense) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ 
                opacity: deletingExpenseId === expense.id ? 0 : 1, 
                scale: deletingExpenseId === expense.id ? 0.95 : 1,
                x: deletingExpenseId === expense.id ? -20 : 0
              }}
              exit={{ opacity: 0, scale: 0.95, x: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className={`expense-card bg-white/50 rounded-lg p-4 border border-white/20 hover:bg-white/70 transition-colors mb-4 ${
                deletingExpenseId === expense.id ? 'bg-red-50/50 border-red-200' : ''
              }`}
            >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <ReceiptIndianRupee className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {expense.description}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Paid by {expense.paidBy}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {expense.paymentDate}
                      </p>
                      {expense.tags?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {expense.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-black-700 font-semibold"
                            >
                              <Hash className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-xl font-bold text-gray-900">
                      ₹ {expense.amount.toFixed(2)}
                    </p>
                    <button
                      onClick={() => onDeleteRequest && onDeleteRequest(expense)}
                      disabled={deletingExpenseId === expense.id}
                      className={`text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed ${
                        deletingExpenseId === expense.id ? 'animate-pulse' : ''
                      }`}
                      title="Delete Expense"
                    >
                      <Trash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
