"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton, useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  FolderKanban,
  UserCog,
  Zap,
  CheckSquare,
  Flag,
  GraduationCap,
  Calendar,
  Wifi,
  LogOut,
  Image,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/athletes", label: "Athlètes", icon: Users },
  { href: "/courses", label: "Courses", icon: Flag },
  { href: "/posts-resultats", label: "Posts Résultats", icon: Image },
  { href: "/acquisition", label: "Acquisition", icon: TrendingUp },
  { href: "/academy", label: "Academy", icon: GraduationCap },
  { href: "/calendrier", label: "Calendrier", icon: Calendar },
  { href: "/projets", label: "Projets", icon: FolderKanban },
  { href: "/todo", label: "To-do", icon: CheckSquare },
  { href: "/membres", label: "Membres", icon: Users },
  { href: "/equipe", label: "Équipe", icon: UserCog },
  { href: "/equipe/nolio", label: "Nolio", icon: Wifi },
];

function UserFooter() {
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) return null;

  const initials = user
    ? `${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.toUpperCase() || "?"
    : "?";

  const displayName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
      user.emailAddresses[0]?.emailAddress
    : "";

  const displayRole =
    (user?.publicMetadata?.role as string | undefined) ?? "Coach";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 min-w-0">
        {user?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.imageUrl}
            alt={displayName ?? ""}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: "#E6007E" }}
          >
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate" style={{ color: "#0A0A0A" }}>{displayName}</p>
          <p className="text-xs truncate" style={{ color: "#71717A" }}>{displayRole}</p>
        </div>
      </div>

      <SignOutButton redirectUrl="/sign-in">
        <button
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150"
          style={{ color: "#71717A" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F4F4F5";
            (e.currentTarget as HTMLButtonElement).style.color = "#0A0A0A";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "#71717A";
          }}
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
      className="flex flex-col shadow-sm"
      style={{
        width: "220px",
        flexShrink: 0,
        height: "100%",
        overflowY: "auto",
        backgroundColor: "#FAFAFA",
        borderRight: "1px solid #E4E4E7",
      }}
    >
      {/* Logo */}
      <div className="px-6 py-6" style={{ borderBottom: "1px solid #E4E4E7" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E6007E" }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight" style={{ color: "#0A0A0A" }}>3NERGY</span>
            <p className="text-xs font-medium -mt-0.5" style={{ color: "#E6007E" }}>CRM</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative"
                  style={
                    isActive
                      ? {
                          backgroundColor: "#FDF2F8",
                          color: "#E6007E",
                          borderLeft: "3px solid #E6007E",
                          paddingLeft: "9px",
                        }
                      : { color: "#71717A" }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#F4F4F5";
                      (e.currentTarget as HTMLAnchorElement).style.color = "#0A0A0A";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
                      (e.currentTarget as HTMLAnchorElement).style.color = "#71717A";
                    }
                  }}
                >
                  <Icon
                    className="flex-shrink-0"
                    size={18}
                    style={{ color: isActive ? "#E6007E" : "#71717A" }}
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid #E4E4E7" }}>
        <UserFooter />
      </div>
    </aside>
  );
}
