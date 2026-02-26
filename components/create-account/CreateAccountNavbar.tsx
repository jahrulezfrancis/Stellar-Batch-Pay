'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Layers, Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Documentation', href: '#docs' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Contact', href: '#contact' },
];

export const CreateAccountNavbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="w-full bg-[#0b1120] border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 bg-[#00D4AA]/15 rounded-xl flex items-center justify-center border border-[#00D4AA]/30 group-hover:bg-[#00D4AA]/25 transition-all duration-300 shadow-[0_0_12px_rgba(0,212,170,0.15)]">
              <Layers className="text-[#00D4AA] w-5 h-5" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              Stellar <span className="text-[#00D4AA]">BatchPay</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  label === 'Contact'
                    ? 'text-[#00D4AA]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 px-2"
            >
              Sign In
            </Link>
            <Button
              asChild
              className="bg-[#00E676] hover:bg-[#00b894] text-[#0A0E13] font-medium text-sm px-5 py-2 h-9 rounded-xl transition-all duration-200 shadow-[0_4px_14px_rgba(0,212,170,0.25)] hover:shadow-[0_4px_18px_rgba(0,212,170,0.35)] hover:scale-[1.03] active:scale-95"
            >
              <Link href="/register">Get Started</Link>
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0f1929] border-t border-white/5 px-4 pb-5 pt-3 flex flex-col gap-1">
          {navLinks.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                label === 'Contact'
                  ? 'text-[#00D4AA]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="border-t border-white/5 mt-2 pt-3 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Sign In
            </Link>
            <Button
              asChild
              className="bg-[#00D4AA] hover:bg-[#00b894] text-[#020B0D] font-bold text-sm h-10 rounded-xl w-full"
            >
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};