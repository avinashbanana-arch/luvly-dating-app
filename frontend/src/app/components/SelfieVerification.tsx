import { useState, useRef } from "react";
import { Camera, CheckCircle, X, RefreshCw, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SelfieVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

type VerifyStep = "intro" | "camera" | "preview" | "verifying" | "success";

export function SelfieVerification({ isOpen, onClose, onVerified }: SelfieVerificationProps) {
  const [step, setStep] = useState<VerifyStep>("intro");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      setStream(mediaStream);
      setStep("camera");
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      alert("Unable to access camera. Please allow camera permissions and try again.");
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");
    setCapturedImage(dataUrl);
    stopCamera();
    setStep("preview");
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const submitVerification = async () => {
    setStep("verifying");
    // Simulate AI face verification
    await new Promise((r) => setTimeout(r, 2500));
    setStep("success");
    setTimeout(() => {
      onVerified();
      handleClose();
    }, 2000);
  };

  const handleClose = () => {
    stopCamera();
    setStep("intro");
    setCapturedImage(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="bg-white w-full max-w-md rounded-t-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-pink-500" />
                <h2 className="text-lg font-semibold">Selfie Verification</h2>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Intro Step */}
            {step === "intro" && (
              <div className="p-6 text-center space-y-5">
                <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-red-100 rounded-full flex items-center justify-center mx-auto">
                  <Camera className="w-12 h-12 text-pink-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Verify Your Identity</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    A quick selfie keeps Luvly safe and authentic. Your photo is used only for
                    verification and won't be shared with anyone.
                  </p>
                </div>
                <div className="space-y-3 text-left">
                  {[
                    "Make sure your face is clearly visible",
                    "Good lighting makes verification faster",
                    "Remove glasses or hats if possible",
                  ].map((tip) => (
                    <div key={tip} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-600">{tip}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={startCamera}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full font-semibold hover:shadow-lg transition-shadow"
                >
                  Start Verification
                </button>
              </div>
            )}

            {/* Camera Step */}
            {step === "camera" && (
              <div className="p-6 space-y-4">
                <div className="relative aspect-square bg-black rounded-2xl overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover scale-x-[-1]"
                    autoPlay
                    playsInline
                    muted
                  />
                  {/* Face guide overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-56 border-4 border-white/60 rounded-full" />
                  </div>
                  <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm">
                    Center your face in the oval
                  </p>
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <button
                  onClick={captureSelfie}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full font-semibold"
                >
                  <Camera className="w-5 h-5 inline mr-2" />
                  Take Selfie
                </button>
              </div>
            )}

            {/* Preview Step */}
            {step === "preview" && capturedImage && (
              <div className="p-6 space-y-4">
                <div className="relative aspect-square bg-black rounded-2xl overflow-hidden">
                  <img
                    src={capturedImage}
                    alt="Selfie preview"
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={retake}
                    className="py-3 border-2 border-gray-200 rounded-full flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50"
                  >
                    <RefreshCw className="w-4 h-4" /> Retake
                  </button>
                  <button
                    onClick={submitVerification}
                    className="py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full font-semibold"
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}

            {/* Verifying Step */}
            {step === "verifying" && (
              <div className="p-10 text-center space-y-5">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full mx-auto"
                />
                <div>
                  <h3 className="text-lg font-semibold">Verifying your selfie...</h3>
                  <p className="text-gray-500 text-sm mt-1">Our AI is checking your photo</p>
                </div>
              </div>
            )}

            {/* Success Step */}
            {step === "success" && (
              <div className="p-10 text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"
                >
                  <ShieldCheck className="w-10 h-10 text-green-500" />
                </motion.div>
                <h3 className="text-xl font-bold">Verified! ✅</h3>
                <p className="text-gray-500 text-sm">Your profile now shows a verified badge.</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
