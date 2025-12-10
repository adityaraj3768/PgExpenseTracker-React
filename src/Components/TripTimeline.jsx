import React, { useMemo, useState, useEffect } from 'react';
import { X, MapPin, Calendar, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function TripTimeline({ expenses, isOpen, onClose, groupName }) {
  const [expandedDayIndex, setExpandedDayIndex] = useState(0); // Track which day is expanded (default: first/latest)
  // Group expenses by day
  const timeline = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    // Create a map of date -> expenses
    const dayMap = {};
    expenses.forEach((expense) => {
      // ✅ Validate paymentDate before creating Date object
      if (!expense.paymentDate) return; // Skip if no date
      
      const date = new Date(expense.paymentDate);
      
      // ✅ Check if date is valid before converting to ISO string
      if (isNaN(date.getTime())) return; // Skip if date is invalid
      
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = {
          date: date,
          dateKey,
          expenses: [],
          total: 0,
        };
      }
      
      dayMap[dateKey].expenses.push(expense);
      dayMap[dateKey].total += Number(expense.amount || 0);
    });

    // Convert to array and sort by date (newest first)
    return Object.values(dayMap).sort((a, b) => b.date - a.date);
  }, [expenses]);

  // Calculate trip duration
  const tripInfo = useMemo(() => {
    if (timeline.length === 0) return null;
    
    const startDate = timeline[0].date;
    const endDate = timeline[timeline.length - 1].date;
    const totalSpent = timeline.reduce((sum, day) => sum + day.total, 0);
    const totalDays = timeline.length;

    return {
      startDate,
      endDate,
      totalSpent,
      totalDays,
    };
  }, [timeline]);

  // Reset expanded day when modal opens
  useEffect(() => {
    if (isOpen) {
      setExpandedDayIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (date) => {
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const dayName = date.toLocaleString('default', { weekday: 'short' });
    
    return { day, month, year, dayName };
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden sm:inline">Trip Timeline</span>
                <span className="sm:hidden">Timeline</span>
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            {tripInfo && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
                  <div>
                    <div className="text-xs sm:text-sm opacity-80">Start Date</div>
                    <div className="text-sm sm:text-lg font-semibold">
                      {formatDate(tripInfo.startDate).day} {formatDate(tripInfo.startDate).month}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm opacity-80">End Date</div>
                    <div className="text-sm sm:text-lg font-semibold">
                      {formatDate(tripInfo.endDate).day} {formatDate(tripInfo.endDate).month}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm opacity-80">Total Days</div>
                    <div className="text-sm sm:text-lg font-semibold">{tripInfo.totalDays}</div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm opacity-80">Total Spent</div>
                    <div className="text-sm sm:text-lg font-semibold">₹{tripInfo.totalSpent.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timeline Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-gray-50">
            {timeline.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 text-base sm:text-lg">No expenses yet</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-2">Start adding expenses to see your trip timeline</p>
              </div>
            ) : (
              <div className="relative min-h-full">
                {/* Timeline line with progress indicator */}
                <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-0.5 bg-gray-300">
                  {/* Progress line fill */}
                  <motion.div
                    className="absolute left-0 top-0 w-full bg-gradient-to-b from-purple-500 to-purple-600"
                    initial={{ height: '0%' }}
                    animate={{ height: '100%' }}
                    transition={{
                      duration: 3,
                      ease: 'easeInOut',
                    }}
                  />
                </div>

                {/* Timeline days */}
                <div className="space-y-6 sm:space-y-8">
                  {timeline.map((day, dayIndex) => {
                    const { day: dayNum, month, dayName } = formatDate(day.date);
                    // Calculate actual day number from the end (reverse order)
                    const actualDayNumber = timeline.length - dayIndex;
                    const isFirstDay = actualDayNumber === 1;
                    const isLastDay = actualDayNumber === timeline.length;
                    const isExpanded = expandedDayIndex === dayIndex;

                    return (
                      <motion.div
                        key={day.dateKey}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: dayIndex * 0.1 }}
                        className="relative"
                      >
                        {/* Timeline dot */}
                        <div className="absolute left-4 sm:left-8 transform -translate-x-1/2">
                          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${
                            isFirstDay ? 'bg-green-500' : 
                            isLastDay ? 'bg-red-500' : 
                            'bg-purple-500'
                          } border-2 sm:border-4 border-white shadow-lg flex items-center justify-center`}>
                            {isFirstDay && <span className="text-white text-[10px] sm:text-xs font-bold">S</span>}
                            {isLastDay && <span className="text-white text-[10px] sm:text-xs font-bold">E</span>}
                          </div>
                        </div>

                        {/* Day content */}
                        <div className="ml-12 sm:ml-20">
                          {/* Day header - Clickable */}
                          <div 
                            className="mb-2 sm:mb-3 cursor-pointer"
                            onClick={() => setExpandedDayIndex(isExpanded ? null : dayIndex)}
                          >
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
                              <div className={`${
                                isExpanded ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
                              } px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold transition-colors`}>
                                Day {actualDayNumber}
                              </div>
                              <div className="text-gray-600 font-medium text-xs sm:text-base">
                                {dayName}, {dayNum} {month}
                              </div>
                              <div className={`ml-auto ${
                                isExpanded ? 'bg-purple-600' : 'bg-purple-500'
                              } text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold transition-colors flex items-center gap-1`}>
                                <span>₹{day.total.toFixed(2)}</span>
                                <motion.span
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="text-xs"
                                >
                                  {/* ▼ */}
                                </motion.span>
                              </div>
                            </div>
                          </div>

                          {/* Expenses for this day - Collapsible */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-2 overflow-hidden"
                              >
                                {day.expenses
                                  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                  .map((expense, expIdx) => (
                                  <div
                                    key={expense.id || expIdx}
                                    className="bg-white rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition border border-gray-200"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                                          {expense.description}
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-500 mt-1">
                                          <span className="truncate block sm:inline">Paid by {expense.paidBy}</span>
                                          {expense.createdAt && (
                                            <span className="block sm:inline sm:ml-2">• {formatTime(expense.createdAt)}</span>
                                          )}
                                        </div>
                                        {expense.tags && expense.tags.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-2">
                                            {expense.tags.map((tag, tagIdx) => (
                                              <span
                                                key={tagIdx}
                                                className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs bg-purple-50 text-purple-700 border border-purple-200"
                                              >
                                                #{tag}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-base sm:text-lg font-bold text-gray-900 flex-shrink-0">
                                        ₹{Number(expense.amount).toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
