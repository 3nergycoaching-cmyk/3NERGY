"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton, useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  UserCog,
  Zap,
  GraduationCap,
  LogOut,
  Image,
  CreditCard,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/athletes", label: "Athlètes", icon: Users },
  { href: "/acquisition", label: "Acquisition", icon: TrendingUp },
  { href: "/facturation", label: "Facturation", icon: CreditCard },
  { href: "/posts-resultats", label: "Posts Résultats", icon: Image },
  { href: "/academy", label: "Academy", icon: GraduationCap },
  { href: "/equipe", label: "Équipe", icon: UserCog },
];

function UserFooter() {
  const { user, isLoaded } = useUser();
  if (!isLoaded || !user) return null;

  const initials = `${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.toUpperCase() || "?";
  const displayName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.emailAddresses[0]?.emailAddress;
  const displayRole = (user?.publicMetadata?.role as string | undefined) ?? "Coach";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 min-w-0">
        {user?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.imageUrl} alt={displayName ?? ""} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#E6007E" }}>
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate" style={{ color: "#0F172A" }}>{displayName}</p>
          <p className="text-xs truncate" style={{ color: "#64748B" }}>{displayRole}</p>
        </div>
      </div>

      <SignOutButton redirectUrl="/sign-in">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors" style={{ color: "#64748B" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#F1F5F9"; (e.currentTarget as HTMLElement).style.color = "#0F172A"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "#64748B"; }}
        >
          <LogOut size={14} className="flex-shrink-0" />
          Se déconnecter
        </button>
      </SignOutButton>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col bg-white"
      style={{ width: "220px", flexShrink: 0, height: "100%", overflowY: "auto", borderRight: "1px solid #E2E8F0" }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid #E2E8F0" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E6007E" }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight" style={{ color: "#0F172A" }}>3NERGY</span>
            <p className="text-[10px] font-semibold tracking-widest uppercase -mt-0.5" style={{ color: "#E6007E" }}>CRM</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative"
                  style={isActive
                    ? { backgroundColor: "#FFF0F7", color: "#E6007E" }
                    : { color: "#64748B" }
                  }
                  onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.backgroundColor = "#F1F5F9"; (e.currentTarget as HTMLElement).style.color = "#0F172A"; } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.backgroundColor = ""; (e.currentTarget as HTMLElement).style.color = "#64748B"; } }}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ backgroundColor: "#E6007E" }} />
                  )}
                  <Icon size={16} className="flex-shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid #E2E8F0" }}>
        <UserFooter />
      </div>
    </aside>
  );
}
