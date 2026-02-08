"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  IconHome,
  IconUsers,
  IconPackage,
  IconFileText,
  IconBriefcase,
  IconShoppingCart,
  IconReceipt,
  IconFileReport,
} from "@tabler/icons-react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[] // If undefined, visible to all roles
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: IconHome,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: IconUsers,
    roles: ["leader", "sales"],
  },
  {
    title: "Materials",
    href: "/materials",
    icon: IconPackage,
  },
  {
    title: "Quotations",
    href: "/quotations",
    icon: IconFileText,
    roles: ["leader", "sales"],
  },
  {
    title: "Projects",
    href: "/projects",
    icon: IconBriefcase,
  },
  {
    title: "Material Requests",
    href: "/material-requests",
    icon: IconShoppingCart,
    roles: ["leader", "engineer"],
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: IconReceipt,
    roles: ["leader", "accounting"],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: IconFileReport,
  },
]

interface SidebarProps {
  userRole: string
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true // Show to all roles
    return item.roles.includes(userRole)
  })

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <span className="text-xl font-bold text-gray-900">NAS</span>
        </Link>
      </div>

      <nav className="px-3 space-y-1">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
