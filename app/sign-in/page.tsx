"use client"

import { useState } from "react"
import { Eye, EyeOff, Shield, Clock, BarChart3, Lock, Mail, ChevronRight, Wallet, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import Image from "next/image"

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberDevice, setRememberDevice] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br  from-[#030712] via-[#111827] to-[#030712] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Section - Welcome */}
          <div className="text-center lg:text-left space-y-8 max-h-screen">
            {/* Welcome Icon */}
            <div className="md:flex gap-5 justify-center lg:justify-start">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                 <Image src="/i.svg" alt="Stellar Batch Pay" width={40} height={40} />
                </div>
              </div>
               <h1 className="text-4xl lg:text-5xl font-bold text-white">
                Welcome Back
              </h1>
            </div>

            {/* Welcome Text */}
            <div className="space-y-4">
             
              <p className="text-lg text-[#E5E7EB] max-w-md">
                Sign in to manage your batch cryptocurrency payments.
              </p>
            </div>

            {/* Value Props */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-semibold mb-1">Bank-Level Security</h3>
                  <p className="text-gray-400 text-sm">
                    Credentials are encrypted and securely processed with industry-standard protocols.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-semibold mb-1">24/7 Access</h3>
                  <p className="text-gray-400 text-sm">
                    Manage payments anytime, anywhere with secure dashboard access.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-semibold mb-1">Real-Time Analytics</h3>
                  <p className="text-gray-400 text-sm">
                    Track transactions and monitor payment status in real-time.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center lg:text-left">
              <p className="text-gray-500 text-xs">
                <span><Lock className="w-4 h-4 inline mr-1 fill-current" /></span>Your credentials are encrypted and securely processed.
              </p>
            </div>
          </div>

          {/* Right Section - Sign In Form */}
          <div className="bg-gray-800/10 backdrop-blur-sm rounded-2xl p-8 lg:p-10 border border-gray-700/50 shadow-xl">
            <div className="space-y-6">
              {/* Form Header */}
              <div className="text-left space-y-2">
                <h2 className="text-[24px] font-bold text-white">Sign In</h2>
                <p className="text-gray-400">
                  Access your payment dashboard and transaction history.
                </p>
              </div>

              {/* Form */}
              <form className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300 text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-4 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-[54px] bg-[#37415180]/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300 text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-4 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                       className="pl-10 h-[54px] bg-[#37415180]/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20"
                  />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberDevice}
                      onCheckedChange={(checked) => setRememberDevice(checked as boolean)}
                      className="border-gray-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                    <Label htmlFor="remember" className="text-gray-300 text-sm">
                      Remember this device
                    </Label>
                  </div>
                  <Link 
                    href="/forgot-password" 
                    className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Sign In Button */}
                <Button 
                  type="submit"
                  className="w-full h-[54px]  bg-[#00D98B] hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-green-500/40"
                >
                  Sign In
                </Button>
              </form>

              {/* Divider */}
              <div className="relative py-5">
                <Separator className="bg-gray-700/50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-gray-[#1F293780]/50 px-3 text-xs text-gray-400 font-medium">
                    OR CONTINUE WITH
                  </span>
                </div>
              </div>

              {/* Alternative Sign In */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full bg-[#37415180]/50 h-[54px] border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                <Button
                  variant="outline"
                   className="w-full bg-[#37415180]/50 h-[54px] border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200"
               >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Continue with GitHub
                </Button>

                <Button
                  variant="outline"
                  className="w-full bg-[#37415180]/50 h-[54px] border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200"
               ><Wallet className="w-5 h-5 mr-2" />
                  Connect Wallet
                </Button>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  Don't have an account?{" "}
              
                </p>
                    <Link 
                    href="/sign-up" 
                    className="text-green-400 hover:text-green-300 font-medium transition-colors"
                  >
                    Create Account
                  </Link>
              </div>

              {/* Footer Note */}
              <div     className="w-full justify-center items-center flex rounded-md text-center bg-[#37415180]/30 h-[54px] border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200"
              >

                
                <p className="text-gray-500 text-xs flex">
           <Shield className="w-3 h-3  mr-2 text-green-400" />     Your credentials are encrypted and securely processed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
