"use client";

import { useEffect, useState } from "react";
import { Bell, Search, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUserFromCookie } from "@/lib/api";

interface User {
  id: string;
  employeeId: string;
  fullName: string;
  role: string;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = getUserFromCookie();
    if (userData) {
      setUser(userData);
    }
  }, []);

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "AD";

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      {/* buscar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar..."
            className="pl-10 bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      {/* lado derecho */}
      <div className="flex items-center gap-4">
        {/* notificaciones */}
        <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* ayuda */}
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <HelpCircle className="w-5 h-5 text-gray-600" />
        </button>

        {/* perfil de usuairo */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              {user?.fullName || "Cargando..."}
            </p>
            <p className="text-xs text-gray-500">
              {user?.role === "admin" ? "Administrador" : user?.role || ""}
            </p>
          </div>
          <Avatar className="w-10 h-10 border-2 border-gray-200">
            <AvatarFallback className="bg-blue-600 text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}