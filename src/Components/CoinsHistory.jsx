import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { getApiUrl } from "../Utils/api";
import { toast } from "react-hot-toast";

export default function CoinsHistory({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  
    const totals = useMemo(() => {
      let totalNet = 0;
      let totalAdded = 0;
      let totalSpent = 0;
      for (const entry of history) {
        const amt = Number(entry.amount ?? entry.coins ?? entry.delta ?? 0) || 0;
        totalNet += amt;
        if (amt > 0) totalAdded += amt;
        if (amt < 0) totalSpent += Math.abs(amt);
      }
      return { totalNet, totalAdded, totalSpent };
    }, [history]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(getApiUrl("/pg/coins-history"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Expecting an array in res.data or res.data.history
        const data = Array.isArray(res.data) ? res.data : res.data.history || [];

        console.log("Fetched coins history:", data);
        // sort by newest first using available date fields
        const getTime = (entry) => {
          const dateStr = entry.timestamp || entry.createdAt || entry.date || entry.time || entry.updatedAt;
          const t = dateStr ? new Date(dateStr).getTime() : 0;
          return Number.isNaN(t) ? 0 : t;
        };
        const sorted = Array.isArray(data)
          ? data.slice().sort((a, b) => getTime(b) - getTime(a))
          : data;
        setHistory(sorted || []);
      } catch (err) {
        toast.error("Failed to fetch coins history");
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [isOpen]);

  // format date in Indian style: '9 Oct, 2:39 AM'
  const formatIndian = (dateLike) => {
    if (!dateLike) return "-";
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return "-";
    const day = d.getDate();
    const month = d.toLocaleString("en-GB", { month: "short" }); // e.g., 'Oct'
    const time = d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return `${day} ${month}, ${time}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
  <motion.div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      className="bg-[#1E1E1E]/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-[#2A2A2A]"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-[#1E1E1E]/80 backdrop-blur-md p-4 border-b border-[#2A2A2A]">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-100 tracking-wide">Coin History</h3>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0F1724] border border-[#2A2A2A] text-sm text-gray-300 flex items-center gap-4">
              <div className="text-sm text-gray-300">
  Total Coins: <span className="font-semibold text-green-400">+{totals.totalAdded.toLocaleString()}</span>
</div>

              
              
            </div>

            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-200 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FFD54F]"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center text-gray-500 py-10 text-sm">
            No coin history found.
          </div>
        ) : (
          history.map((entry, idx) => {
            const rawActionType = (entry.actionType || "").toString().toUpperCase();
            const isAdd = rawActionType === "ADD_COINS";
            const label =
              isAdd
                ? "Coins Added"
                : rawActionType === "SET_LIMIT"
                ? "Limit Set"
                : rawActionType;

            const amount = Number(entry.amount ?? 0);
            const date = entry.timestamp ? formatIndian(entry.timestamp) : "-";

            return (
              <motion.div
                key={entry.id || idx}
                className="p-4 rounded-2xl border border-[#2A2A2A] bg-gradient-to-br from-[#1C1C1C] to-[#111111] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all flex justify-between items-center"
                whileHover={{ scale: 1.02 }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isAdd
                          ? "bg-green-500/20 text-green-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{date}</div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-base font-bold ${
                      isAdd
                        ? "bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent"
                        : "bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent"
                    }`}
                  >
                    {isAdd ? `+${amount}` : amount}
                  </div>
                  <div className="text-xs text-gray-500">coins</div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
            {/* totals moved to header */}
    </motion.div>
  </motion.div>
</AnimatePresence>

  );
}
