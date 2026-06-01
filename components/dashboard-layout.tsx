"use client"

import * as React from "react"
import { AppSidebar } from "./app-sidebar"
import { AppHeader } from "./app-header"
import { WalletGate } from "@/components/dashboard/WalletGate"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { QueryProvider } from "./query-provider"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full bg-background text-foreground">
          <AppSidebar />
          <SidebarInset className="flex flex-col bg-transparent">
            <AppHeader />
            <main className="flex-1 px-4 md:px-8 py-8">
              <div className="mx-auto w-full max-w-[1200px]">
                <WalletGate>{children}</WalletGate>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </QueryProvider>
  )
}
