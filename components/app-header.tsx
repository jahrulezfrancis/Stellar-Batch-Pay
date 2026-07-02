"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"
import { useWallet } from "@/contexts/WalletContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { NotificationsPanel } from "@/components/dashboard/notifications-panel"

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const isDashboard = pathname === "/dashboard"
  const { expectedNetwork, selectNetwork } = useWallet()
  const [showMainnetWarning, setShowMainnetWarning] = React.useState(false)
  const [pendingNetwork, setPendingNetwork] = React.useState<"mainnet" | "testnet" | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)

  React.useEffect(() => {
    if (!isDashboard) {
      setSearchQuery("")
      setIsTyping(false)
    }
  }, [isDashboard])

  React.useEffect(() => {
    if (!isTyping) return

    const timer = setTimeout(() => {
      const query = searchQuery.trim()
      if (query) {
        router.push(`/dashboard/history?search=${encodeURIComponent(query)}`)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, isTyping, router])

  // Simple breadcrumb logic based on path
  const pathsegments = pathname.split("/").filter(Boolean)

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = searchQuery.trim()
    if (!query) {
      return
    }

    router.push(`/dashboard/history?search=${encodeURIComponent(query)}`)
  }

  const handleNetworkSelect = (network: "mainnet" | "testnet") => {
    if (network === "mainnet") {
      setPendingNetwork(network)
      setShowMainnetWarning(true)
    } else {
      selectNetwork(network)
    }
  }

  const confirmMainnetSwitch = () => {
    if (pendingNetwork) {
      selectNetwork(pendingNetwork)
      setShowMainnetWarning(false)
      setPendingNetwork(null)
    }
  }

  const cancelMainnetSwitch = () => {
    setShowMainnetWarning(false)
    setPendingNetwork(null)
  }

  const getNetworkColor = (network: string) => {
    return network === "mainnet" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
  }
  
  return (
    <header className="sticky top-0 z-30 flex h-[75px] w-full items-center justify-between border-b border-[#1F2937] bg-[#121827] px-4 md:px-8 transition-all duration-200">
      <div className="flex flex-1 items-center gap-4">
        <SidebarTrigger className="md:hidden text-gray-400" />
        {isDashboard ? (
          <form onSubmit={submitSearch} className="hidden w-full max-w-md sm:block">
            <label htmlFor="dashboard-search" className="sr-only">
              Search batch history
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                id="dashboard-search"
                type="search"
                placeholder="Search batch history..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setIsTyping(true)
                }}
                className="h-10 w-full border-[#1F2937] bg-[#1F293780]/30 pl-10 text-white placeholder-gray-500 focus:border-[#00D98B] focus:ring-[#00D98B]/20"
              />
            </div>
          </form>
        ) : (
          <Breadcrumb className="max-w-[200px] sm:max-w-none">
            <BreadcrumbList className="flex-nowrap overflow-hidden">
              <BreadcrumbItem className="hidden sm:inline-flex">
                <BreadcrumbLink href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:inline-flex text-gray-600" />
              {pathsegments.slice(1).map((segment, index) => {
                const href = `/${pathsegments.slice(0, index + 2).join("/")}`
                const isLast = index === pathsegments.length - 2
                const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace("-", " ")

                // On mobile, only show the last segment if it's deep
                const showOnMobile = isLast || pathsegments.length <= 2

                return (
                  <React.Fragment key={href}>
                    <BreadcrumbItem className={cn(!showOnMobile && "hidden sm:inline-flex")}>
                      {isLast ? (
                        <BreadcrumbPage className="text-white font-medium truncate max-w-[120px] sm:max-w-none">
                          {title}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={href} className="text-gray-400 hover:text-white transition-colors truncate max-w-[100px] sm:max-w-none">
                          {title}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator className={cn("text-gray-600", !showOnMobile && "hidden sm:inline-flex")} />}
                  </React.Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/docs"
          className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg border border-transparent hover:border-[#2d4a4f]"
        >
          Documentation
        </Link>

        <NotificationsPanel />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn("flex h-9 items-center rounded-full border border-[#1F2937] px-4 py-1 cursor-pointer hover:border-[#3a4a50] transition-colors", getNetworkColor(expectedNetwork))}>
              <div className="mr-2 h-2 w-2 rounded-full bg-current"></div>
              <span className="text-sm font-medium capitalize">{expectedNetwork}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#1F2937] border-[#2d3a40]">
            <DropdownMenuLabel className="text-gray-400">Select Network</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#2d3a40]" />
            <DropdownMenuItem
              onClick={() => handleNetworkSelect("testnet")}
              className={cn("cursor-pointer text-blue-400", expectedNetwork === "testnet" && "bg-blue-500/20")}
            >
              <span>Testnet</span>
              {expectedNetwork === "testnet" && <span className="ml-auto text-blue-400">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleNetworkSelect("mainnet")}
              className={cn("cursor-pointer text-red-400", expectedNetwork === "mainnet" && "bg-red-500/20")}
            >
              <span>Mainnet</span>
              {expectedNetwork === "mainnet" && <span className="ml-auto text-red-400">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={showMainnetWarning} onOpenChange={setShowMainnetWarning}>
          <AlertDialogContent className="bg-[#1F2937] border-[#2d3a40]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Switch to Mainnet?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                You are about to switch to the Mainnet. This will affect all transactions you submit. Make sure you have sufficient balance before proceeding.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-3">
              <AlertDialogCancel onClick={cancelMainnetSwitch} className="bg-[#2d3a40] text-gray-300 border-[#3a4a50] hover:bg-[#3a4a50]">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmMainnetSwitch} className="bg-red-600 hover:bg-red-700 text-white">
                Switch to Mainnet
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </header>
  )
}
