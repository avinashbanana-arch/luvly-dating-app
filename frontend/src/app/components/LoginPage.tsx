import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, Heart, Phone, KeyRound, Search } from "lucide-react";
import {
  requestOtp,
  verifyContinueOtp,
  setToken,
  ApiError,
} from "../../lib/api";
import { getPhoneDigitRule, phoneCountryOptions } from "../../lib/countries";
import { TermsModal } from "./SettingsModals";

interface LoginPageProps {
  onLogin: (isNewUser: boolean) => void;
}

type AuthMethod = "phone" | null;
type Step = "choice" | "details" | "code";

export function LoginPage({ onLogin }: LoginPageProps) {
  const [method, setMethod] = useState<AuthMethod>(null);
  const [step, setStep] = useState<Step>("choice");
  const [phone, setPhone] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(phoneCountryOptions[0]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devHint, setDevHint] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const filteredCountries = phoneCountryOptions.filter((country) => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) return true;
    return (
      country.name.toLowerCase().includes(query) ||
      country.dialCode.includes(query) ||
      country.code.toLowerCase().includes(query)
    );
  });

  const chooseMethod = (nextMethod: AuthMethod) => {
    setMethod(nextMethod);
    setStep("details");
    setCode("");
    setError("");
    setDevHint("");
    setCountryPickerOpen(false);
    setCountrySearch("");
  };

  const formatPhoneForOtp = () => {
    const phoneDigits = phone.replace(/\D/g, "");
    return `${phoneCountry.dialCode}${phoneDigits}`;
  };

  const validatePhone = () => {
    const phoneDigits = phone.replace(/\D/g, "");
    const digitRule = getPhoneDigitRule(phoneCountry.code);
    if (!phone.trim()) return "Please enter your phone number.";
    if (phoneDigits.length < digitRule.min || phoneDigits.length > digitRule.max) {
      return digitRule.min === digitRule.max
        ? `Enter a valid ${digitRule.max}-digit phone number.`
        : `Enter a valid phone number with ${digitRule.min}-${digitRule.max} digits.`;
    }
    return "";
  };

  useEffect(() => {
    if (step === "choice") return;
    window.history.pushState({ luvlyLoginStep: step }, "");
    const handlePopState = () => {
      if (step === "code") {
        setStep("details");
        window.history.pushState({ luvlyLoginStep: "details" }, "");
      } else if (step === "details") {
        setStep("choice");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [step]);

  useEffect(() => {
    if (!showTerms) return;
    window.history.pushState({ luvlyLoginTerms: true }, "");
    const handlePopState = () => {
      setShowTerms(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [showTerms]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!method) return;
    const errors: string[] = [];

    if (method === "phone") {
      const phoneError = validatePhone();
      if (phoneError) errors.push(phoneError);
    }
    if (!navigator.onLine) errors.push("No internet connection.");
    if (errors.length) {
      setError(errors.join("\n"));
      return;
    }

    setError("");
    setLoading(true);
    try {
      const data = await requestOtp(formatPhoneForOtp(), "continue");
      setDevHint(
        data.delivery === "console"
          ? "Dev mode: check your backend terminal for the phone OTP."
          : "OTP sent by SMS."
      );
      setStep("code");
    } catch (err) {
      setError(
        !navigator.onLine
          ? "No internet connection."
          : err instanceof ApiError
            ? err.message
            : "Couldn't send OTP. Please try again."
      );
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
      const data = await verifyContinueOtp(formatPhoneForOtp(), code);
      await setToken(data.token);
      onLogin(!!data.isNewUser);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "";
      setError(
        message.toLowerCase().includes("invalid") || message.toLowerCase().includes("expired")
          ? "The OTP you entered is incorrect."
          : message || "Couldn't verify OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-full overflow-hidden bg-[#070711] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_12%,rgba(255,46,118,0.58),transparent_32%),radial-gradient(circle_at_18%_0%,rgba(105,10,48,0.72),transparent_34%),linear-gradient(160deg,#05050e_0%,#220615_42%,#090912_100%)]" />
      <div className="absolute -left-24 top-8 h-72 w-72 rounded-full border border-[#f75490]/20 bg-[#a20941]/10 blur-sm" />
      <div className="absolute right-[-90px] top-24 h-80 w-80 rounded-full border border-[#ff7aa6]/30 bg-[#ff1f68]/10 blur-[2px]" />
      <div className="absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(ellipse_at_center,rgba(255,43,109,0.22),transparent_62%)]" />

      <div className="relative z-10 flex h-full flex-col items-center overflow-y-auto px-6 py-8">
        <div className="w-full max-w-md pb-8">
          <div className="pt-8 text-center">
            <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-[34px] border border-[#ffd59b]/50 bg-gradient-to-br from-[#ff7fb0] via-[#f21866] to-[#8e062f] shadow-[0_18px_55px_rgba(255,28,96,0.45)]">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#ff85b5] via-[#e3135b] to-[#85072e] shadow-inner">
                <Heart className="h-14 w-14 fill-[#ff2f74] text-[#ffd79b] drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]" strokeWidth={1.8} />
                <span className="absolute right-3 top-3 h-3 w-3 rounded-full bg-white/90 blur-[1px]" />
              </div>
            </div>

            <h1 className="font-serif text-6xl leading-none text-[#ffe1ae] drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
              Luvly
            </h1>
            <div className="mt-5 flex items-center justify-center gap-4 text-[11px] font-semibold uppercase tracking-[0.36em] text-white/85">
              <span className="h-px w-9 bg-[#d89675]/80" />
              <span>Welcome to Luvly</span>
              <Heart className="h-4 w-4 fill-[#ff3f7f] text-[#ff8aaf]" />
            </div>
            <p className="mt-2 font-serif text-lg italic text-[#ffd9aa]">
              Find meaningful connections
            </p>
          </div>

          <div className="mt-12 rounded-[30px] border border-[#d89075]/70 bg-[#080912]/88 p-7 shadow-[0_28px_80px_rgba(0,0,0,0.58)] backdrop-blur">
            <div className="mb-7 flex items-center justify-center gap-5">
              <span className="h-px w-20 bg-gradient-to-r from-transparent to-[#c98b73]" />
              <Heart className="h-5 w-5 fill-[#ffe1ae] text-[#ffe1ae]" />
              <span className="h-px w-20 bg-gradient-to-l from-transparent to-[#c98b73]" />
            </div>

          {step === "choice" && (
            <div>
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => chooseMethod("phone")}
                  className="flex h-16 w-full items-center justify-between rounded-2xl bg-gradient-to-r from-[#f01c66] to-[#c9064f] px-6 text-white shadow-[0_16px_32px_rgba(232,18,87,0.42)] transition-transform hover:-translate-y-0.5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#d20a55]">
                    <Phone className="h-6 w-6 fill-current" />
                  </span>
                  <span className="text-base font-semibold">Continue with phone number</span>
                  <ArrowRight className="h-5 w-5 text-white/90" />
                </button>
              </div>

              <div className="my-7 flex items-center justify-center gap-4">
                <span className="h-px w-14 bg-gradient-to-r from-transparent to-[#c98b73]" />
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#d89075]/60 text-[#ff3f7f]">
                  <Heart className="h-4 w-4" />
                </span>
                <span className="h-px w-14 bg-gradient-to-l from-transparent to-[#c98b73]" />
              </div>

              <p className="text-center text-[13px] leading-5 text-white/55">
                By continuing, you agree to our{" "}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="font-semibold text-[#ff3f7f] underline decoration-[#ff3f7f]/50 underline-offset-2 hover:text-[#ff8ab0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8ab0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080912]"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="font-semibold text-[#ff3f7f] underline decoration-[#ff3f7f]/50 underline-offset-2 hover:text-[#ff8ab0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8ab0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080912]"
                >
                  Privacy Policy
                </button>.
              </p>

              <div className="mt-7 text-center">
                <p className="text-sm font-semibold text-white">Trouble signing in?</p>
                <button
                  type="button"
                  className="mt-1 text-sm font-semibold text-[#ff3f7f] underline decoration-[#ff3f7f]/50 underline-offset-4"
                >
                  Contact us
                </button>
              </div>

              {error && <p className="text-sm text-[#ff9caf] mt-4 text-center">{error}</p>}
            </div>
          )}

          {step === "details" && method && (
            <form onSubmit={handleSendCode}>
              <h2 className="text-2xl mb-2 text-center text-[#ffe1ae]">Continue with phone</h2>
              <p className="text-sm text-white/60 text-center mb-6">
                Enter your phone number for OTP verification.
              </p>

              <label className="text-sm text-white/70 mb-2 block">
                Phone number
              </label>
              {method === "phone" && (
                <div className="relative mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCountryPickerOpen((open) => !open);
                      setCountrySearch("");
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/95 px-4 py-3 text-left text-[#171019] focus:outline-none focus:border-[#ff4f86]"
                  >
                    <span className="min-w-0 truncate text-sm text-[#171019]">
                      {phoneCountry.flag} {phoneCountry.name} {phoneCountry.dialCode}
                    </span>
                    <ChevronDown className="h-5 w-5 flex-shrink-0 text-[#b36b70]" />
                  </button>

                  {countryPickerOpen && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-[#d89075]/45 bg-[#10101a] shadow-xl">
                      <div className="relative border-b border-white/10">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                        <input
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          placeholder="Search country or +91"
                          className="w-full border-0 bg-transparent px-10 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {filteredCountries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              const maxDigits = getPhoneDigitRule(country.code).max;
                              setPhoneCountry(country);
                              setPhone((current) => current.replace(/\D/g, "").slice(0, maxDigits));
                              setCountryPickerOpen(false);
                              setCountrySearch("");
                            }}
                            className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-[#ff3f7f]/10 ${
                              phoneCountry.code === country.code ? "bg-[#ff3f7f]/15 text-[#ffd9aa]" : "text-white/75"
                            }`}
                          >
                            <span className="min-w-0 truncate">{country.flag} {country.name}</span>
                            <span className="ml-3 flex-shrink-0 font-semibold">{country.dialCode}</span>
                          </button>
                        ))}
                        {filteredCountries.length === 0 && (
                          <p className="px-4 py-4 text-center text-sm text-white/45">No countries found</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#b36b70]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, getPhoneDigitRule(phoneCountry.code).max)
                    )
                  }
                  placeholder="9876543210"
                  className="w-full rounded-2xl border border-white/10 bg-white/95 py-3 pl-12 pr-4 text-[#171019] placeholder:text-[#8d7a82] focus:outline-none focus:border-[#ff4f86]"
                />
              </div>

              {error && (
                <div className="text-sm text-[#ff9caf] mt-3 whitespace-pre-line">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 rounded-2xl bg-gradient-to-r from-[#f01c66] to-[#c9064f] py-4 text-white shadow-[0_14px_28px_rgba(232,18,87,0.38)] transition-shadow hover:shadow-[0_16px_34px_rgba(232,18,87,0.48)] disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setDevHint("");
                  setCode("");
                  setStep("choice");
                }}
                className="w-full mt-4 text-sm text-[#ffd9aa] hover:text-white"
              >
                Back
              </button>
            </form>
          )}

          {step === "code" && method && (
            <form onSubmit={handleVerifyCode}>
              <h2 className="text-2xl mb-2 text-center text-[#ffe1ae]">Enter OTP</h2>
              <p className="text-sm text-white/60 text-center mb-4">
                Sent to {phone}
              </p>
              {devHint && (
                <p className="text-xs text-[#ffd9aa] bg-[#ffd9aa]/10 border border-[#ffd9aa]/25 rounded-xl p-3 mb-4">
                  {devHint}
                </p>
              )}

              <label className="text-sm text-white/70 mb-2 block">6-digit OTP</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#b36b70]" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  maxLength={6}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="w-full rounded-2xl border border-white/10 bg-white/95 py-3 pl-12 pr-4 text-[#171019] placeholder:text-[#8d7a82] focus:outline-none focus:border-[#ff4f86]"
                  required
                />
              </div>

              {error && <p className="text-sm text-[#ff9caf] mt-3">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 rounded-2xl bg-gradient-to-r from-[#f01c66] to-[#c9064f] py-4 text-white shadow-[0_14px_28px_rgba(232,18,87,0.38)] transition-shadow hover:shadow-[0_16px_34px_rgba(232,18,87,0.48)] disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify & continue"}
              </button>
            </form>
          )}
        </div>
      </div>
      </div>
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
}
