"use client"

import { useState } from "react"
import { FileText, Receipt, GraduationCap } from "lucide-react"
import { AppSidebar, MobileNav } from "@/components/app-sidebar"
import { BalanceOverview } from "@/components/balance/balance-overview"
import { DocumentSection } from "@/components/documents/document-section"
import { AuthGuard } from "@/components/auth-guard"
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
              {activeSection === "contracts" && (
                <DocumentSection
                  storageKey="fv-contracts"
                  title="Contracts"
                  icon={FileText}
                  emptyMessage="No contracts saved yet. Add your first contract."
                />
              )}
              {activeSection === "receipts" && (
                <DocumentSection
                  storageKey="fv-receipts"
                  title="Receipts"
                  icon={Receipt}
                  emptyMessage="No receipts saved yet. Add your first receipt."
                />
              )}
              {activeSection === "diplomas" && (
                <DocumentSection
                  storageKey="fv-diplomas"
                  title="Diplomas"
                  icon={GraduationCap}
                  emptyMessage="No diplomas saved yet. Add your first diploma."
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
