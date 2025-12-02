import React, { useState, useRef } from 'react';
import axios from 'axios';
import { getApiUrl } from "../Utils/api";
import { Users, Globe, Plane, User, Home, Copy } from 'lucide-react';

const COLORS = {
  FRIENDS: {
    bg: "bg-blue-100",
    hover: "hover:bg-blue-200",
    border: "border-blue-300",
    text: "text-blue-700",
    activeBg: "bg-blue-600",
    activeText: "text-white",
  },
  FAMILY: {
    bg: "bg-green-100",
    hover: "hover:bg-green-200",
    border: "border-green-300",
    text: "text-green-700",
    activeBg: "bg-green-600",
    activeText: "text-white",
  },
  TRIP: {
    bg: "bg-purple-100",
    hover: "hover:bg-purple-200",
    border: "border-purple-300",
    text: "text-purple-700",
    activeBg: "bg-purple-600",
    activeText: "text-white",
  },
  PERSONAL: {
    bg: "bg-yellow-100",
    hover: "hover:bg-yellow-200",
    border: "border-yellow-300",
    text: "text-yellow-700",
    activeBg: "bg-yellow-500",
    activeText: "text-white",
  },
  OTHERS: {
    bg: "bg-gray-100",
    hover: "hover:bg-gray-200",
    border: "border-gray-300",
    text: "text-gray-700",
    activeBg: "bg-gray-600",
    activeText: "text-white",
  },
};

export default function CreateGroupForm({ onClose, onEnterGroup }) {
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [typeError, setTypeError] = useState(false);
  const nameInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameValid = groupName.trim() !== '';
    const typeValid = !!groupType;

    setNameError(!nameValid);
    setTypeError(!typeValid);

    if (!nameValid) {
      nameInputRef.current?.focus();
      return;
    }

    if (!typeValid) {
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');

      const response = await axios.post(
        getApiUrl('/pg/create-group'),
        { groupName: groupName.trim(), groupType },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const createdGroup = response.data;
      setGroupCode(createdGroup.groupCode);
      setGroupName('');
    } catch (error) {
      if (error.response && error.response.status === 409) {
        alert(error.response.data);
      } else {
        console.error(error);
        alert('Failed to create group.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!groupCode) return;
    try {
      await navigator.clipboard.writeText(groupCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      setCopySuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-96 text-center">
        {!groupCode ? (
          <>
            <h2 className="text-2xl font-bold mb-4">Create New Group</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => { setGroupName(e.target.value); setNameError(false); }}
                ref={nameInputRef}
                className={`w-full border rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring focus:border-blue-300 ${nameError ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'}`}
                required
              />
              {nameError && <p className="text-red-600 text-sm mb-2">Please enter a group name.</p>}

              <div className="mb-3 text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2">Group Type</label>
                <div className={`flex gap-2 items-center ${typeError ? 'ring-2 ring-red-200 rounded-md p-1' : ''}`} aria-invalid={typeError}>
                  {["FRIENDS", "TRIP", "PERSONAL", "FAMILY", "OTHERS"].map((type) => {
                    const Icon =
                      type === "FRIENDS"
                        ? Users
                        : type === "TRIP"
                        ? Plane
                        : type === "PERSONAL"
                        ? User
                        : type === "FAMILY"
                        ? Home
                        : Globe;

                    const label = type.charAt(0) + type.slice(1).toLowerCase();
                    const c = COLORS[type] || COLORS.OTHERS;
                    const activeBorder = c.border && c.border.includes("-300") ? c.border.replace("-300", "-600") : c.border;

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => { setGroupType(type); setTypeError(false); }}
                        aria-pressed={groupType === type}
                        title={label}
                        data-group-type={type}
                        className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg border p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                          groupType === type
                            ? `${c.activeBg} ${c.activeText} ${activeBorder}`
                            : `${c.bg} ${c.text} ${c.border} ${c.hover}`
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${groupType === type ? c.activeText : c.text}`} aria-hidden="true" />
                        <span className={`mt-1 text-xs ${groupType === type ? c.activeText : c.text}`}>{label}</span>
                        <span className="sr-only">{type}</span>
                      </button>
                    );
                  })}
                </div>
                {typeError && <p className="text-red-600 text-sm mt-2">Please select a group type.</p>}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-green-600 mb-3">Group Created!</h2>
            <p className="text-gray-700 mb-2">Here is your group code:</p>
            <div className="bg-gray-100 px-4 py-2 rounded text-lg font-mono mb-4">{groupCode}</div>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copySuccess ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={() => {
                  // If a landing-page enter handler is provided, call it so user can enter groups directly
                  if (typeof onEnterGroup === 'function') {
                    setGroupCode('');
                    onClose();
                    onEnterGroup();
                  } else {
                    setGroupCode('');
                    onClose();
                  }
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                Enter Group
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


