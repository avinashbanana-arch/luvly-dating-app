import { useState } from "react";
import { X, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Change Password Modal
interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (oldPassword: string, newPassword: string) => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSave,
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSave = () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters!");
      return;
    }
    onSave(oldPassword, newPassword);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl">Change Password</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showOld ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showOld ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full hover:shadow-lg transition-shadow"
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Change Email Modal
interface ChangeEmailModalProps {
  isOpen: boolean;
  currentEmail: string;
  onClose: () => void;
  onSave: (newEmail: string) => void;
}

export function ChangeEmailModal({
  isOpen,
  currentEmail,
  onClose,
  onSave,
}: ChangeEmailModalProps) {
  const [newEmail, setNewEmail] = useState(currentEmail);

  const handleSave = () => {
    if (!newEmail.includes("@")) {
      alert("Please enter a valid email!");
      return;
    }
    onSave(newEmail);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl">Change Email</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                Current Email
              </label>
              <input
                type="email"
                value={currentEmail}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-full bg-gray-100 text-gray-500 mb-4"
              />

              <label className="text-sm text-gray-600 mb-2 block">
                New Email
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                placeholder="Enter new email"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full hover:shadow-lg transition-shadow"
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Change Phone Modal
interface ChangePhoneModalProps {
  isOpen: boolean;
  currentPhone: string;
  onClose: () => void;
  onSave: (newPhone: string) => void;
}

export function ChangePhoneModal({
  isOpen,
  currentPhone,
  onClose,
  onSave,
}: ChangePhoneModalProps) {
  const [newPhone, setNewPhone] = useState(currentPhone);

  const handleSave = () => {
    if (newPhone.length < 10) {
      alert("Please enter a valid phone number!");
      return;
    }
    onSave(newPhone);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl">Change Phone Number</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                Current Phone
              </label>
              <input
                type="tel"
                value={currentPhone}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-full bg-gray-100 text-gray-500 mb-4"
              />

              <label className="text-sm text-gray-600 mb-2 block">
                New Phone Number
              </label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                placeholder="Enter new phone number"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full hover:shadow-lg transition-shadow"
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Change Username Modal
interface ChangeUsernameModalProps {
  isOpen: boolean;
  currentUsername: string;
  onClose: () => void;
  onSave: (newUsername: string) => void;
}

export function ChangeUsernameModal({
  isOpen,
  currentUsername,
  onClose,
  onSave,
}: ChangeUsernameModalProps) {
  const [newUsername, setNewUsername] = useState(currentUsername);

  const handleSave = () => {
    if (newUsername.length < 3) {
      alert("Username must be at least 3 characters!");
      return;
    }
    onSave(newUsername);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl">Change Username</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                Current Username
              </label>
              <input
                type="text"
                value={currentUsername}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-full bg-gray-100 text-gray-500 mb-4"
              />

              <label className="text-sm text-gray-600 mb-2 block">
                New Username
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                placeholder="Enter new username"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full hover:shadow-lg transition-shadow"
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Terms and Conditions Modal
interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl">Terms & Conditions</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-gray-600">
              <div>
                <h3 className="text-gray-900 mb-2">1. Acceptance of Terms</h3>
                <p>
                  By accessing and using LuvLy, you accept and agree to be bound by
                  the terms and provision of this agreement.
                </p>
              </div>

              <div>
                <h3 className="text-gray-900 mb-2">2. Use License</h3>
                <p>
                  Permission is granted to temporarily use LuvLy for personal,
                  non-commercial transitory viewing only.
                </p>
              </div>

              <div>
                <h3 className="text-gray-900 mb-2">3. User Conduct</h3>
                <p>
                  You agree not to use the service to upload, post, or transmit any
                  content that is unlawful, harmful, threatening, abusive, or
                  otherwise objectionable.
                </p>
              </div>

              <div>
                <h3 className="text-gray-900 mb-2">4. Privacy Policy</h3>
                <p>
                  We respect your privacy and are committed to protecting your
                  personal data. Please review our Privacy Policy to understand how
                  we collect and use your information.
                </p>
              </div>

              <div>
                <h3 className="text-gray-900 mb-2">5. Account Security</h3>
                <p>
                  You are responsible for maintaining the confidentiality of your
                  account and password. You agree to accept responsibility for all
                  activities that occur under your account.
                </p>
              </div>

              <div>
                <h3 className="text-gray-900 mb-2">6. Termination</h3>
                <p>
                  We reserve the right to terminate or suspend your account at any
                  time without prior notice for conduct that we believe violates
                  these Terms or is harmful to other users.
                </p>
              </div>

              <div>
                <h3 className="text-gray-900 mb-2">7. Changes to Terms</h3>
                <p>
                  We reserve the right to modify these terms at any time. We will
                  notify users of any changes by posting the new Terms on this page.
                </p>
              </div>
            </div>

            <div className="p-6 border-t">
              <button
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full hover:shadow-lg transition-shadow"
              >
                I Understand
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Delete Account Modal
interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = () => {
    if (confirmText.toLowerCase() === "delete") {
      onConfirm();
    } else {
      alert('Please type "DELETE" to confirm');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl mb-2">Delete Account</h2>
              <p className="text-sm text-gray-600 text-center">
                This action cannot be undone. All your data will be permanently
                deleted.
              </p>
            </div>

            <div className="mb-6">
              <label className="text-sm text-gray-600 mb-2 block">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-3 border border-red-300 rounded-full focus:outline-none focus:border-red-500"
                placeholder="DELETE"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
