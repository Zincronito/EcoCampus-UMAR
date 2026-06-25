"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Scale, AlertTriangle, BarChart3 } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel Principal</h1>
        <p className="text-gray-600 mt-1">
          Vista general del sistema de gestión de residuos
        </p>
      </div>

      {/* Métricas (placeholder) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Generación Total Diaria
            </CardTitle>
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              -- <span className="text-sm font-normal text-gray-500">kg</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Peso Neto Orgánico
            </CardTitle>
            <Scale className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              -- <span className="text-sm font-normal text-gray-500">kg</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Peso Neto Inorgánico
            </CardTitle>
            <Scale className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              -- <span className="text-sm font-normal text-gray-500">kg</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">
              Contenedores/Tapas Rotos
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              -- <span className="text-sm font-normal text-amber-700">reportes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder para gráficas futuras */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis Principal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center">
              <Trash2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Las gráficas se mostrarán aquí</p>
              <p className="text-xs mt-1">(En construcción)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}