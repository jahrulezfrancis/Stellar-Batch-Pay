"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      className=" backdrop-blur-md sticky top-0 z-50 bg-[#121827]"
      style={{
        borderBottom: "1px solid #252B3D",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/new%20logo.png"
              alt="BatchPay logo"
              className="h-8 w-8 object-contain"
            />
            <div className="hidden sm:block font-semibold text-white">
              Stellar BatchPay
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm font-light text-[#E5E7EB] hover:text-[#E5E7EB]/90 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#docs"
              className="text-sm font-light text-[#E5E7EB] hover:text-[#E5E7EB]/90 transition-colors"
            >
              Documentation
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-light text-[#E5E7EB] hover:text-[#E5E7EB]/90 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="text-sm font-light text-[#E5E7EB] hover:text-[#E5E7EB]/90 transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm font-light text-[#E5E7EB] hover:text-[#E5E7EB]/90 transition-colors"
            >
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/signin">
              <Button
                size="sm"
                variant="outline"
                className="border-[#00D98B] text-[#00D98B] hover:bg-[#00D98B] hover:text-black"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                size="sm"
                className="bg-[#00D98B] text-black hover:bg-[#00c777]"
              >
                Launch App
              </Button>
            </Link>

            <button
              aria-label="Toggle menu"
              className="md:hidden p-2 rounded-lg hover:bg-secondary/10"
              onClick={() => setOpen(!open)}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 6H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 12H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 18H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden py-2 flex flex-col gap-2 pb-4">
            <Link
              href="#features"
              className="px-2 py-2 rounded text-[#E5E7EB] hover:bg-secondary/10"
            >
              Features
            </Link>
            <Link
              href="#docs"
              className="px-2 py-2 rounded text-[#E5E7EB] hover:bg-secondary/10"
            >
              Documentation
            </Link>
            <Link
              href="#pricing"
              className="px-2 py-2 rounded text-[#E5E7EB] hover:bg-secondary/10"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="px-2 py-2 rounded text-[#E5E7EB] hover:bg-secondary/10"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="px-2 py-2 rounded text-[#E5E7EB] hover:bg-secondary/10"
            >
              Contact
            </Link>
            <Link
              href="https://github.com/jahrulezfrancis/Stellar-Batch-Pay"
              target="_blank"
              className="px-2 py-2 rounded text-[#E5E7EB] hover:bg-secondary/10"
            >
              GitHub
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
