"use client";

import { Settings, Construction } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Configuración
          </h1>
          <p className="text-gray-600 mt-1">
            Ajustes generales del sistema.
          </p>
        </div>
      </div>

      {/* Empty / Coming Soon State */}
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
            <Construction className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Sección en construcción
          </h3>
          <p className="text-gray-600 mb-6">
            Esta sección estará disponible próximamente
          </p>
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 w-full">
            <p className="font-medium text-gray-700 mb-2">Funcionalidades planeadas:</p>
            <ul className="text-left space-y-1">
              <li>• Cambiar PIN de acceso</li>
              <li>• Configuración de notificaciones</li>
              <li>• Preferencias de la aplicación</li>
              <li>• Gestión de campus y sectores</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}