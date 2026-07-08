"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  Filter,
  X,
  FileText,
  AlertCircle,
  Download,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import {
  reportsAPI,
  collectorsAPI,
  campusAPI,
  categoriesAPI,
  locationsAPI,
} from "@/lib/api";
import type { Campus, WasteCategory, Location, Collector } from "@/types";

interface Report {
  id: string;
  gross_weight: number | null;
  net_weight: number | null;
  is_weight_estimated: boolean;
  fill_level: string;
  physical_state: string;
  condition: string;
  separation_level: string;
  created_at: string;
  container: {
    id: string;
    container_code: string;
    volume_liters: number;
    tare_weight: number;
  };
  category: {
    id: string;
    name: string;
    color: string;
  };
  location: {
    name: string;
    sector: string;
    campus: string;
  };
  incident: {
    id: string;
    description: string;
    quick_tag: string;
    status: string;
  } | null;
  collector: {
    id: string;
    employee_id: string;
    full_name: string;
  };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [collectorFilter, setCollectorFilter] = useState<string>("all");
  const [campusFilter, setCampusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [incidentFilter, setIncidentFilter] = useState<string>("all");
  const [filterWeightType, setFilterWeightType] = useState<"all" | "real" | "estimated">("all");

  // Modal
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsData, collectorsData, campusesData, categoriesData, locationsData] =
        await Promise.all([
          reportsAPI.getReports(),
          collectorsAPI.getAll(false),
          campusAPI.getAll(),
          categoriesAPI.getAll(false),
          locationsAPI.getAll(false),
        ]);
      setReports(reportsData);
      setCollectors(collectorsData);
      setCampuses(campusesData);
      setCategories(categoriesData);
      setLocations(locationsData);
    } catch (error: any) {
      toast.error("Error al cargar los reportes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterApply = async () => {
    try {
      setLoading(true);
      const filters: any = {};

      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;
      if (collectorFilter !== "all") filters.collector_id = collectorFilter;
      if (campusFilter !== "all") filters.campus_id = campusFilter;
      if (categoryFilter !== "all") filters.category_id = categoryFilter;
      if (locationFilter !== "all") filters.location_id = locationFilter;
      if (incidentFilter === "with") filters.has_incident = true;
      if (incidentFilter === "without") filters.has_incident = false;


      const data = await reportsAPI.getReports(filters);
      setReports(data);
      toast.success("Filtros aplicados");
    } catch (error: any) {
      toast.error("Error al aplicar filtros");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = async () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setCollectorFilter("all");
    setCampusFilter("all");
    setCategoryFilter("all");
    setLocationFilter("all");
    setIncidentFilter("all");
    await loadData();
  };

  // Filtrado en cliente (búsqueda)
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.container.container_code
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      report.collector.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.category?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    // Filtro por tipo de peso
    let matchesWeightType = true;
    if (filterWeightType === "real") {
      matchesWeightType = !report.is_weight_estimated;
    } else if (filterWeightType === "estimated") {
      matchesWeightType = report.is_weight_estimated;
    }

    return matchesSearch && matchesWeightType;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFillLevelBadge = (level: string) => {
    const levels: Record<string, string> = {
      empty: "Vacío",
      quarter: "25%",
      half: "50%",
      three_quarter: "75%",
      full: ">75%",
      overflow: "Desbordado",
    };
    return levels[level] || level;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes de Recolección</h1>
          <p className="text-gray-600 mt-1">
            Visualiza y analiza los reportes generados por los recolectores.
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">{reports.length}</div>
          <p className="text-gray-600 text-sm">Reportes totales</p>
        </div>
      </div>

      {/* Búsqueda y Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por contenedor, recolector o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Grid de filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Fecha desde */}
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

            {/* Fecha hasta */}
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

            {/* Recolector */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Recolector
              </label>
              <Select value={collectorFilter} onValueChange={setCollectorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {collectors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campus */}
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

            {/* Categoría */}
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

            {/* Ubicación */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Ubicación
              </label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Tipo de Peso */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Tipo de Peso
              </label>
              <select
                value={filterWeightType}
                onChange={(e) => setFilterWeightType(e.target.value as "all" | "real" | "estimated")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="real">Solo Pesos Reales</option>
                <option value="estimated">Solo Pesos Estimados</option>
              </select>
            </div>

            {/* Incidencia */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Incidencia
              </label>
              <Select value={incidentFilter} onValueChange={setIncidentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="with">Con incidencia</SelectItem>
                  <SelectItem value="without">Sin incidencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botones de acción */}
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

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Cargando reportes...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredReports.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">
              No se encontraron reportes con los filtros actuales
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabla de reportes */}
      {!loading && filteredReports.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Contenedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Recolector
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Peso (kg)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Llenado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Incidencia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">
                          {report.container.container_code}
                        </span>
                        <div className="text-xs text-gray-500">
                          {report.location.sector}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {report.collector.full_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          style={{
                            backgroundColor: `${report.category.color}20`,
                            color: report.category.color,
                            border: `1px solid ${report.category.color}`,
                          }}
                        >
                          {report.category.name}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {report.net_weight?.toFixed(2) || "—"} kg
                          </span>
                          {report.is_weight_estimated && (
                            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded font-medium">
                              Estimado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getFillLevelBadge(report.fill_level)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {formatDate(report.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {report.incident ? (
                          <Badge variant="destructive" className="flex w-fit gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {report.incident.quick_tag}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-500">Sin incidencia</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de detalles */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Reporte</DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Contenedor */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Contenedor</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Código</p>
                    <p className="font-medium">
                      {selectedReport.container.container_code}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ubicación</p>
                    <p className="font-medium">{selectedReport.location.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sector</p>
                    <p className="font-medium">{selectedReport.location.sector}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Campus</p>
                    <p className="font-medium">{selectedReport.location.campus}</p>
                  </div>
                </div>
              </div>

              {/* Recolector */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Recolector</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-medium">{selectedReport.collector.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ID Empleado</p>
                    <p className="font-medium">{selectedReport.collector.employee_id}</p>
                  </div>
                </div>
              </div>

              {/* Datos del reporte */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Mediciones</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Peso Bruto</p>
                    <p className="font-medium">
                      {selectedReport.gross_weight?.toFixed(2) || "—"} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Peso Neto</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-medium">
                        {selectedReport.net_weight?.toFixed(2) || "—"} kg
                      </p>
                      {selectedReport.is_weight_estimated && (
                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded font-medium">
                          Estimado
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nivel de Llenado</p>
                    <p className="font-medium">
                      {getFillLevelBadge(selectedReport.fill_level)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado Físico</p>
                    <p className="font-medium">{selectedReport.physical_state}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nivel de Separación</p>
                    <p className="font-medium">{selectedReport.separation_level}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha</p>
                    <p className="font-medium">{formatDate(selectedReport.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Categoría */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Categoría</h3>
                <Badge
                  style={{
                    backgroundColor: `${selectedReport.category.color}20`,
                    color: selectedReport.category.color,
                    border: `1px solid ${selectedReport.category.color}`,
                  }}
                >
                  {selectedReport.category.name}
                </Badge>
              </div>

              {/* Condiciones */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Condiciones</h3>
                <p className="text-sm text-gray-700">{selectedReport.condition}</p>
              </div>

              {/* Incidencia */}
              {selectedReport.incident && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Incidencia Reportada
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-red-700">Tag</p>
                      <Badge variant="destructive">{selectedReport.incident.quick_tag}</Badge>
                    </div>
                    <div>
                      <p className="text-red-700">Descripción</p>
                      <p className="text-gray-900">{selectedReport.incident.description}</p>
                    </div>
                    <div>
                      <p className="text-red-700">Status</p>
                      <p className="text-gray-900 capitalize">
                        {selectedReport.incident.status}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}