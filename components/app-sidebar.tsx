"use client"

import {
  Wallet,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import type { Section } from "@/lib/types"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

const navItems: { id: Section; label: string; icon: React.ElementType; color: string }[] = [
  { id: "balance", label: "Cash Balance", icon: Wallet, color: "text-emerald-400" },
  { id: "settings", label: "Settings", icon: Settings, color: "text-blue-400" },
]

interface AppSidebarProps {
  activeSection: Section
  onSectionChange: (section: Section) => void
}

export function AppSidebar({ activeSection, onSectionChange }: AppSidebarProps) {
  const router = useRouter()
  const { logout } = useAuth()

  async function handleLogout() {
    await logout()
    router.push("/login")
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="hidden lg:flex flex-col items-center w-16 border-r border-border bg-card min-h-screen py-4 gap-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
          <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
        </div>
        <nav className="flex flex-col items-center gap-1">
          {navItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
                    activeSection === item.id
                      ? "bg-secondary"
                      : "hover:bg-secondary/60"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5",
                      activeSection === item.id ? item.color : "text-muted-foreground"
                    )}
                  />
                  <span className="sr-only">{item.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {item.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>
        <div className="flex-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="w-10 h-10 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            Logout
          </TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  )
}

export function MobileNav({
  activeSection,
  onSectionChange,
}: AppSidebarProps) {
  return (
    <nav className="lg:hidden flex items-center gap-1 p-2 border-b border-border bg-card overflow-x-auto">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onSectionChange(item.id)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
            activeSection === item.id
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          )}
        >
          <item.icon
            className={cn(
              "w-4 h-4 shrink-0",
              activeSection === item.id ? item.color : "text-muted-foreground"
            )}
          />
          {item.label}
        </button>
      ))}
    </nav>
  )
}
