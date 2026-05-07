"use client"

import { useState } from "react"
import { AppSidebar, MobileNav } from "@/components/app-sidebar"
import { BalanceOverview } from "@/components/balance/balance-overview"
import { AuthGuard } from "@/components/auth-guard"
import SettingsPage from "@/app/settings/page"
import CalendarPage from "@/components/calendar/calendar-page"
import TodoPage from "@/components/todo/todo-page"
import type { Section } from "@/lib/types"

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>("balance")

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <AppSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <MobileNav
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              {activeSection === "balance" && <BalanceOverview />}
              {activeSection === "calendar" && <CalendarPage />}
              {activeSection === "todo" && <TodoPage />}
              {activeSection === "settings" && <SettingsPage />}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
