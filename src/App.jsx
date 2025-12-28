import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCopy, FiTrash2, FiLogOut, FiUploadCloud, FiKey, FiShield, FiEdit2, FiCheck } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { database, ref, push, remove, onValue, auth, signInWithGoogle, signOutUser, onAuthStateChanged } from './firebase';
import Header from './components/Header';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState(null); // 'room' or 'google'
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [history, setHistory] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Get the effective room ID based on auth mode
  // Google auth: uses plain UID (matches mobile web app)
  // Room ID mode: uses simple room ID (matches webapp)
  const getEffectiveRoomId = () => {
    if (authMode === 'google' && user) {
      // Use plain UID - matches mobile web app path: rooms/${uid}/clips
      return user.uid;
    }
    if (authMode === 'room' && roomId) {
      // Use simple room ID - matches webapp path: rooms/${roomId}/clips
      return roomId;
    }
    return null;
  };

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle Google Sign In
  const handleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      await signInWithGoogle();
      setAuthMode('google');
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ authMode: 'google' });
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      setIsAuthLoading(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await signOutUser();
      setRoomId('');
      setAuthMode(null);
      setHistory([]);
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.remove(['roomId', 'authMode']);
      }
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load auth mode and Room ID from chrome storage on mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['roomId', 'authMode'], (result) => {
        if (result.authMode) {
          setAuthMode(result.authMode);
        }
        if (result.roomId) {
          setRoomId(result.roomId);
        }
      });
    }
  }, []);

  // Subscribe to Firebase Realtime Database
  useEffect(() => {
    const effectiveRoomId = getEffectiveRoomId();
    
    if (!effectiveRoomId) {
      setHistory([]);
      return;
    }

    // For Google auth, require user to be logged in
    if (authMode === 'google' && !user) {
      setHistory([]);
      return;
    }

    const roomRef = ref(database, `rooms/${effectiveRoomId}/clips`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const clips = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value,
        }));
        clips.sort((a, b) => b.timestamp - a.timestamp);
        setHistory(clips);
      } else {
        setHistory([]);
      }
    });

    return () => unsubscribe();
  }, [roomId, authMode, user]);

  // Handle starting sync with Room ID
  const handleStartWithRoomId = () => {
    if (inputRoomId.trim()) {
      const trimmedId = inputRoomId.trim();
      setRoomId(trimmedId);
      setAuthMode('room');
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ roomId: trimmedId, authMode: 'room' });
      }
    }
  };

  // Handle syncing current clipboard
  const handleSyncClipboard = async () => {
    const effectiveRoomId = getEffectiveRoomId();
    if (!effectiveRoomId) return;
    if (authMode === 'google' && !user) return;
    
    setIsSyncing(true);
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const roomRef = ref(database, `rooms/${effectiveRoomId}/clips`);
        await push(roomRef, {
          text: text.trim(),
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error('Failed to sync clipboard:', err);
    }
    setTimeout(() => setIsSyncing(false), 500);
  };

  // Handle copy to clipboard
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle delete from Firebase
  const handleDelete = async (id) => {
    const effectiveRoomId = getEffectiveRoomId();
    if (!effectiveRoomId) return;
    
    try {
      const clipRef = ref(database, `rooms/${effectiveRoomId}/clips/${id}`);
      await remove(clipRef);
    } catch (err) {
      console.error('Failed to delete clip:', err);
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    setRoomId('');
    setAuthMode(null);
    setHistory([]);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove(['roomId', 'authMode']);
    }
  };

  // Truncate text helper
  const truncateText = (text, maxLength = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if user is connected (either via Room ID or Google)
  const isConnected = (authMode === 'room' && roomId) || (authMode === 'google' && user);

  return (
    <div className="w-popup h-popup flex flex-col bg-sg-light">
      {/* Header */}
      <Header 
        user={user} 
        onSignIn={handleSignIn} 
        onSignOut={handleSignOut} 
        isLoading={isAuthLoading} 
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {!isConnected ? (
          // Setup View - Show both options
          <div className="h-full flex flex-col items-center justify-center px-6 py-4">
            <div className="w-14 h-14 bg-sg-blue-100 rounded-full flex items-center justify-center mb-3">
              <FiUploadCloud className="w-7 h-7 text-sg-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-sg-blue-900 mb-1">Welcome to ClipSync</h2>
            <p className="text-xs text-sg-gray text-center mb-4">
              Choose how you want to sync your clipboard
            </p>

            {/* Option 1: Room ID */}
            <div className="w-full mb-3">
              <div className="flex items-center gap-2 mb-2">
                <FiKey className="w-4 h-4 text-sg-blue-500" />
                <span className="text-sm font-medium text-sg-blue-800">Room ID</span>
              </div>
              <input
                type="text"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                placeholder="Enter Room ID..."
                className="w-full px-3 py-2.5 border-2 border-sg-blue-200 rounded-lg text-center text-sg-blue-900 font-medium placeholder:text-sg-blue-300 focus:outline-none focus:border-sg-blue-500 focus:ring-2 focus:ring-sg-blue-100 transition-all text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleStartWithRoomId()}
              />
              <button
                onClick={handleStartWithRoomId}
                disabled={!inputRoomId.trim()}
                className="mt-2 w-full bg-gradient-to-r from-sg-blue-600 to-sg-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg hover:from-sg-blue-700 hover:to-sg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
              >
                Connect with Room ID
              </button>
            </div>

            {/* Divider */}
            <div className="w-full flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Option 2: Google Sign-in */}
            <div className="w-full">
              <div className="flex items-center gap-2 mb-2">
                <FiShield className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-sg-blue-800">Google Account</span>
                <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">More Secure</span>
              </div>
              <button
                onClick={handleSignIn}
                disabled={isAuthLoading}
                className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg shadow-sm hover:shadow-md hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
              >
                {isAuthLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FcGoogle className="w-5 h-5" />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          // Main View
          <div className="h-full flex flex-col">
            {/* Room ID Banner - Only show for Room ID auth mode */}
            {authMode === 'room' && (
              <div className="bg-sg-blue-50 border-b border-sg-blue-100 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-sg-gray">Room:</span>
                  <span className="text-sm font-mono font-bold text-sg-blue-700 bg-white px-2 py-0.5 rounded">
                    {roomId}
                  </span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="text-sg-gray hover:text-red-500 transition-colors p-1"
                  title="Disconnect"
                >
                  <FiLogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Sync Button */}
            <div className="px-4 py-4">
              <button
                onClick={handleSyncClipboard}
                disabled={isSyncing || !isOnline}
                className={`w-full py-4 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  isSyncing
                    ? 'bg-sg-blue-400'
                    : 'bg-gradient-to-r from-sg-blue-600 to-sg-blue-500 hover:shadow-xl hover:from-sg-blue-700 hover:to-sg-blue-600'
                } disabled:opacity-50`}
              >
                <FiUploadCloud className={`w-5 h-5 ${isSyncing ? 'animate-bounce' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Current Clipboard'}
              </button>
            </div>

            {/* History Section */}
            <div className="flex-1 flex flex-col overflow-hidden px-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-sg-gray uppercase tracking-wide">
                  Sync History
                </h3>
                {history.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                      isEditMode
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-sg-blue-50 text-sg-blue-600 hover:bg-sg-blue-100'
                    }`}
                  >
                    {isEditMode ? (
                      <>
                        <FiCheck className="w-3 h-3" />
                        <span>Done</span>
                      </>
                    ) : (
                      <>
                        <FiEdit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </>
                    )}
                  </motion.button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                {history.length === 0 ? (
                  <div className="text-center text-sg-gray text-sm py-8">
                    No clipboard history yet
                  </div>
                ) : (
                  <AnimatePresence>
                    {history.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: index * 0.05,
                          type: 'spring',
                          stiffness: 300,
                          damping: 25
                        }}
                        layout
                        className="bg-white rounded-lg border border-sg-blue-100 p-3 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-sg-blue-900 flex-1 break-words leading-relaxed">
                            {truncateText(item.text)}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Copy Button - Always visible */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleCopy(item.text)}
                              className="p-1.5 text-sg-blue-500 hover:text-sg-blue-700 hover:bg-sg-blue-50 rounded-md transition-colors"
                              title="Copy"
                            >
                              <FiCopy className="w-4 h-4" />
                            </motion.button>
                            
                            {/* Delete Button - Only visible in edit mode */}
                            <AnimatePresence>
                              {isEditMode && (
                                <motion.button
                                  initial={{ opacity: 0, scale: 0, width: 0 }}
                                  animate={{ opacity: 1, scale: 1, width: 'auto' }}
                                  exit={{ opacity: 0, scale: 0, width: 0 }}
                                  transition={{ 
                                    type: 'spring', 
                                    stiffness: 500, 
                                    damping: 30 
                                  }}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDelete(item.id)}
                                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  title="Delete"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </motion.button>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-sg-gray">
                          {formatTime(item.timestamp)}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
