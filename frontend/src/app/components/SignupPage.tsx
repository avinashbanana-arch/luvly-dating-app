import { useState } from "react";
import { Heart, Mail, Lock, Eye, EyeOff, User } from "lucide-react";

interface SignupPageProps {
  onSignup: () => void;
  onSwitchToLogin: () => void;
}

export function SignupPage({ onSignup, onSwitchToLogin }: SignupPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    // Simulate signup
    onSignup();
  };

  return (
    <div className="h-full bg-gradient-to-b from-pink-50 to-red-50 flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-md py-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-pink-500 to-red-500 rounded-full mb-4">
            <Heart className="w-10 h-10 text-white fill-current" />
          </div>
          <h1 className="text-4xl bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
            LuvLy
          </h1>
          <p className="text-gray-600 mt-2">Start your journey to love</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl mb-6 text-center">Create Account</h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>

          <button
            type="submit"
            className="w-full mt-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full hover:shadow-lg transition-shadow"
          >
            Sign Up
          </button>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-pink-500 hover:text-pink-600 transition-colors"
            >
              Log In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
