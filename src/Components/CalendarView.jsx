import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function CalendarView({ expenses, isOpen, onClose, initialDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDayExpenses, setSelectedDayExpenses] = useState([]);

  // Sync the calendar month/year with the provided initial date (e.g., previous month)
  useEffect(() => {
    if (initialDate) {
      const parsed = new Date(initialDate);
      if (!isNaN(parsed)) {
        setCurrentDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
      }
    }
  }, [initialDate, isOpen]);

  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and number of days in month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Get today's date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate daily totals from expenses
    const dailyTotals = {};
    expenses?.forEach((expense) => {
      const expenseDate = new Date(expense.paymentDate);
      if (
        expenseDate.getFullYear() === year &&
        expenseDate.getMonth() === month
      ) {
        const day = expenseDate.getDate();
        dailyTotals[day] = (dailyTotals[day] || 0) + Number(expense.amount || 0);
      }
    });

    // Build calendar grid
    const weeks = [];
    let currentWeek = Array(startingDayOfWeek).fill(null);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      dayDate.setHours(0, 0, 0, 0);
      
      const isFutureDay = dayDate > today;
      const isToday = dayDate.getTime() === today.getTime();
      
      currentWeek.push({
        day,
        total: dailyTotals[day] || 0,
        hasExpenses: !!dailyTotals[day],
        isFutureDay,
        isToday,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill remaining days with nulls
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [currentDate, expenses]);

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const monthName = currentDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const handleDayClick = (day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Filter expenses for the selected day
    const dayExpenses = expenses?.filter((expense) => {
      const expenseDate = new Date(expense.paymentDate);
      return (
        expenseDate.getFullYear() === year &&
        expenseDate.getMonth() === month &&
        expenseDate.getDate() === day
      );
    }) || [];
    
    setSelectedDay(day);
    setSelectedDayExpenses(dayExpenses);
  };

  const maxDailySpent = Math.max(
    ...monthDays.flat().filter(d => d?.hasExpenses).map(d => d?.total || 0),
    1
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl p-4 w-full max-w-md mx-4 border border-gray-200 max-h-[85vh] overflow-y-auto"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900"> {monthName}</h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="mb-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div
                  key={`weekday-${index}`}
                  className="text-center text-xs font-semibold text-gray-500 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((week, weekIdx) =>
                week.map((dayObj, dayIdx) => {
                  if (!dayObj) {
                    return (
                      <div
                        key={`empty-${weekIdx}-${dayIdx}`}
                        className="aspect-square"
                      />
                    );
                  }

                  const { day, total, hasExpenses, isFutureDay, isToday } = dayObj;
                  
                  // Determine color category based on spending amount
                  let bgColor = '#f3f4f6'; // empty/future
                  let textColor = '#374151'; // gray-700
                  let showCheckmark = false;
                  let borderStyle = 'none';
                  
                  if (isFutureDay) {
                    // Future days stay grey
                    bgColor = '#f3f4f6';
                    textColor = '#9ca3af';
                  } else if (!hasExpenses && total === 0) {
                    // 0 spending on past/today - show green with checkmark
                    if (isToday) {
                      bgColor = '#10B981'; // dark green for today
                      textColor = '#ffffff'; // white text
                    } else {
                      bgColor = '#D1FAE5'; // light green
                      textColor = '#059669'; // dark green
                    }
                    showCheckmark = true;
                  } else if (hasExpenses) {
                    // Days with spending - single High category
                    if (isToday) {
                      bgColor = '#DC2626'; // dark red for today
                      textColor = '#ffffff'; // white text
                    } else {
                      bgColor = '#FFE0E0'; // High
                      textColor = '#FF3B30';
                    }
                  }
                  
                  if (isToday && !borderStyle) {
                    // Subtle border for today
                    borderStyle = '1px solid rgba(0, 0, 0, 0.1)';
                  }

                  return (
                    <motion.div
                      key={`day-${day}`}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (weekIdx * 7 + dayIdx) * 0.02, duration: 0.25, ease: 'easeOut' }}
                      onClick={() => !isFutureDay && handleDayClick(day)}
                      className={`
                        aspect-square rounded flex flex-col items-center justify-center text-xs font-semibold
                        transition-all duration-200 relative overflow-hidden
                        ${!isFutureDay ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'cursor-default'}
                      `}
                      style={{
                        background: bgColor,
                        color: textColor,
                        border: borderStyle,
                      }}
                      title={hasExpenses ? `₹${total.toFixed(2)}` : 'No expenses'}
                    >
                      {showCheckmark ? (
                        <>
                          <span className="relative z-10">{day}</span>
                          <span className="text-[10px] relative z-10">
                            ₹0
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="relative z-10">{day}</span>
                          {hasExpenses ? (
                            <span className="text-[10px] relative z-10">
                              ₹{Math.round(total)}
                            </span>
                          ) : !isFutureDay ? (
                            <span className="text-[10px] relative z-10 text-gray-500">
                              ₹0
                            </span>
                          ) : null}
                        </>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

         </motion.div>

        {/* Day Expenses Modal */}
        {selectedDay && (
          <motion.div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-md mx-4 border border-gray-200 max-h-[70vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {currentDate.toLocaleString('default', { month: 'short' })} {selectedDay}, {currentDate.getFullYear()}
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedDayExpenses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No expenses for this day
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-700 mb-2">
                    Total: ₹{selectedDayExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0).toFixed(2)}
                  </div>
                  {selectedDayExpenses.map((expense, idx) => (
                    <div
                      key={expense.id || idx}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-gray-900">{expense.description}</span>
                        <span className="font-bold text-gray-900">₹{Number(expense.amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        Paid by: {expense.paidBy}
                      </div>
                      {expense.tags && expense.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {expense.tags.map((tag, tagIdx) => (
                            <span
                              key={tagIdx}
                              className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
