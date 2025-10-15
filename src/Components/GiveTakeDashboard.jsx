import React, { useState, useEffect, useRef } from "react";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  MoveDown,
  Check,
  MoveUp,
  Trash,
  Pencil,
} from "lucide-react";
import axios from "axios";
import { getApiUrl } from "../Utils/api";
import toast, { Toaster } from "react-hot-toast";
import { useSpring, animated } from "@react-spring/web";

import { formatDateIndian } from "../Utils/formatDateIndian";
import { useGroup } from "../Context/GroupContext";

export default function GiveTakeDashboard() {
  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [totalGiven, setTotalGiven] = useState(0);
  const [totalTaken, setTotalTaken] = useState(0);
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingGive, setIsSubmittingGive] = useState(false);
  const [isSubmittingTake, setIsSubmittingTake] = useState(false);
  // Remaining coins (updated from give/take responses)
  const [remainingCoins, setRemainingCoins] = useState(null);
  const { remainingCoins: globalRemainingCoins, setRemainingCoins: setGlobalRemainingCoins } = useGroup();

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState({ open: false, txn: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit dialog state
  const [editDialog, setEditDialog] = useState({ open: false, txn: null });
  const [editType, setEditType] = useState("increase"); // "increase" or "decrease"
  const [editAmount, setEditAmount] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const openEditDialog = (txn) => {
    setEditDialog({ open: true, txn });
    setEditType("increase");
    setEditAmount("");
  };
  const closeEditDialog = () => setEditDialog({ open: false, txn: null });

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editAmount || isNaN(editAmount) || Number(editAmount) <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (editType === "decrease") {
      const currentAmount = editDialog.txn?.amount || 0;
      if (Number(editAmount) > currentAmount) {
        toast.error("You cannot reduce more than the current balance in this record.");
        return;
      }
    }
    setIsEditing(true);
    try {
      const token = localStorage.getItem("token");
      const url =
        editType === "increase"
          ? getApiUrl(`/pg/increase-give-or-take/${editDialog.txn.id}`)
          : getApiUrl(`/pg/decrease-give-or-take/${editDialog.txn.id}`);
      await axios.post(
        url,
        { amount: Number(editAmount) },
        { headers: { Authorization: token ? `Bearer ${token}` : undefined } }
      );
      toast.success(
        `Amount ${editType === "increase" ? "increased" : "decreased"}!`
      );
      closeEditDialog();
      fetchTransactions();
    } catch (err) {
      toast.error("Failed to update amount.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteClick = (txn) => setDeleteDialog({ open: true, txn });
  const handleCancelDelete = () => setDeleteDialog({ open: false, txn: null });
  const handleConfirmDelete = async () => {
    if (!deleteDialog.txn) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
     const res= await axios.delete(
        getApiUrl(`/pg/remove-give-or-take/${deleteDialog.txn.id}`),
        {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
        }
      );
      toast.success("Transaction deleted.");
      setDeleteDialog({ open: false, txn: null });
      console.log("The remaining coins after deletion:", res.data);
      if (res.data && typeof res.data !== 'undefined') {
        setRemainingCoins(res.data);
        setGlobalRemainingCoins(res.data);
      }
      fetchTransactions();
    } catch (err) {
      toast.error("Failed to delete transaction.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(getApiUrl("/pg/give-or-take-records"), {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      const payload = res.data;
      let data = [];
      if (Array.isArray(payload)) {
        data = payload;
      } else if (payload && Array.isArray(payload.records)) {
        data = payload.records;
      } else {
        data = [];
      }

      // If backend returns remainingCoins with the payload, update state
      if (payload && typeof payload.remainingCoins !== 'undefined') {
        setRemainingCoins(payload.remainingCoins);
        if (typeof setGlobalRemainingCoins === "function") {
          setGlobalRemainingCoins(payload.remainingCoins);
        }
      }

      setTransactions(data);
      setTotalGiven(
        data
          .filter((t) => t.type === "GIVE")
          .reduce((sum, t) => sum + Number(t.amount), 0)
      );
      setTotalTaken(
        data
          .filter((t) => t.type === "TAKE")
          .reduce((sum, t) => sum + Number(t.amount), 0)
      );
    } catch (err) {
      setTransactions([]);
      setTotalGiven(0);
      setTotalTaken(0);
      toast.error("Failed to fetch transactions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Show a transient toast when remaining coins change (skip initial mount)
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (typeof globalRemainingCoins === 'number') {
      toast.success(`Remaining coins: ${globalRemainingCoins}`);
    } else if (typeof remainingCoins === 'number') {
      toast.success(`Remaining coins: ${remainingCoins}`);
    }
  }, [globalRemainingCoins, remainingCoins]);

  // Give form state
  const todayStr = new Date().toISOString().slice(0, 10);
  const [showGiveForm, setShowGiveForm] = useState(false);
  const [giveForm, setGiveForm] = useState({
    amount: "",
    name: "",
    date: todayStr,
    type: "GIVE",
    description: "",
  });

  // Take form state
  const [showTakeForm, setShowTakeForm] = useState(false);
  const [takeForm, setTakeForm] = useState({
    amount: "",
    name: "",
    date: todayStr,
    type: "TAKE",
    description: "",
  });

  // Handlers - Give
  const openGiveForm = () => {
    setGiveForm({
      amount: "",
      name: "",
      date: todayStr,
      type: "GIVE",
      description: "",
    });
    setShowGiveForm(true);
  };
  const closeGiveForm = () => setShowGiveForm(false);
  const handleGiveFormChange = (e) => {
    const { name, value } = e.target;
    setGiveForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleGiveFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingGive(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(getApiUrl("/pg/give-or-take"), giveForm, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });
      const data = res.data || {};

      // Expecting { record: {...}, remainingCoins: number }
      if (data.record) {
        const record = data.record;
        // Prepend to transactions so UI updates instantly
        setTransactions((prev) => [record, ...prev]);

        // Update totals locally
        if (record.type === "GIVE") {
          setTotalGiven((prev) => prev + Number(record.amount || 0));
        } else if (record.type === "TAKE") {
          setTotalTaken((prev) => prev + Number(record.amount || 0));
        }
      } else {
        // fallback: refetch if no record returned
        await fetchTransactions();
      }

      if (data.remainingCoins !== undefined) {
        setRemainingCoins(data.remainingCoins);
        if (typeof setGlobalRemainingCoins === "function") {
          setGlobalRemainingCoins(data.remainingCoins);
        }
      }

      // Success feedback is provided via the remaining-coins toast effect
      closeGiveForm();
    } catch (err) {
      toast.error("Failed to give money.");
      closeGiveForm();
    } finally {
      setIsSubmittingGive(false);
    }
  };

  // Handlers - Take
  const openTakeForm = () => {
    setTakeForm({
      amount: "",
      name: "",
      date: todayStr,
      type: "TAKE",
      description: "",
    });
    setShowTakeForm(true);
  };
  const closeTakeForm = () => setShowTakeForm(false);
  const handleTakeFormChange = (e) => {
    const { name, value } = e.target;
    setTakeForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleTakeFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingTake(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(getApiUrl("/pg/give-or-take"), takeForm, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });
      const data = res.data || {};

      if (data.record) {
        const record = data.record;
        setTransactions((prev) => [record, ...prev]);

        if (record.type === "GIVE") {
          setTotalGiven((prev) => prev + Number(record.amount || 0));
        } else if (record.type === "TAKE") {
          setTotalTaken((prev) => prev + Number(record.amount || 0));
        }
      } else {
        await fetchTransactions();
      }

      if (data.remainingCoins !== undefined) {
        setRemainingCoins(data.remainingCoins);
        if (typeof setGlobalRemainingCoins === "function") {
          setGlobalRemainingCoins(data.remainingCoins);
        }
      }

      // Success feedback is provided via the remaining-coins toast effect
      closeTakeForm();
    } catch (err) {
      toast.error("Failed to take money.");
      closeTakeForm();
    } finally {
      setIsSubmittingTake(false);
    }
  };

  // Animated values (must come after totalGiven and totalTaken are defined)
  const givenSpring = useSpring({
    val: totalGiven,
    config: { duration: 1000 },
  });

  const takenSpring = useSpring({
    val: totalTaken,
    config: { duration: 1000 },
  });

  return (
    <>
      <Toaster position="top-center" />
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
          <div className="w-14 h-14 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="min-h-screen flex justify-center items-start bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-6 px-2 sm:px-0">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl px-2 sm:px-6 py-6 sm:py-10 w-full max-w-2xl border border-white/60 flex flex-col gap-8 sm:gap-10 mx-auto">
          {/* Totals */}
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6 items-center">
            {/* Total Given */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg border border-green-100 flex-1 flex items-center justify-between min-w-[180px]">
              <div className="flex items-center gap-3">
                <ArrowUpCircle className="w-7 h-7 text-green-400" />
                <span className="text-sm sm:text-base text-green-600 font-semibold">
                  Given
                </span>
              </div>
              <animated.p className="text-2xl sm:text-3xl font-bold text-green-500">
                {givenSpring.val.to((val) => `₹ ${val.toFixed(2)}`)}
              </animated.p>
            </div>

            {/* Total Taken */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg border border-red-100 flex-1 flex items-center justify-between min-w-[180px]">
              <div className="flex items-center gap-3">
                <ArrowDownCircle className="w-7 h-7 text-red-400" />
                <span className="text-sm sm:text-base text-red-600 font-semibold">
                  Taken
                </span>
              </div>
              <animated.p className="text-2xl sm:text-3xl font-bold text-red-500">
                {takenSpring.val.to((val) => `₹ ${val.toFixed(2)}`)}
              </animated.p>
            </div>
            {/* remaining coins toast handled via effect (no pill here) */}
          </div>

          {/* Transactions List */}
          <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white px-2 sm:px-6 py-5 sm:py-7 min-h-[180px] flex flex-col gap-3 shadow-inner">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-300">
                <Wallet className="w-10 h-10 mb-2 opacity-60" />
                <span className="text-base">No money given or taken</span>
              </div>
            ) : (
              <ul className="w-full flex flex-col gap-2">
                {[...transactions]
                  .sort((a, b) => {
                    const dateA = a.createdAt
                      ? new Date(a.createdAt)
                      : a.date
                      ? new Date(a.date)
                      : 0;
                    const dateB = b.createdAt
                      ? new Date(b.createdAt)
                      : b.date
                      ? new Date(b.date)
                      : 0;
                    return dateB - dateA;
                  })
                  .map((txn, idx) => (
                    <li
                      key={txn.id || idx}
                      className={`py-3 px-4 flex items-center justify-between text-sm sm:text-base rounded-xl shadow border hover:shadow-md transition mb-1 ${
                        txn.type === "GIVE"
                          ? "bg-green-50 border-green-100"
                          : "bg-red-50 border-red-100"
                      }`}
                    >
                      {/* Left Section */}
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-gray-800 text-base">
                          {txn.name}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {formatDateIndian(txn.date)}
                        </span>
                        {txn.description && (
                          <span className="text-xs text-gray-400">
                            #{txn.description}
                          </span>
                        )}
                      </div>

                      {/* Right Section */}
                      <div className="flex flex-col items-end gap-1 min-w-[90px]">
                        <span
                          className={`font-bold text-lg ${
                            txn.type === "GIVE"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          ₹ {txn.amount}
                        </span>
                        {txn.status && (
                          <span className="text-xs text-blue-500 font-medium">
                            {txn.status}
                          </span>
                        )}
                        <div className="flex gap-2 mt-1">
                          {/* Edit Button */}
                          <button
                            className="p-2 rounded-full bg-red-100 text-red-500 hover:bg-red-200 shadow-sm transition"
                            title="Edit"
                            onClick={() => openEditDialog(txn)}
                          >
                            <Pencil strokeWidth={1.8} className="w-4 h-4" />
                          </button>
                {/* Edit Amount Dialog */}
                {editDialog.open && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <form
                      onSubmit={handleEditSubmit}
                      className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-xs flex flex-col gap-4 border border-gray-200 relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={closeEditDialog}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                        aria-label="Close"
                      >
                        ×
                      </button>
                      <h2 className="text-lg font-bold text-gray-800 mb-2 text-center">
                        {editDialog.txn?.type === "GIVE"
                          ? "Edit Given Amount"
                          : "Edit Taken Amount"}
                      </h2>
                      <div className="text-xs text-gray-500 text-center mb-1">
                        Current {editDialog.txn?.type === "GIVE" ? "Given" : "Taken"} Amount: <span className={editDialog.txn?.type === "GIVE" ? "text-green-600" : "text-red-600"}>₹ {editDialog.txn?.amount}</span>
                      </div>
                      <div className="flex gap-2 mb-2">
                        <button
                          type="button"
                          className={`flex-1 py-2 rounded-lg font-semibold ${
                            editType === "increase"
                              ? (editDialog.txn?.type === "GIVE" ? "bg-green-500 text-white" : "bg-red-500 text-white")
                              : "bg-gray-200 text-gray-700"
                          }`}
                          onClick={() => setEditType("increase")}
                        >
                          {editDialog.txn?.type === "GIVE" ? "Increase Given" : "Increase Taken"}
                        </button>
                        <button
                          type="button"
                          className={`flex-1 py-2 rounded-lg font-semibold ${
                            editType === "decrease"
                              ? (editDialog.txn?.type === "GIVE" ? "bg-green-100 text-green-700 border border-green-400" : "bg-red-100 text-red-700 border border-red-400")
                              : "bg-gray-200 text-gray-700"
                          }`}
                          onClick={() => setEditType("decrease")}
                        >
                          {editDialog.txn?.type === "GIVE" ? "Reduce Given" : "Reduce Taken"}
                        </button>
                      </div>
                      <label className="text-sm text-gray-600">
                        {editType === "increase"
                          ? (editDialog.txn?.type === "GIVE" ? "Amount to add to Given" : "Amount to add to Taken")
                          : (editDialog.txn?.type === "GIVE" ? "Amount to reduce from Given" : "Amount to reduce from Taken")}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        required
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder={editType === "increase"
                          ? (editDialog.txn?.type === "GIVE" ? "Enter amount to add to Given" : "Enter amount to add to Taken")
                          : (editDialog.txn?.type === "GIVE" ? "Enter amount to reduce from Given" : "Enter amount to reduce from Taken")}
                      />
                      <button
                        type="submit"
                        className={`mt-2 py-2 rounded-lg font-bold shadow transition disabled:opacity-60 disabled:cursor-not-allowed ${
                          editType === "increase"
                            ? (editDialog.txn?.type === "GIVE" ? "bg-green-500 text-white hover:bg-green-600" : "bg-red-500 text-white hover:bg-red-600")
                            : (editDialog.txn?.type === "GIVE" ? "bg-green-100 text-green-700 border border-green-400 hover:bg-green-200" : "bg-red-100 text-red-700 border border-red-400 hover:bg-red-200")
                        }`}
                        disabled={isEditing}
                      >
                        {isEditing
                          ? (editType === "increase"
                              ? (editDialog.txn?.type === "GIVE" ? "Increasing..." : "Increasing...")
                              : (editDialog.txn?.type === "GIVE" ? "Reducing..." : "Reducing..."))
                          : (editType === "increase"
                              ? (editDialog.txn?.type === "GIVE" ? "Increase Given" : "Increase Taken")
                              : (editDialog.txn?.type === "GIVE" ? "Reduce Given" : "Reduce Taken"))}
                      </button>
                    </form>
                  </div>
                )}

                          {/* Mark as Settled Button */}
                          <button
                            onClick={() => handleDeleteClick(txn)}
                            className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 shadow-sm transition"
                            title="Mark as Settled"
                          >
                            <Check strokeWidth={1.8} className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}

                {/* Delete Confirmation Dialog */}
                {deleteDialog.open && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-xs flex flex-col gap-4 border border-gray-200">
                      <h3 className="text-lg font-bold text-gray-800 text-center">
                        Delete Transaction?
                      </h3>
                      <p className="text-sm text-gray-600 text-center">
                        Are you sure you want to delete this transaction?
                      </p>
                      <div className="flex gap-3 justify-center mt-2">
                        <button
                          className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
                          onClick={handleCancelDelete}
                          disabled={isDeleting}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-4 py-2 rounded bg-red-500 text-white font-semibold hover:bg-red-600 transition"
                          onClick={handleConfirmDelete}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Completing..." : "Complete"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Floating Give/Take Buttons */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-50 px-2">
        <button
          className="px-3 py-2 rounded-full bg-gradient-to-r from-green-500 to-green-700 text-white font-semibold shadow-md hover:from-green-600 hover:to-green-800 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1 text-sm"
          onClick={openGiveForm}
        >
          <MoveUp className="w-4 h-4 text-white" />
          Give
        </button>
        <button
          className="px-3 py-2 rounded-full bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold shadow-md hover:from-red-600 hover:to-red-800 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1 text-sm"
          onClick={openTakeForm}
        >
          <MoveDown className="w-4 h-4 text-white" />
          Take
        </button>
      </div>

      {/* Give Modal */}
      {showGiveForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <form
            onSubmit={handleGiveFormSubmit}
            className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-xs flex flex-col gap-4 border border-gray-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeGiveForm}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-lg font-bold text-gray-800 mb-2 text-center">
              Give Money
            </h2>
            <label className="text-sm text-gray-600">Amount</label>
            <input
              type="number"
              name="amount"
              value={giveForm.amount}
              onChange={handleGiveFormChange}
              required
              min="1"
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter amount"
            />
            <label className="text-sm text-gray-600">Name</label>
            <input
              type="text"
              name="name"
              value={giveForm.name}
              onChange={handleGiveFormChange}
              required
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="To whom?"
            />
            <label className="text-sm text-gray-600">Date</label>
            <input
              type="date"
              name="date"
              value={giveForm.date}
              onChange={handleGiveFormChange}
              required
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <label className="text-sm text-gray-600">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              name="description"
              value={giveForm.description}
              onChange={handleGiveFormChange}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Description (optional)"
            />
            <input type="hidden" name="type" value="GIVE" />
            <button
              type="submit"
              className="mt-2 py-2 rounded-lg bg-gradient-to-r from-green-400 to-green-500 text-white font-bold shadow hover:from-green-500 hover:to-green-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSubmittingGive}
            >
              {isSubmittingGive ? "Giving..." : "Give"}
            </button>
          </form>
        </div>
      )}

      {/* Take Modal */}
      {showTakeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <form
            onSubmit={handleTakeFormSubmit}
            className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-xs flex flex-col gap-4 border border-gray-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeTakeForm}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-lg font-bold text-gray-800 mb-2 text-center">
              Take Money
            </h2>
            <label className="text-sm text-gray-600">Amount</label>
            <input
              type="number"
              name="amount"
              value={takeForm.amount}
              onChange={handleTakeFormChange}
              required
              min="1"
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter amount"
            />
            <label className="text-sm text-gray-600">Name</label>
            <input
              type="text"
              name="name"
              value={takeForm.name}
              onChange={handleTakeFormChange}
              required
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="From whom?"
            />
            <label className="text-sm text-gray-600">Date</label>
            <input
              type="date"
              name="date"
              value={takeForm.date}
              onChange={handleTakeFormChange}
              required
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <label className="text-sm text-gray-600">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              name="description"
              value={takeForm.description}
              onChange={handleTakeFormChange}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Description (optional)"
            />
            <input type="hidden" name="type" value="TAKE" />
            <button
              type="submit"
              className="mt-2 py-2 rounded-lg bg-gradient-to-r from-red-400 to-pink-500 text-white font-bold shadow hover:from-red-500 hover:to-pink-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSubmittingTake}
            >
              {isSubmittingTake ? "Taking..." : "Take"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
