"use client"

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage?: number
  totalPages?: number
  itemsShown?: string // e.g. "1-6 of 247"
  className?: string
}

export function Pagination({
  currentPage = 1,
  totalPages = 42,
  itemsShown = "1-6 of 247",
  className,
}: PaginationProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-[#1F2937]/50", className)}>
      <div className="text-sm text-gray-400">
        Showing <span className="text-gray-300 font-medium">{itemsShown}</span> batches
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-9 w-9 bg-[#121827] border-[#1F2937] text-gray-500 hover:text-white"
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              className={cn(
                "h-9 w-9 rounded-md font-medium text-sm transition-all",
                currentPage === page 
                  ? "bg-[#00D98B] hover:bg-[#00D98B]/90 text-white border-transparent" 
                  : "bg-[#121827] border-[#1F2937] text-gray-400 hover:text-white"
              )}
            >
              {page}
            </Button>
          ))}
          
          <div className="px-1 text-gray-500">
            <MoreHorizontal className="h-4 w-4" />
          </div>

          <Button
            variant="outline"
            className="h-9 w-9 bg-[#121827] border-[#1F2937] text-gray-400 hover:text-white"
          >
            {totalPages}
          </Button>
        </div>

        <Button 
          variant="outline" 
          size="icon" 
          className="h-9 w-9 bg-[#121827] border-[#1F2937] text-gray-500 hover:text-white"
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
