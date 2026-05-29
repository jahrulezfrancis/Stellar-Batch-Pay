"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Settings,
  FileText,
  MoreVertical,
  BookOpen,
  Clock
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "New Batch Payment",
    url: "/dashboard/new-batch",
    icon: PlusCircle,
  },
  {
    title: "Batch History",
    url: "/dashboard/history",
    icon: History,
  },
  // #359: Analytics removed from the sidebar until the metrics API
  // is real. The previous link pointed at /dashboard/analytics, which
  // had no corresponding `app/dashboard/analytics/page.tsx` and 404'd
  // — and the PaymentVolumeChart was rendering hard-coded data. Add
  // back once the metrics endpoint is wired (Option A in the issue).
  {
    title: "Batch Vesting",
    url: "/dashboard/vesting",
    icon: Clock,
  },
  {
    title: "Address Book",
    url: "/dashboard/address-book",
    icon: BookOpen,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Documentation",
    url: "/dashboard/docs",
    icon: FileText,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-[#1F2937] bg-[#121827] text-white">
      <SidebarHeader className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00D98B] shadow-lg shadow-[#00D98B]/20">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L3 7V17L12 22L21 17V7L12 2Z"
                fill="white"
                fillOpacity="0.2"
              />
              <path
                d="M12 22V12M12 12L21 7M12 12L3 7"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">
            Stellar<br />
            <span className="text-gray-400">BatchPay</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-4 py-4">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url))
            return (
              <SidebarMenuItem key={item.title} className="mb-1">
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={cn(
                    "h-12 w-full justify-start gap-4 px-4 transition-all duration-200",
                    isActive 
                      ? "bg-[#102B31] text-[#00D98B] hover:bg-[#00D98B]/15 hover:text-[#00D98B]" 
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Link href={item.url}>
                    <item.icon className={cn("h-5 w-5", isActive ? "text-[#00D98B]" : "text-gray-400")} />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t border-[#1F2937] p-4">
        <div className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-white/5">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-[#1F2937]">
              <AvatarImage src="/avatar.svg" alt="John Anderson" />
              <AvatarFallback className="bg-[#1F2937] text-white">JA</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">John Anderson</span>
              <span className="text-xs text-gray-500 text-truncate max-w-[120px]">john@company.com</span>
            </div>
          </div>
          <button className="text-gray-500 hover:text-white">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
