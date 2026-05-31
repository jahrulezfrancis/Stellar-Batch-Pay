'use client'

import { X } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { MotionSafe } from '@/components/motion-safe'

interface FeatureRow {
  feature: string
  starter: string | boolean
  professional: string | boolean
  enterprise: string | boolean
}

const features: FeatureRow[] = [
  {
    feature: 'Monthly Transactions',
    starter: '100',
    professional: '10,000',
    enterprise: 'Unlimited',
  },
  {
    feature: 'Analytics',
    starter: 'Basic',
    professional: 'Advanced',
    enterprise: 'Advanced',
  },
  {
    feature: 'API Access',
    starter: false,
    professional: 'Limited',
    enterprise: 'Full',
  },
  {
    feature: 'Support',
    starter: 'Email',
    professional: 'Priority',
    enterprise: 'Dedicated',
  },
]

function StatusIndicator({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <span className="text-[#00D98B]">Yes</span>
    ) : (
      <X className="mx-auto h-5 w-5 text-[#FF4D4D]" />
    )
  }
  return <span className="text-[#E0E2E8]">{value}</span>
}

export function CompareFeatures() {
  return (
    <section className="w-full py-16 md:py-24 bg-[#0A0E1A]">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 md:px-12">
        {/* Section Heading */}
        <div className="text-center mb-12">
          <MotionSafe as="h2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight"
          >
            Compare Features
          </MotionSafe>
        </div>

        {/* Table Wrapper (Card) */}
        <MotionSafe
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative overflow-hidden rounded-3xl border border-[#252B3D] bg-[#111827] shadow-[0_0_40px_#00000040]"
        >
          <Table>
            <TableHeader className="bg-[#1F2937]/50 border-b border-[#252B3D]">
              <TableRow className="hover:bg-transparent border-b-0">
                <TableHead className="h-16 text-center text-white font-semibold text-lg">Features</TableHead>
                <TableHead className="h-16 text-center text-white font-semibold text-lg">Starter</TableHead>
                <TableHead className="h-16 text-center text-white font-semibold text-lg">Professional</TableHead>
                <TableHead className="h-16 text-center text-white font-semibold text-lg">Enterprise</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.map((row, index) => (
                <TableRow
                  key={row.feature}
                  className={cn(
                    "border-b border-[#252B3D]/50 hover:bg-[#1F2937]/30 transition-colors",
                    index === features.length - 1 && "border-b-0"
                  )}
                >
                  <TableCell className="p-6 text-center font-medium text-[#E0E2E8]">
                    {row.feature}
                  </TableCell>
                  <TableCell className="p-6 text-center">
                    <StatusIndicator value={row.starter} />
                  </TableCell>
                  <TableCell className="p-6 text-center">
                    <StatusIndicator value={row.professional} />
                  </TableCell>
                  <TableCell className="p-6 text-center">
                    <StatusIndicator value={row.enterprise} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </MotionSafe>
      </div>
    </section>
  )
}
