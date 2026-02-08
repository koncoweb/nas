import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userRole={session.user.role} />
      <div className="flex-1 flex flex-col">
        <Header
          userName={session.user.name || "User"}
          userEmail={session.user.email || ""}
          userRole={session.user.role}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
