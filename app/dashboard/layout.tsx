import type React from "react"
import { EmployeeSidebar } from "@/components/employee/employee-sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <EmployeeSidebar />
      <main className="flex-1 bg-muted/30">{children}</main>
    </div>
  )
}
