import { X, AlertTriangle, Flag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

interface ReportModalProps {
  isOpen: boolean;
  userName: string;
  onClose: () => void;
  onReport: (reason: string, details: string) => void;
}

export function ReportModal({
  isOpen,
  userName,
  onClose,
  onReport,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");

  const reportReasons = [
    "Fake profile or scam",
    "Inappropriate photos",
    "Harassment or hate speech",
    "Underage user",
    "Spam or advertising",
    "Violence or threats",
    "Stolen photos",
    "Other",
  ];

  const handleReport = () => {
    if (selectedReason) {
      onReport(selectedReason, details);
      setSelectedReason("");
      setDetails("");
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl">Report {userName}</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl p-3 mt-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-800">
                  We take your safety seriously. All reports are reviewed.
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-3 block">
                  Why are you reporting this user?
                </label>
                <div className="space-y-2">
                  {reportReasons.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setSelectedReason(reason)}
                      className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3 ${
                        selectedReason === reason
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-red-300"
                      }`}
                    >
                      <Flag className={`w-5 h-5 ${selectedReason === reason ? "text-red-500" : "text-gray-400"}`} />
                      <span className="text-gray-800">{reason}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedReason && (
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    Additional details (optional)
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-red-500 resize-none"
                    placeholder="Please provide any additional information..."
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {details.length}/500
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={!selectedReason}
                className="flex-1 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Report
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
