import React, { useState } from 'react';
import { Eye, EyeOff, TrendingUp, Smartphone, Lock, X } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useUser } from '../Context/CurrentUserIdContext';
import { useGroup } from '../Context/GroupContext';
import { getApiUrl, getBaseUrl } from "../Utils/api";
import { registerDeviceForNotifications, sendOtp } from '../Utils/firebase';

export function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotUserId, setForgotUserId] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [confirmationResult, setConfirmationResult] = useState(null);


  const { setUserFromToken } = useUser();
  const { fetchAllGroups } = useGroup();
  const navigate = useNavigate();

  function onSwitchToSignup() {
    navigate('/signup');
  }

  function onSuccesLogin(user) {
    console.log('Logged in user:', user);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!userId || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(getApiUrl('/auth/login'), {
        userId,
        password,
      });

      if (response.status === 200) {
        const token = response.data.token;
        localStorage.setItem('token', token);

        setUserFromToken(); 
        const user = jwtDecode(token);
        onSuccesLogin(user);

        registerDeviceForNotifications(user.userId, fetchAllGroups);
        navigate('/');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response && err.response.status === 401) {
        setError('Invalid credentials');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password handlers
const handleSendOtp = async () => {
  setForgotError('');
  setOtpLoading(true);

  try {
    // ✅ 1. Verify user exists by calling backend (raw number, no +91)
    await axios.post(getApiUrl('/auth/forgot-password'), { mobile: forgotUserId });

    // ✅ 2. Convert only for Firebase OTP
    const formattedPhone = `+91${forgotUserId}`;

    console.log('Formatted phone for OTP:', formattedPhone);

    // ✅ 3. Send OTP via Firebase
    await sendOtp(formattedPhone,setConfirmationResult);

    setOtpSent(true);
    toast.success("OTP sent successfully!");
  } catch (err) {
    console.error("❌ OTP error:", err);
    if (err.response?.data?.message) {
      setForgotError(err.response.data.message);
    } else if (err.message) {
      setForgotError(err.message);
    } else {
      setForgotError('Failed to send OTP. Please try again.');
    }
  } finally {
    setOtpLoading(false);
  }
};


  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    console.log(confirmationResult.verificationId)
    try {
      // Call your backend API to reset password
      await axios.post(getApiUrl('/auth/reset-password'), {
        firebaseIdToken: confirmationResult.verificationId,
        userId: forgotUserId,
        newPassword,
      });


      setShowForgotModal(false);
      setOtpSent(false);
      setForgotUserId('');
      setOtp('');
      setNewPassword('');
      setForgotError('');
      alert('Password reset successful. Please login with your new password.');
    } catch (err) {
      setForgotError('Failed to reset password. Please check OTP and try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password Step State
  const [forgotStep, setForgotStep] = useState(1);

  // Helper to reset forgot password modal state
  function resetForgotModal() {
    setShowForgotModal(false);
    setOtpSent(false);
    setForgotUserId('');
    setOtp('');
    setNewPassword('');
    setForgotError('');
    setForgotLoading(false);
    setOtpLoading(false);
    setForgotStep(1);
    setConfirmationResult(null);
  }

  // Step 1: Send OTP
  const handleSendOtpStep = async () => {
    setForgotError('');
    setOtpLoading(true);

    try {
      // 1. Verify user exists by calling backend (raw number, no +91)
      await axios.post(getApiUrl('/auth/forgot-password'), { mobile: forgotUserId });

      // 2. Convert only for Firebase OTP
      const formattedPhone = `+91${forgotUserId}`;

      // 3. Send OTP via Firebase (setupRecaptcha is called inside sendOtp)
      await sendOtp(formattedPhone, setConfirmationResult);

      setOtpSent(true);
      setForgotStep(2);
      // toast.success("OTP sent successfully!"); // Uncomment if using toast
    } catch (err) {
      if (err.response?.data?.message) {
        setForgotError(err.response.data.message);
      } else if (err.message) {
        setForgotError(err.message);
      } else {
        setForgotError('Failed to send OTP. Please try again.');
      }
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 2: Verify OTP
const handleVerifyOtpStep = async (e) => {
  e.preventDefault();
  setForgotError('');
  setForgotLoading(true);

  try {
    if (!confirmationResult) throw new Error("OTP not sent or expired.");

    // Confirm OTP with Firebase
    const result = await confirmationResult.confirm(otp);
    if (result.user) {
      // ✅ get Firebase ID token
      const idToken = await result.user.getIdToken();
      // Save for Step 3
      setConfirmationResult({ ...confirmationResult, idToken });
      setForgotStep(3);
    } else {
      setForgotError("Invalid OTP. Please try again.");
    }
  } catch (err) {
    console.error("OTP verification error:", err);
    setForgotError('Invalid OTP. Please try again.');
  } finally {
    setForgotLoading(false);
  }
};

  // Step 3: Reset Password
// Step 3: Reset Password
const handleResetPasswordStep = async (e) => {
  e.preventDefault();
  setForgotError('');
  setForgotLoading(true);

  try {
    if (!confirmationResult?.idToken) throw new Error("No Firebase token available.");

    await axios.post(getApiUrl('/auth/reset-password'), {
      firebaseIdToken: confirmationResult.idToken, // ✅ send actual ID Token
      newPassword,
    });

    resetForgotModal();
    alert('Password reset successful. Please login with your new password.');
  } catch (err) {
    console.error("Reset password error:", err);
    setForgotError('Failed to reset password. Please check OTP and try again.');
  } finally {
    setForgotLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Login UI */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your PG Expense Tracker account</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UserId
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your mobile number"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignup}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign up
              </button>
            </p>

            {/* Forgot Password button */}
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-sm text-blue-500 hover:underline mt-2"
            >
              Forgot Password?
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={resetForgotModal}
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Forgot Password</h2>




            {/* Step 1: Send OTP */}
            {forgotStep === 1 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendOtpStep();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UserId
                  </label>
                  <input
                    type="text"
                    value={forgotUserId}
                    onChange={(e) => setForgotUserId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Enter your mobile number"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={otpLoading || !forgotUserId}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition-all disabled:opacity-50"
                >
                  {otpLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
                {forgotError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                    <p className="text-red-700 text-sm">{forgotError}</p>
                  </div>
                )}
              </form>
            )}

            {/* Step 2: Verify OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtpStep} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Enter OTP"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading || !otp}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {forgotLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
                {forgotError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                    <p className="text-red-700 text-sm">{forgotError}</p>
                  </div>
                )}
              </form>
            )}

            {/* Step 3: Reset Password */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPasswordStep} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading || !newPassword}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {forgotLoading ? 'Resetting...' : 'Reset Password'}
                </button>
                {forgotError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                    <p className="text-red-700 text-sm">{forgotError}</p>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}
      <div id="recaptcha-container"></div>
    </div>
  );
}
