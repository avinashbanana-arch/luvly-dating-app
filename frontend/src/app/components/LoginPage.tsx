import { useState } from "react";
import { Heart, Phone, KeyRound, Mail, Apple } from "lucide-react";
import {
  requestOtp,
  verifyOtp,
  requestEmailOtp,
  verifyEmailOtp,
  setToken,
  ApiError,
} from "../../lib/api";

interface LoginPageProps {
  onLogin: (isNewUser: boolean) => void;
}

type AuthMethod = "gmail" | "phone" | null;
type Step = "choice" | "details" | "code";

export function LoginPage({ onLogin }: LoginPageProps) {
  const [method, setMethod] = useState<AuthMethod>(null);
  const [step, setStep] = useState<Step>("choice");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devHint, setDevHint] = useState("");

  const chooseMethod = (nextMethod: AuthMethod) => {
    setMethod(nextMethod);
    setStep("details");
    setCode("");
    setError("");
    setDevHint("");
  };

  const handleApple = () => {
    setError("Apple ID sign-in needs Apple Developer setup. Use Gmail or phone OTP for now.");
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!method) return;
    setError("");
    setLoading(true);
    try {
      if (method === "phone") {
        await requestOtp(phone);
        setDevHint("Dev mode: check your backend terminal for the phone OTP.");
      } else {
        await requestEmailOtp(email);
        setDevHint("Dev mode: check your backend terminal for the Gmail OTP.");
      }
      setStep("code");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send OTP. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!method) return;
    setError("");
    setLoading(true);
    try {
      const data = method === "phone" ? await verifyOtp(phone, code) : await verifyEmailOtp(email, code);
      setToken(data.token);
      onLogin(!!data.isNewUser);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-gradient-to-b from-pink-50 to-red-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-pink-500 to-red-500 rounded-full mb-4">
            <Heart className="w-10 h-10 text-white fill-current" />
          </div>
          <h1 className="text-4xl bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
            Luvly
          </h1>
          <p className="text-gray-600 mt-2">Create your profile, then start your trial</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl">
          {step === "choice" && (
            <div>
              <h2 className="text-2xl mb-2 text-center">Login</h2>
              <p className="text-sm text-gray-500 text-center mb-6">
                Continue with Gmail, Apple ID, or phone number. New users are guided to create a profile.
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => chooseMethod("gmail")}
                  className="w-full py-3 px-4 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center justify-center gap-3"
                >
                  <Mail className="w-5 h-5" />
                  Continue with Gmail
                </button>
                <button
                  type="button"
                  onClick={handleApple}
                  className="w-full py-3 px-4 rounded-full bg-black text-white hover:bg-gray-800 transition-colors flex items-center justify-center gap-3"
                >
                  <Apple className="w-5 h-5" />
                  Continue with Apple ID
                </button>
              </div>

              <div className="flex items-center gap-4 my-6">
                <div className="h-px bg-gray-200 flex-1" />
                <span className="text-xs text-gray-400">or</span>
                <div className="h-px bg-gray-200 flex-1" />
              </div>

              <button
                type="button"
                onClick={() => chooseMethod("phone")}
                className="w-full text-pink-500 font-semibold hover:text-pink-600"
              >
                Use phone number
              </button>

              {error && <p className="text-sm text-red-500 mt-4 text-center">{error}</p>}
            </div>
          )}

          {step === "details" && method && (
            <form onSubmit={handleSendCode}>
              <h2 className="text-2xl mb-2 text-center">Login</h2>
              <p className="text-sm text-gray-500 text-center mb-6">
                Enter your {method === "gmail" ? "Gmail address" : "phone number"} for OTP verification.
              </p>

              <label className="text-sm text-gray-600 mb-2 block">
                {method === "gmail" ? "Gmail address" : "Phone number"}
              </label>
              <div className="relative">
                {method === "gmail" ? (
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                ) : (
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                )}
                <input
                  type={method === "gmail" ? "email" : "tel"}
                  value={method === "gmail" ? email : phone}
                  onChange={(e) => (method === "gmail" ? setEmail(e.target.value) : setPhone(e.target.value))}
                  placeholder={method === "gmail" ? "you@gmail.com" : "9876543210"}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                  required
                />
              </div>

              {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full hover:shadow-lg transition-shadow disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>

              <button
                type="button"
                onClick={() => setStep("choice")}
                className="w-full mt-3 text-sm text-pink-500 hover:text-pink-600"
              >
                Choose another method
              </button>
            </form>
          )}

          {step === "code" && method && (
            <form onSubmit={handleVerifyCode}>
              <h2 className="text-2xl mb-2 text-center">Enter OTP</h2>
              <p className="text-sm text-gray-500 text-center mb-4">
                Sent to {method === "gmail" ? email : phone}
              </p>
              {devHint && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                  {devHint}
                </p>
              )}

              <label className="text-sm text-gray-600 mb-2 block">6-digit OTP</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                  required
                />
              </div>

              {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full hover:shadow-lg transition-shadow disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify & continue"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
