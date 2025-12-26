import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClipboard, FiUser, FiLogOut } from 'react-icons/fi';
import { HiOutlineQrCode } from 'react-icons/hi2';

const Header = ({ user, onSignIn, onSignOut, isLoading }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const menuRef = useRef(null);
  const qrRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (qrRef.current && !qrRef.current.contains(event.target)) {
        setIsQROpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAvatarClick = () => {
    if (user) {
      setIsMenuOpen(!isMenuOpen);
      setIsQROpen(false);
    }
  };

  const handleQRClick = () => {
    setIsQROpen(!isQROpen);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-gradient-to-r from-sg-blue-600 via-sg-blue-500 to-sg-blue-600 text-white px-4 py-3 shadow-lg relative z-50">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.4 }}
          >
            <FiClipboard className="w-5 h-5" />
          </motion.div>
          <h1 className="text-lg font-bold tracking-tight">ClipSync</h1>
        </motion.div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          {/* QR Code Button */}
          <div className="relative" ref={qrRef}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={handleQRClick}
              className="w-9 h-9 rounded-full flex items-center justify-center border border-white/30 hover:border-white/50 transition-all duration-200"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
              title="Open Web App"
            >
              <HiOutlineQrCode className="w-5 h-5" />
            </motion.button>

            {/* QR Code Popup */}
            <AnimatePresence>
              {isQROpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="absolute right-0 top-12 w-48 rounded-xl border border-white/20 shadow-2xl overflow-hidden p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                >
                  <p className="text-xs font-semibold text-gray-700 text-center mb-3">
                    Scan to open Web App
                  </p>
                  <div className="flex justify-center">
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?color=000000&bgcolor=FFFFFF&data=https://clipsyncwebapp.netlify.app&qzone=1&margin=0&size=120x120&ecc=L" 
                      alt="Scan to open ClipSync Web App"
                      className="w-28 h-28 rounded"
                    />
                  </div>
                  <a 
                    href="https://clipsyncwebapp.netlify.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-3 block text-center text-xs text-sg-blue-600 hover:text-sg-blue-800 hover:underline font-medium"
                  >
                    clipsyncwebapp.netlify.app
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Avatar / Menu */}
          <div className="relative" ref={menuRef}>
            <AnimatePresence mode="wait">
              {user ? (
                // Logged in - Show Avatar
                <motion.button
                  key="avatar"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  onClick={handleAvatarClick}
                  className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/40 hover:border-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-sg-blue-400 flex items-center justify-center">
                      <FiUser className="w-4 h-4 text-white/80" />
                    </div>
                  )}
                </motion.button>
              ) : (
                // Not logged in - Show User placeholder
                <motion.button
                  key="user-placeholder"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  onClick={onSignIn}
                  disabled={isLoading}
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-white/30 hover:border-white/50 transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  }}
                  title="Sign in with Google"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <FiUser className="w-4 h-4" />
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isMenuOpen && user && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="absolute right-0 top-12 w-56 rounded-xl border border-white/20 shadow-2xl overflow-hidden"
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-200/50">
                    <div className="flex items-center gap-3">
                      {user.photoURL && (
                        <img
                          src={user.photoURL}
                          alt=""
                          className="w-10 h-10 rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {user.displayName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <motion.button
                      whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                      onClick={() => {
                        setIsMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-left text-red-600 hover:text-red-700 transition-colors"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Logout</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
