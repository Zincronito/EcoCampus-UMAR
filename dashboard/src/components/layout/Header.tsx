"use client";

import { useEffect, useState } from "react";
import { Bell, Search, HelpCircle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUserFromCookie } from "@/lib/api";
import { useNotifications } from "@/hooks/useNotifications";
import {useRouter} from "next/navigation";

interface User {
  id: string;
  employeeId: string;
  fullName: string;
  role: string;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const handleNotificationClick = async (notif: any) => {
    // Marcar como leída si no lo está
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }

    // Cerrar panel de notificaciones
    setShowNotifications(false);

    // Redirigir al reporte si tiene collection_record_id
    if (notif.collection_record_id) {
      router.push(`/reports?highlight=${notif.collection_record_id}`);
    }
  };

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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

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
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Panel de notificaciones */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No hay notificaciones
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !notif.is_read ? getSeverityColor(notif.severity) : ""
                      }`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityBadgeColor(notif.severity)}`}></div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{notif.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notif.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        {!notif.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ayuda */}
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <HelpCircle className="w-5 h-5 text-gray-600" />
        </button>

        {/* perfil de usuario */}
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