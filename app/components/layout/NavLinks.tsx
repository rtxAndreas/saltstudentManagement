"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiCheckSquare,
  FiChevronRight,
  FiClipboard,
  FiCreditCard,
  FiFileText,
  FiGrid,
  FiHelpCircle,
  FiSettings,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { useUser } from "@/app/context/userContext";
import { getNavigationForRole, type NavItem } from "./Constants";

interface NavLinksProps {
  onClose?: () => void;
}

function NavItemLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
        isActive
          ? "border-blue-100 bg-blue-50 text-blue-700 shadow-sm"
          : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-white"}`}
      >
        {renderIcon(item.href)}
      </span>
      <span>{item.label}</span>
      {isActive && (
        <div className="ml-auto relative flex h-2 w-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 animate-ping rounded-full bg-blue-600" />
        </div>
      )}
    </Link>
  );
}

function renderIcon(href: string) {
  switch (href) {
    case "/dashboard":
    case "/portal":
    case "/portal/grades":
      return <FiBarChart2 size={17} />;
    case "/schoolYear":
    case "/period":
    case "/schedule":
    case "/events":
    case "/portal/schedule":
    case "/portal/events":
      return <FiCalendar size={17} />;
    case "/class":
    case "/users":
      return <FiUsers size={17} />;
    case "/course":
      return <FiBookOpen size={17} />;
    case "/student":
      return <FiUser size={17} />;
    case "/assignment":
    case "/exams":
    case "/portal/exams":
      return <FiClipboard size={17} />;
    case "/classroom":
      return <FiGrid size={17} />;
    case "/grade":
    case "/assessments":
    case "/reports":
    case "/portal/reports":
      return <FiFileText size={17} />;
    case "/attendance":
      return <FiCheckSquare size={17} />;
    case "/finance":
    case "/portal/finance":
      return <FiCreditCard size={17} />;
    case "/portal/notifications":
      return <FiBell size={17} />;
    case "/help":
      return <FiHelpCircle size={17} />;
    case "/configuration":
    case "/settings":
      return <FiSettings size={17} />;
    default:
      return <FiGrid size={17} />;
  }
}

export default function NavLinks({ onClose }: NavLinksProps) {
  const pathname = usePathname();
  const { isAdmin, isLoading } = useUser();
  const { userFormat } = useUser();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const visibleRoutes = useMemo<NavItem[]>(() => {
    return getNavigationForRole(userFormat?.role).map((item) => ({
      ...item,
      children: item.children?.filter((child) => !child.adminOnly || isAdmin),
    }));
  }, [isAdmin, userFormat?.role]);

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/portal") {
      return pathname === href;
    }
    if (
      href === "/vie-scolaire" ||
      href === "/ma-vie" ||
      href === "/scolarite" ||
      href === "/pedagogie" ||
      href === "/examens" ||
      href === "/communication" ||
      href === "/configuration" ||
      href === "/enseignement" ||
      href === "/comptabilite"
    ) {
      return false;
    }
    return pathname.startsWith(href);
  };

  const hasActiveChild = (item: NavItem) =>
    item.children?.some((child) => isActive(child.href)) ?? false;

  useEffect(() => {
    visibleRoutes.forEach((item) => {
      if (item.children?.some((child) => pathname.startsWith(child.href))) {
        setExpanded((prev) => ({ ...prev, [item.href]: true }));
      }
    });
  }, [pathname, visibleRoutes]);

  const toggle = (href: string) => {
    setExpanded((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
      {!isLoading && (
        <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Navigation
        </p>
      )}
      {isLoading
        ? null
        : visibleRoutes.map((item) => {
            if (!item.children) {
              return (
                <NavItemLink
                  key={item.href}
                  item={item}
                  isActive={isActive(item.href)}
                  onClick={onClose}
                />
              );
            }

            const open = expanded[item.href] ?? false;
            const parentActive = hasActiveChild(item);

            return (
              <div key={item.href}>
                <button
                  type="button"
                  onClick={() => toggle(item.href)}
                  className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 ${
                    parentActive
                      ? "border-blue-100 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${parentActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-white"}`}
                  >
                    <FiSettings size={17} />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  <FiChevronRight
                    className={`shrink-0 transition-transform duration-200 ${
                      open ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {open && (
                  <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-slate-200 pl-2">
                    {item.children.map((child) => (
                      <NavItemLink
                        key={child.href}
                        item={child}
                        isActive={isActive(child.href)}
                        onClick={onClose}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
    </nav>
  );
}
