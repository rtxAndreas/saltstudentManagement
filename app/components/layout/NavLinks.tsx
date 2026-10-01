"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVIGATION_ROUTES } from "./Constants";

interface NavLinksProps {
  onClose?: () => void;
}

export default function NavLinks({ onClose }: NavLinksProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <nav className="flex flex-col gap-1 p-4">
      {NAVIGATION_ROUTES.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-lg transition-all duration-200 ${
              active
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <span>{item.label}</span>
            {active && (
              <div className="ml-auto relative flex h-2 w-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="absolute top-[-2px] -right-[2px] h-4 w-4 bg-blue-600 rounded-full animate-ping" />
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
