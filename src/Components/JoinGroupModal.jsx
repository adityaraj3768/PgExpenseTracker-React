
import React, { useState } from 'react';
import axios from 'axios';
import { getApiUrl } from "../Utils/api";

export default function JoinGroupModal({ onClose, onEnterGroup }) {
  const [groupCode, setGroupCode] = useState('');
  const [userId,setUserId]=useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [joinedGroupCode, setJoinedGroupCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupCode.trim() && !userId.trim()) return;

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');

      const response = await axios.post(
        getApiUrl('/pg/join-group'),
        { 
          groupCode: groupCode.trim()
          },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const returnedCode = response.data?.groupCode || groupCode.trim();
      setJoinedGroupCode(returnedCode);
      setSuccessMessage(`Successfully joined group: ${response.data.groupName || returnedCode}`);
      setGroupCode('');
    } catch (error) {
      if (error.response && error.response.status === 409) {
        alert(error.response.data); // Show "User is already in a group"
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-96 text-center">
        {!successMessage ? (
          <>
            <h2 className="text-2xl font-bold mb-4">Join a Group</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Enter group code"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring focus:border-blue-300"
                required
              />
              
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
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Joining...' : 'Join'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-green-600 mb-3">Joined Successfully!</h2>
            <p className="text-gray-700 mb-4">{successMessage}</p>
            {joinedGroupCode ? (
              <>
                <div className="bg-gray-100 px-4 py-2 rounded text-lg font-mono mb-4">{joinedGroupCode}</div>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(joinedGroupCode);
                      } catch {}
                    }}
                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => {
                      setJoinedGroupCode('');
                      setSuccessMessage('');
                      onClose();
                      if (typeof onEnterGroup === 'function') onEnterGroup();
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Enter Group
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gray-400 text-white hover:bg-gray-500"
              >
                Done
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
