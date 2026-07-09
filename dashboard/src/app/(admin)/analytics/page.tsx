"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  TrendingUp,
  BarChart3,
  Target,
  AlertCircle,
  Filter,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { campusAPI, locationsAPI, categoriesAPI } from "@/lib/api";
import type { Campus, WasteCategory, Location } from "@/types";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<WasteCategory[]>([]);

  // Filtros
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [campusFilter, setCampusFilter] = useState<string>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, campusesData, locationsData, categoriesData] =
        await Promise.all([
          api.get("/records/analytics"),
          campusAPI.getAll(),
          locationsAPI.getAll(false),
          categoriesAPI.getAll(false),
        ]);

      setAnalytics(analyticsData.data);
      setCampuses(campusesData);
      setLocations(locationsData);
      setCategories(categoriesData);
    } catch (error: any) {
      toast.error("Error al cargar analytics");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterApply = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (campusFilter !== "all") params.append("campus_id", campusFilter);
      if (sectorFilter !== "all") params.append("sector", sectorFilter);
      if (categoryFilter !== "all")
        params.append("category_id", categoryFilter);

      const response = await api.get(
        `/records/analytics?${params.toString()}`
      );
      setAnalytics(response.data);
      toast.success("Filtros aplicados");
    } catch (error: any) {
      toast.error("Error al aplicar filtros");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = async () => {
    setDateFrom("");
    setDateTo("");
    setCampusFilter("all");
    setSectorFilter("all");
    setCategoryFilter("all");
    await loadData();
  };

  // Sectores únicos
  const sectors = Array.from(
    new Set(locations.map((l) => l.sector).filter(Boolean))
  ) as string[];

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#6366f1",
  ];

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Cargando analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Análisis y Métricas
          </h1>
          <p className="text-gray-600 mt-1">
            KPIs y visualización de tendencias en la recolección de residuos.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Desde
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Hasta
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Campus
              </label>
              <Select value={campusFilter} onValueChange={setCampusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {campuses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Sector
              </label>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {sectors.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Categoría
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleFilterApply}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              Aplicar filtros
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              <X className="w-4 h-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tarjetas de Resumen */}
      {analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Residuos Acumulados
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {analytics.summary.total_weight.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">kg</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Tasa Promedio
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {analytics.summary.average_generation_rate.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">kg/día</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Tarjeta 5: Tasa Semanal */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Tasa Semanal (L-V)
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {analytics.summary.weekly_generation_rate.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">kg/semana</p>
                  </div>
                  <div className="p-3 bg-cyan-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-cyan-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total de Registros
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {analytics.summary.total_records}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">eventos</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Separación Correcta
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {analytics.summary.correct_separation_percentage.toFixed(
                        1
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">%</p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfica 1: Tendencia temporal */}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Tendencia de Generación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.generation.temporal}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      label={{ value: "Fecha", position: "insideBottom", offset: -5 }}
                    />
                    <YAxis
                      label={{ value: "Peso (kg)", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip />
                    {/* <Legend /> */}
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#3b82f6"
                      dot={{ fill: "#3b82f6", r: 5 }}
                      name="Peso (kg)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfica 2: Distribución por categoría */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Distribución por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.generation.by_category}
                      dataKey="weight"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry: any) =>
                        `${entry.name}: ${entry.percentage}%`
                      }
                    >
                      {analytics.generation.by_category.map(
                        (entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfica 3: Generación por sector */}
            {/* Gráfica 3: Generación por Sector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Generación por Sector
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={analytics.generation.by_sector}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="sector" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="weight" fill="#10b981" name="Peso (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfica 4: Distribución de Separación */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Distribución de Separación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(analytics.separation.by_level).map(
                      ([level, data]: [string, any]) => ({
                        level: data.name,
                        count: data.count,
                      })
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="level" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" name="Eventos" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </div>
        </>
      )}
    </div>
  );
}