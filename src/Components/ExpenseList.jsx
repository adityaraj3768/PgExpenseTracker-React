import { Trash, Hash, ReceiptIndianRupee, Search, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { getApiUrl } from "../Utils/api";
import { useState, useEffect } from "react";
import { useUser } from "../Context/CurrentUserIdContext";
import Fuse from "fuse.js";
import { toast } from "react-hot-toast";

export const ExpenseList = ({ expenses, onExpenseDeleted, onDeleteRequest, showCalendar, onShowCalendar, calendarBaseDate, groupType }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const { currentUserId } = useUser();

  const placeholderTerms = ["chai",
  "maggi",
  "canteen",
  "milk",
  "Flipkart",];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderTerms.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [placeholderTerms.length]);

  // ✅ Step 1: Simple search (exact + contains)
  const simpleSearch = (expenses, query) => {
    if (!query) return expenses;
    
    const lowerQuery = query.toLowerCase().trim();
    
    return expenses.filter((expense) => {
      // Search in description
      const description = (expense.description || "").toLowerCase();
      
      // Search in tags
      const tags = (expense.tags || []).map((tag) => tag.toLowerCase());
      
      // Search in paidBy
      const paidBy = (expense.paidBy || "").toLowerCase();
      
      // Check if query matches (exact or contains)
      return (
        description.includes(lowerQuery) ||
        tags.some((tag) => tag.includes(lowerQuery)) ||
        paidBy.includes(lowerQuery)
      );
    });
  };

  // ✅ Step 2: Fuzzy search (Fuse.js)
  const fuse = new Fuse(expenses || [], {
    keys: ["tags", "description", "paidBy"],
    threshold: 0.4,
  });

  const fuzzySearch = (expenses, query) => {
    if (!query) return expenses;
    return fuse.search(query).map((result) => result.item);
  };

  // ✅ Hybrid search: Try simple first, if no results → fuzzy
  const filteredExpenses = (() => {
    if (!searchTerm) return expenses;
    
    // Step 1: Try simple search
    const simpleResults = simpleSearch(expenses, searchTerm);
    
    // If we found results with simple search, return them
    if (simpleResults.length > 0) {
      return simpleResults;
    }
    
    // Step 2: No results? Try fuzzy search
    return fuzzySearch(expenses, searchTerm);
  })();

  const handleDelete = async (expenseId) => {
    // (Note) Authorization is checked by the click-wrapper before calling this.
    const token = localStorage.getItem("token");
    setIsDeleting(true);
    setDeletingExpenseId(expenseId);

    try {
     const res = await axios.delete(getApiUrl(`/pg/delete/expense/${expenseId}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Delete response:", res.data);
      
      toast.success("Expense deleted successfully!", {
        duration: 3000,
        position: "top-center",
      });


      setTimeout(() => {
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

  // Wrapper used by the delete button to enforce frontend authorization
  const handleDeleteClick = (expense) => {
    // Normalize and support a few possible shapes for the stored user id so
    // simple type differences (number vs string / ObjectId string) don't
    // incorrectly block deletion on the frontend.
    const expenseUserId =
      expense?.userId ?? expense?.user?._id ?? expense?.user ?? null;

    if (currentUserId && expenseUserId && String(expenseUserId) !== String(currentUserId)) {
      toast.error("You can only delete your own expenses");
      return;
    }

    if (onDeleteRequest) {
      onDeleteRequest(expense);
    } else {
      handleDelete(expense.id);
    }
  };

  // ✅ remove duplicate expenses by id
  const uniqueExpenses = Array.from(
    new Map(filteredExpenses.map((e) => [e.id, e])).values()
  );

  // ✅ Sort by createdAt (newest first), fallback to paymentDate
  const sortedExpenses = [...uniqueExpenses].sort((a, b) => {
    // Prefer createdAt over paymentDate for sorting
    const timeA = a.createdAt 
      ? new Date(a.createdAt).getTime() 
      : new Date(a.paymentDate).getTime();
    
    const timeB = b.createdAt 
      ? new Date(b.createdAt).getTime() 
      : new Date(b.paymentDate).getTime();
    
    // Sort newest first (descending order)
    return timeB - timeA;
  });

  return (
    <div className="relative">
      {/* Search input with calendar button */}
      <div className="mb-6 pb-4">
        {/* Search input */}
        <div className="relative flex-1">
          <span
            className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200
              ${searchTerm ? "text-blue-500 scale-110" : "text-gray-400"}
              pointer-events-none
            `}
            aria-hidden="true"
          >
            <Search
              className={`w-5 h-5 transition-transform duration-200
                ${searchTerm ? "scale-125 animate-pulse" : ""}
              `}
            />
          </span>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg
                     bg-transparent shadow-sm transition-all duration-300
                     focus:outline-none focus:ring-2 focus:ring-blue-300
                     focus:shadow-md focus:border-blue-400
                     ${searchTerm ? "ring-2 ring-blue-400 border-blue-400" : ""}
              `}
              autoComplete="off"
            />
            {!searchTerm && (
              <div className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none overflow-hidden h-6 w-full">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={placeholderIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="text-gray-500 absolute whitespace-nowrap block"
                  >
                    Search  "{placeholderTerms[placeholderIndex]}"
                  </motion.span>
                </AnimatePresence>
              </div>
            )}
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-200 p-1"
              aria-label="Clear search"
              tabIndex={0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Calendar/Timeline button */}
        <div className="flex justify-end mt-3">
          <button
            onClick={() => onShowCalendar && onShowCalendar(calendarBaseDate || new Date())}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-md hover:bg-gray-800 transition-all text-xs"
            title={groupType === "TRIP" ? "View trip timeline" : "View daily spending calendar"}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{groupType === "TRIP" ? "Timeline" : "Calendar"}</span>
          </button>
        </div>
      </div>

      {sortedExpenses.length === 0 ? (
        <div className="text-center py-12">
          <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <ReceiptIndianRupee className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No expenses yet
          </h3>
          <p className="text-gray-600">Add your first expense to get started</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {sortedExpenses.map((expense) => {
            const amt = Number(expense.amount);
            const formattedAmt = Number.isFinite(amt) ? amt.toFixed(2) : "0.00";
            return (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{
                opacity: deletingExpenseId === expense.id ? 0 : 1,
                scale: deletingExpenseId === expense.id ? 0.95 : 1,
                x: deletingExpenseId === expense.id ? -20 : 0,
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className={`expense-card bg-white/50 rounded-lg p-4 border border-white/20 hover:bg-white/70 transition-colors mb-4 ${
                deletingExpenseId === expense.id
                  ? "bg-red-50/50 border-red-200"
                  : ""
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
                    <p className="text-sm text-gray-700 font-normal">
                      Paid by{" "}
                      <span className="font-normal text-gray-700">
                        {expense.paidBy}
                      </span>
                    </p>
                    <p className="text-sm text-gray-700 font-normal mt-1">
                      {(() => {
                        const formatted = formatExpenseDateWithTime(
                          expense.paymentDate,
                          expense.createdAt
                        );
                        if (!formatted.includes(", "))
                          return (
                            <span className="font-normal text-gray-700">
                              {formatted}
                            </span>
                          );
                        const [datePart, timePart] = formatted.split(", ");
                        return (
                          <>
                            <span className="font-normal text-gray-700">
                              {datePart}
                            </span>
                            ,{" "}
                            <span className="font-normal text-gray-700">
                              {timePart}
                            </span>
                          </>
                        );
                      })()}
                    </p>
                    {expense.tags?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {expense.tags.map((tag, tagIndex) => (
                          <span
                            key={`${expense.id}-tag-${tagIndex}`}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-black font-normal border border-blue-400"
                          >
                            <Hash className="h-3 w-3 mr-1 text-black-400" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-xl font-bold text-gray-900">
                    ₹ {formattedAmt}
                  </p>
                  <button
                    onClick={() => handleDeleteClick(expense)}
                    disabled={deletingExpenseId === expense.id}
                    className={`text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed ${
                      deletingExpenseId === expense.id ? "animate-pulse" : ""
                    }`}
                    title="Delete Expense"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
          })}
        </AnimatePresence>
      )}
    </div>
  );
};

// ✅ Helper: Format date as '24 Aug, 7:02 AM' if this year, or '24 Aug 2024, 7:02 AM' if previous year
function formatExpenseDateWithTime(paymentDateStr, createdAtStr) {
  if (!paymentDateStr) return "-";
  const date = new Date(paymentDateStr);
  if (isNaN(date.getTime())) return paymentDateStr;
  const now = new Date();
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "short" });
  const year = date.getFullYear();
  const currentYear = now.getFullYear();

  // Format time from createdAt (24-hour format)
  let time = "";
  if (createdAtStr) {
    const createdAtDate = new Date(createdAtStr);
    if (!isNaN(createdAtDate.getTime())) {
      time = createdAtDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
  }

  const datePart =
    year === currentYear ? `${day} ${month}` : `${day} ${month} ${year}`;
  return time ? `${datePart}, ${time}` : datePart;
}
