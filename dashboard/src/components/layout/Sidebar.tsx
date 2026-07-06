"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  BarChart3,
  Tag,
  MapPin,
  Trash2,
  Users,
  Settings,
  LogOut,
  Leaf,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/api";

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  href: string;
  section: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  // Sección Principal
  { icon: LayoutGrid, label: "Panel Principal", href: "/dashboard", section: "Sección Principal" },
  
  // Sección de Análisis
  { icon: BarChart3, label: "Análisis y Métricas", href: "/analytics", section: "Sección de Análisis" },
  { icon: FileText, label: "Reportes", href: "/reports", section: "Sección de Análisis" },
  
  // Sección de Gestión Operativa
  { icon: Tag, label: "Categorías", href: "/categories", section: "Sección de Gestión Operativa" },
  { icon: MapPin, label: "Ubicaciones", href: "/locations", section: "Sección de Gestión Operativa" },
  { icon: Trash2, label: "Contenedores", href: "/containers", section: "Sección de Gestión Operativa" },
  
  // Sección de Personal
  { icon: Users, label: "Recolectores", href: "/collectors", section: "Sección de Personal" },
];

const SYSTEM_ITEMS: SidebarItem[] = [
  { icon: Settings, label: "Configuración", href: "/settings", section: "Sección de Sistema" },
];

export default function Sidebar() {
  const pathname = usePathname();

  // Agrupar items por sección
  const grouped = SIDEBAR_ITEMS.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, SidebarItem[]>);

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0">
      {/* Logo / Branding */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold">EcoCampus</h1>
            <p className="text-xs text-slate-400">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-4">
        {Object.entries(grouped).map(([section, items]) => (
          <div key={section} className="mb-6">
            <h2 className="px-6 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {section}
            </h2>
            <ul>
              {items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-6 py-2.5 text-sm transition-colors",
                        isActive
                          ? "bg-blue-600 text-white font-semibold border-l-4 border-blue-400"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <Icon size={18} strokeWidth={2} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Sistema */}
        <div className="mb-6">
          <h2 className="px-6 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Sección de Sistema
          </h2>
          <ul>
            {SYSTEM_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-6 py-2.5 text-sm transition-colors",
                      isActive
                        ? "bg-blue-600 text-white font-semibold border-l-4 border-blue-400"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon size={18} strokeWidth={2} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Logout */}
        <div className="px-3 mt-4">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-950 hover:text-red-300 rounded-md transition-colors"
          >
            <LogOut size={18} strokeWidth={2} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}