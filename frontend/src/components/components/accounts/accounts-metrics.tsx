import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"

export function AccountsMetrics() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Total Accounts Card */}
      <div className="airwallex-card">
        <div className="flex flex-col h-full">
          <div className="text-sm font-medium text-muted-foreground mb-1">TOTAL ACCOUNTS</div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold mr-1">0</span>
            <span className="text-sm text-muted-foreground">/50</span>
          </div>
          <div className="mt-auto pt-4 flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Projects Card */}
      <div className="airwallex-card">
        <div className="flex flex-col h-full">
          <div className="text-sm font-medium text-muted-foreground mb-1">PROJECTS</div>
          <div className="text-2xl font-bold">0</div>
          <div className="mt-auto pt-4 flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="airwallex-card">
        <div className="flex flex-col h-full">
          <div className="text-sm font-medium text-muted-foreground mb-1">TOTAL BALANCE</div>
          <div className="text-2xl font-bold">$0.00 USD</div>
          <div className="mt-auto pt-4 flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-500"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 