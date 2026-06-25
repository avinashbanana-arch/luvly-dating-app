import { useEffect, useState } from "react";
import { X, Star, Heart, Eye, Zap, Check, CreditCard, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getPaymentPlans } from "../../lib/api";

interface PremiumModalProps {
  isOpen: boolean;
  country?: string;
  required?: boolean;
  onClose: () => void;
  onUpgrade: (plan: "MONTHLY" | "YEARLY") => Promise<void> | void;
}

type Plan = "monthly" | "yearly";
type PayStep = "plans" | "payment" | "success";

export function PremiumModal({ isOpen, country, required = false, onClose, onUpgrade }: PremiumModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan>("yearly");
  const [step, setStep] = useState<PayStep>("plans");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [plans, setPlans] = useState({
    monthly: { price: "$10", period: "/month", label: "Monthly", save: "" },
    yearly: { price: "$100", period: "/year", label: "Yearly", save: "Best value" },
  });

  const features = [
    { icon: Eye, title: "See All Likes", description: "View everyone who liked you instantly" },
    { icon: Heart, title: "Unlimited Likes", description: "No daily limit — like as many as you want" },
    { icon: Zap, title: "Priority Visibility", description: "Your profile gets shown to more people" },
    { icon: Star, title: "Advanced Filters", description: "Filter by education, lifestyle, and more" },
  ];

  const formatPlanPrice = (plan: any) => {
    if (plan.currency === "INR") return `Rs ${plan.amount}`;
    if (plan.currency === "USD") return `$${plan.amount}`;
    return `${plan.amount} ${plan.currency}`;
  };

  useEffect(() => {
    if (!isOpen) return;
    getPaymentPlans(country)
      .then((data) => {
        setPlans({
          monthly: {
            price: formatPlanPrice(data.plans.MONTHLY),
            period: "/month",
            label: data.plans.MONTHLY.label,
            save: "",
          },
          yearly: {
            price: formatPlanPrice(data.plans.YEARLY),
            period: "/year",
            label: data.plans.YEARLY.label,
            save: "Best value",
          },
        });
      })
      .catch(() => {});
  }, [country, isOpen]);

  const formatCard = (val: string) =>
    val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const handlePay = async () => {
    if (!name || cardNumber.replace(/\s/g, "").length < 16 || expiry.length < 5 || cvv.length < 3) {
      alert("Please fill in all payment details.");
      return;
    }
    setProcessing(true);
    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 2000));
    try {
      await onUpgrade(selectedPlan === "yearly" ? "YEARLY" : "MONTHLY");
      setProcessing(false);
      setStep("success");
      if (!required) onClose();
      setStep("plans");
      setCardNumber(""); setExpiry(""); setCvv(""); setName("");
    } catch (err) {
      setProcessing(false);
      alert(err instanceof Error ? err.message : "Could not start subscription.");
    }
  };

  const handleClose = () => {
    if (required) return;
    onClose();
    setTimeout(() => { setStep("plans"); setProcessing(false); }, 400);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-pink-500 to-red-500 p-8 text-white text-center flex-shrink-0">
              {!required && (
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-3">
                <Star className="w-8 h-8 fill-current" />
              </div>
              <h2 className="text-3xl mb-1">Luvly Premium</h2>
              <p className="text-pink-100 text-sm">Start with 3 days free, then continue on your plan</p>
            </div>

            {/* Step: Plans */}
            {step === "plans" && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-4">
                  {features.map((f, i) => (
                    <motion.div
                      key={f.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-4"
                    >
                      <div className="w-11 h-11 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <f.icon className="w-5 h-5 text-pink-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{f.title}</h3>
                        <p className="text-sm text-gray-500">{f.description}</p>
                      </div>
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    </motion.div>
                  ))}
                </div>

                <div className="px-6 pb-6 space-y-3">
                  {(["yearly", "monthly"] as Plan[]).map((plan) => (
                    <button
                      key={plan}
                      onClick={() => setSelectedPlan(plan)}
                      className={`w-full rounded-2xl p-4 border-2 text-left transition-all ${
                        selectedPlan === plan ? "border-pink-500 bg-pink-50" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-gray-800">{plans[plan].price}</span>
                          <span className="text-gray-500 text-sm">{plans[plan].period}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {plans[plan].save && (
                            <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-semibold">
                              {plans[plan].save}
                            </span>
                          )}
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPlan === plan ? "border-pink-500 bg-pink-500" : "border-gray-300"
                          }`}>
                            {selectedPlan === plan && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {plan === "yearly" ? "3-day trial, then yearly billing" : "3-day trial, then monthly billing"}
                      </p>
                    </button>
                  ))}

                  <button
                    onClick={() => setStep("payment")}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full text-lg font-semibold hover:shadow-lg transition-shadow"
                  >
                    Continue to Payment
                  </button>
                  <p className="text-xs text-gray-400 text-center">Secured by 256-bit SSL encryption</p>
                </div>
              </div>
            )}

            {/* Step: Payment */}
            {step === "payment" && (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setStep("plans")} className="p-2 hover:bg-gray-100 rounded-full">
                    <X className="w-4 h-4 rotate-180" />
                  </button>
                  <h3 className="text-lg font-semibold">Secure Payment</h3>
                  <Lock className="w-4 h-4 text-green-500 ml-auto" />
                </div>

                {/* Order Summary */}
                <div className="bg-pink-50 rounded-2xl p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">Luvly Premium</p>
                      <p className="text-sm text-gray-500">{plans[selectedPlan].label} plan</p>
                    </div>
                    <p className="text-xl font-bold text-pink-600">
                      {plans[selectedPlan].price}
                    </p>
                  </div>
                </div>

                {/* UPI / Card Tabs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="As on card"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCard(e.target.value))}
                        placeholder="1234 5678 9012 3456"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-pink-400"
                      />
                      <CreditCard className="absolute right-4 top-3.5 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/YY"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                      <input
                        type="password"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="•••"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-400"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handlePay}
                    disabled={processing}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full font-semibold text-lg disabled:opacity-70 hover:shadow-lg transition-all"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        Processing...
                      </span>
                    ) : (
                      "Start 3-day trial"
                    )}
                  </button>
                  <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" /> Your payment is secure & encrypted
                  </p>
                </div>
              </div>
            )}

            {/* Step: Success */}
            {step === "success" && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ duration: 0.5 }}
                  className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
                >
                  <Check className="w-12 h-12 text-green-500" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-2">Welcome to Premium! 🎉</h3>
                <p className="text-gray-500">Your Luvly Premium subscription is now active.</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
