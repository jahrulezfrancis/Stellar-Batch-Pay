"use client";

import { useState } from "react";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import FormInput from "../ui/FormInput";
import PasswordStrength from "../ui/PasswordStrength";
import WalletSetup from "./WalletSetup";
import SecurityOptions from "./SecurityOptions";
import SocialSignUp from "./SocialSignUp";

const USE_CASES = [
  "Payroll & Employee Payments",
  "Contractor Payments",
  "Cross-border Transfers",
  "DeFi & Yield Distribution",
  "Gaming Rewards",
  "NFT Royalties",
  "Other",
];

export default function RegistrationForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [org, setOrg] = useState("");
  const [useCase, setUseCase] = useState("");
  const [network, setNetwork] = useState("testnet");
  const [walletConnected, setWalletConnected] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [securityNotifs, setSecurityNotifs] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    else if (password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (!confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword)
      e.confirmPassword = "Passwords do not match";
    if (!agreeTerms) e.agreeTerms = "You must agree to the Terms of Service";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-[#00d4a0]/20 border border-[#00d4a0] flex items-center justify-center mb-2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="#00d4a0"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Account Created!</h2>
        <p className="text-gray-400 text-sm max-w-xs">
          Welcome to BatchPay. Check your email to verify your account and start
          sending bulk payments.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Personal Info */}
      <FormInput
        label="Full Name"
        placeholder="Enter your full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={errors.fullName}
      />

      <FormInput
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />

      <div className="flex flex-col gap-1">
        <FormInput
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Create a strong password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <PasswordStrength password={password} />
      </div>

      <FormInput
        label="Confirm Password"
        type={showConfirmPassword ? "text" : "password"}
        placeholder="Confirm your password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
        rightElement={
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      <FormInput
        label="Organization / Company Name"
        placeholder="Enter your organization name"
        optional
        value={org}
        onChange={(e) => setOrg(e.target.value)}
      />

      {/* Primary Use Case */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-300">
          Primary Use Case
        </label>
        <div className="relative">
          <select
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            className="w-full appearance-none bg-[#1a2235] border border-gray-700 rounded-lg px-4 py-3 pr-10
              text-sm text-white focus:outline-none focus:border-[#00d4a0] focus:ring-1 focus:ring-[#00d4a0]/30
              hover:border-gray-500 transition-all duration-200 cursor-pointer"
          >
            <option value="" disabled>
              Select your primary use case
            </option>
            {USE_CASES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </div>

      <div className="border-t border-gray-800 pt-5">
        <WalletSetup
          network={network}
          onNetworkChange={setNetwork}
          onConnectWallet={() => setWalletConnected((v) => !v)}
          walletConnected={walletConnected}
        />
      </div>

      <div className="border-t border-gray-800 pt-5">
        <SecurityOptions
          twoFactor={twoFactor}
          securityNotifications={securityNotifs}
          agreeTerms={agreeTerms}
          marketingEmails={marketingEmails}
          onTwoFactorChange={setTwoFactor}
          onSecurityNotificationsChange={setSecurityNotifs}
          onAgreeTermsChange={setAgreeTerms}
          onMarketingEmailsChange={setMarketingEmails}
          termsError={errors.agreeTerms}
        />
      </div>

      <button
        type="submit"
        className="w-full py-3.5 rounded-xl font-bold text-base text-white
          active:scale-[0.98] transition-all duration-200 mt-1
          shadow-lg shadow-[#16a34a]/30 hover:shadow-[#16a34a]/50
          hover:brightness-110"
        style={{
          background: "linear-gradient(135deg, #16A34A 0%, #00D98B 100%)",
        }}
      >
        Create Account
      </button>

      <p className="text-center text-sm text-gray-400">
        Already have an account?{" "}
        <a
          href="/login"
          className="text-white font-semibold hover:text-[#00d4a0] transition-colors"
        >
          Sign In
        </a>
      </p>

      <SocialSignUp />
    </form>
  );
}