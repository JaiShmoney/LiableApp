"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { signOutUser } from "@/lib/firebase/firebaseUtils";
import {
  IconLayoutDashboard,
  IconFolder,
  IconUsers,
  IconCalendar,
  IconSettings,
  IconChevronRight,
  IconLogout,
} from "@tabler/icons-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOutUser();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    {
      label: "Overview",
      icon: IconLayoutDashboard,
      href: "/dashboard",
    },
    {
      label: "Projects",
      icon: IconFolder,
      href: "/dashboard/projects",
    },
    {
      label: "Teams",
      icon: IconUsers,
      href: "/dashboard/teams",
    },
    {
      label: "Calendar",
      icon: IconCalendar,
      href: "/dashboard/calendar",
    },
    {
      label: "Settings",
      icon: IconSettings,
      href: "/dashboard/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Logo/Logout Button */}
      <button
        onClick={handleLogout}
        className="fixed top-4 left-4 z-40 text-2xl font-bold text-black hover:opacity-80 transition-opacity"
      >
        Liable
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white border-r transition-all duration-300 z-30 ${
          isOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-3 top-8 bg-white border rounded-full p-1 hover:bg-neutral-50"
        >
          <IconChevronRight
            className={`w-4 h-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Navigation */}
        <nav className="mt-20 p-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                    pathname === item.href
                      ? "bg-neutral-100 text-black"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-black"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 p-2 rounded-lg text-neutral-600 hover:bg-neutral-50 hover:text-black transition-colors"
          >
            <IconLogout className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span>Log out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 pt-16 ${
          isOpen ? "ml-64" : "ml-20"
        }`}
      >
        {children}
      </div>
    </div>
  );
} 