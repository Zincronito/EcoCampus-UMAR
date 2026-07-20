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
  CalendarDays,
  User,
  MapPin,
  Tag,
  Scale,
  PackageCheck,
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
import { Separator } from "@/components/ui/separator";
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
    photo_url: string | null;
  } | null;
  collector: {
    id: string;
    employee_id: string;
    full_name: string;
  };
}

// Mapa de niveles de llenado
const FILL_LEVEL_MAP: Record<string, { label: string; color: string }> = {
  empty: { label: "Vacío (0%)", color: "bg-slate-100 text-slate-700 border-slate-200" },
  quarter: { label: "< 25%", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  half: { label: "50%", color: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  three_quarter: { label: "75%", color: "bg-orange-50 text-orange-800 border-orange-200" },
  full: { label: "> 75%", color: "bg-red-50 text-red-800 border-red-200" },
  overflow: { label: "Desbordado", color: "bg-red-600 text-white border-red-700" },
};

// COMPONENTE EXTERNO CORREGIDO (Sin truncate, dejando que el texto respire)
const InfoBlock = ({ icon: Icon, label, value, children }: any) => (
  <div className="flex items-start gap-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 h-full">
    <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm text-blue-600 shrink-0">
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">{label}</p>
      {value && <p className="text-sm font-bold text-slate-950 leading-tight">{value}</p>}
      {children}
    </div>
  </div>
);

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingFilters, setFetchingFilters] = useState(false);
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
  const [filterWeightType, setFilterWeightType] = useState<string>("all");

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
      toast.error("Error al cargar los datos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterApply = async () => {
    try {
      setFetchingFilters(true);
      const filters: any = {};

      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;
      if (collectorFilter !== "all") filters.collector_id = collectorFilter;
      if (campusFilter !== "all") filters.campus_id = campusFilter;
      if (categoryFilter !== "all") filters.category_id = categoryFilter;
      if (locationFilter !== "all") filters.location_id = locationFilter;
      if (incidentFilter === "with") filters.has_incident = true;
      if (incidentFilter === "without") filters.has_incident = false;
      if (filterWeightType !== "all") filters.weight_type = filterWeightType;

      const data = await reportsAPI.getReports(filters);
      setReports(data);
      toast.success("Filtros aplicados correctamente");
    } catch (error: any) {
      toast.error("Error al aplicar filtros");
      console.error(error);
    } finally {
      setFetchingFilters(false);
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
    setFilterWeightType("all");
    await loadData();
    toast.success("Filtros restablecidos");
  };

  const filteredReports = reports.filter((report) => {
    return (
      report.container.container_code
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      report.collector.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.category?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
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

  const exportToCSV = () => {
    if (filteredReports.length === 0) {
      toast.error("No hay reportes para exportar");
      return;
    }

    const headers = [
      "Fecha", "Hora", "Contenedor", "Categoría", "Ubicación", "Sector", "Campus",
      "Recolector", "Peso Bruto (kg)", "Peso Neto (kg)", "Peso Estimado",
      "Nivel de Llenado", "Estado Físico", "Condiciones", "Nivel de Separación",
      "Tiene Incidencia", "Descripción Incidencia",
    ];

    const rows = filteredReports.map((r) => {
      const date = new Date(r.created_at);
      return [
        date.toLocaleDateString("es-MX"),
        date.toLocaleTimeString("es-MX"),
        r.container?.container_code || "",
        r.category?.name || "",
        r.location?.name || "",
        r.location?.sector || "",
        r.location?.campus || "",
        r.collector?.full_name || "",
        r.gross_weight ?? "",
        r.net_weight ?? "",
        r.is_weight_estimated ? "Sí" : "No",
        FILL_LEVEL_MAP[r.fill_level]?.label || r.fill_level,
        r.physical_state,
        r.condition,
        r.separation_level,
        r.incident ? "Sí" : "No",
        r.incident?.description || "",
      ];
    });

    const escapeCell = (value: any): string => {
      const str = String(value ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCell).join(","),
      ...rows.map((row) => row.map(escapeCell).join(",")),
    ].join("\n");

    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `reportes_ecocampus_${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`Exportados ${filteredReports.length} reportes a CSV`);
  };

  return (
    <div className="space-y-8 p-6 md:p-8 min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-slate-950">
            Reportes de Recolección
          </h1>
          <p className="text-slate-600 mt-1.5 text-lg max-w-2xl">
            Historial detallado y análisis de las actividades de recolección de residuos en todos los campus.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Card className="bg-white shadow-sm border-slate-100">
            <CardContent className="py-3 px-5 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-500 bg-blue-50 p-1.5 rounded-lg"/>
                <div>
                    <div className="text-3xl font-bold text-slate-950">{reports.length}</div>
                    <p className="text-slate-500 text-sm font-medium">Reportes Totales</p>
                </div>
            </CardContent>
          </Card>
          <Button
            onClick={exportToCSV}
            variant="default"
            className="gap-2.5 h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm"
            disabled={filteredReports.length === 0}
          >
            <Download className="w-5 h-5" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Panel de Filtros */}
      <Card className="border-slate-100 shadow-sm rounded-2xl bg-white">
        <CardHeader className="border-b border-slate-100/50 pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-950">
            <Filter className="w-5 h-5 text-blue-600" />
            Panel de Filtrado Avanzado
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Búsqueda rápida por código de contenedor, nombre del recolector o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-base rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-4">
            {[
              { label: "Desde", type: "date", value: dateFrom, setter: setDateFrom },
              { label: "Hasta", type: "date", value: dateTo, setter: setDateTo },
            ].map((f, i) => (
              <div key={i}>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{f.label}</label>
                <div className="relative">
                    <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                    <Input type={f.type} value={f.value} onChange={(e) => f.setter(e.target.value)} className="h-11 rounded-lg pl-10 border-slate-200" />
                </div>
              </div>
            ))}

            {[
                { label: "Recolector", value: collectorFilter, setter: setCollectorFilter, placeholder: "Todos", options: collectors.map(c => ({value: c.id, label: c.full_name})) },
                { label: "Campus", value: campusFilter, setter: setCampusFilter, placeholder: "Todos", options: campuses.map(c => ({value: c.id, label: c.name})) },
                { label: "Categoría", value: categoryFilter, setter: setCategoryFilter, placeholder: "Todas", options: categories.map(c => ({value: c.id, label: c.name})) },
                { label: "Ubicación", value: locationFilter, setter: setLocationFilter, placeholder: "Todas", options: locations.map(l => ({value: l.id, label: `${l.name} (${l.sector})`})) },
            ].map((f, i) => (
                <div key={i}>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{f.label}</label>
                    <Select value={f.value} onValueChange={f.setter}>
                        <SelectTrigger className="h-11 rounded-lg border-slate-200 text-slate-900">
                            <SelectValue placeholder={f.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {f.options.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            ))}

            <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Tipo de Peso</label>
                <Select value={filterWeightType} onValueChange={setFilterWeightType}>
                    <SelectTrigger className="h-11 rounded-lg border-slate-200 text-slate-900">
                        <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="real">Solo Reales</SelectItem>
                        <SelectItem value="estimated">Solo Estimados</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Incidencias</label>
                <Select value={incidentFilter} onValueChange={setIncidentFilter}>
                    <SelectTrigger className="h-11 rounded-lg border-slate-200 text-slate-900">
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={handleClearFilters} className="h-11 px-6 rounded-xl border-slate-200 text-slate-700 gap-2 hover:bg-slate-50">
              <X className="w-4 h-4" />
              Limpiar
            </Button>
            <Button
              onClick={handleFilterApply}
              disabled={fetchingFilters}
              className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm shadow-blue-100"
            >
              {fetchingFilters ? <Loader2 className="w-4 h-4 animate-spin"/> : <Filter className="w-4 h-4" />}
              {fetchingFilters ? "Aplicando..." : "Aplicar Filtros"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <p className="text-xl font-semibold text-slate-900">Cargando registros...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
          <FileText className="w-16 h-16 text-slate-200 mb-5" strokeWidth={1} />
          <p className="text-2xl font-bold text-slate-950">No se encontraron reportes</p>
          <Button variant="outline" onClick={handleClearFilters} className="mt-8 rounded-xl gap-2">
            <X className="w-4 h-4"/>
            Restablecer Filtros
          </Button>
        </div>
      ) : (
        <Card className="border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    {[ "Contenedor", "Recolector", "Categoría", "Peso Neto", "Llenado", "Fecha", "Incidencia", "Acciones"].map(header => (
                        <th key={header} className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider tabular-nums">
                            {header}
                        </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-950 text-base">{report.container.container_code}</div>
                        <div className="text-slate-500 font-medium flex items-center gap-1 mt-0.5 text-xs">
                            <MapPin className="w-3.5 h-3.5 text-slate-400"/>
                            {report.location.name} • {report.location.sector}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-medium">
                        {report.collector.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className="font-semibold text-xs rounded-full px-3 py-1 border"
                          style={{
                            backgroundColor: `${report.category.color}10`,
                            color: report.category.color,
                            borderColor: `${report.category.color}30`,
                          }}
                        >
                          {report.category.name}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap tabular-nums">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-slate-950">
                            {report.net_weight?.toFixed(2) || "—"} kg
                          </span>
                          {report.is_weight_estimated && (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 font-medium text-[10px] rounded-md px-1.5 py-0.5">
                              Estimado
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <Badge className={cn("font-medium text-xs rounded-md px-2.5 py-1 shadow-none border", FILL_LEVEL_MAP[report.fill_level]?.color)}>
                          {FILL_LEVEL_MAP[report.fill_level]?.label || report.fill_level}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium tabular-nums">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {report.incident ? (
                          <Badge variant="destructive" className="flex items-center w-fit gap-1.5 font-semibold rounded-md px-2.5 py-1 text-xs">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {report.incident.quick_tag}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Sin novedad</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="w-4 h-4 mr-1.5" />
                          Detalles
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

      {/* MODAL DE DETALLES: AQUÍ ESTÁ LA MAGIA (Rompiendo el candado de shadcn con sm:max-w-[900px]) */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-[900px] w-full max-h-[90vh] overflow-y-auto rounded-2xl p-6 md:p-8 bg-slate-50 border-slate-200">
          <DialogHeader className="border-b border-slate-200 pb-4 mb-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <DialogTitle className="text-2xl font-extrabold text-slate-950 flex items-center gap-3">
                <FileText className="w-7 h-7 text-blue-500 p-1 bg-blue-100 rounded-lg"/>
                Detalle del Reporte
            </DialogTitle>
             <p className="text-slate-500 text-xs tabular-nums font-mono md:text-right">ID: {selectedReport?.id}</p>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 pt-2">
              
              {/* FILA 1: Info General (Se ajusta a 2 o 4 columnas dependiendo de la pantalla sin truncar agresivamente) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <InfoBlock icon={PackageCheck} label="Contenedor" value={selectedReport.container.container_code} />
                <InfoBlock icon={User} label="Recolector" value={selectedReport.collector.full_name} />
                <InfoBlock icon={MapPin} label="Ubicación">
                    <p className="text-sm font-bold text-slate-950 mt-0.5">{selectedReport.location.name}</p>
                    <p className="text-[11px] font-medium text-slate-500 leading-tight">{selectedReport.location.sector}</p>
                </InfoBlock>
                <InfoBlock icon={CalendarDays} label="Fecha" value={formatDate(selectedReport.created_at)} />
              </div>

              {/* FILA 2: Mediciones y Categoría */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Peso Bruto */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center h-full">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Peso Bruto</p>
                      <p className="text-2xl font-extrabold text-slate-950">{selectedReport.gross_weight?.toFixed(2) || "—"} <span className="text-sm font-medium text-slate-500">kg</span></p>
                  </div>
                  
                  {/* Peso Neto (Corregido para que ESTIMADO no flote sobre el número) */}
                  <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200 shadow-sm flex flex-col justify-center h-full">
                      <div className="flex items-center justify-between mb-1">
                          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Peso Neto</p>
                          {selectedReport.is_weight_estimated && (
                              <Badge className="border-amber-300 bg-amber-100 text-amber-900 font-bold text-[9px] uppercase rounded px-1.5 py-0 shadow-none">Estimado</Badge>
                          )}
                      </div>
                      <p className="text-2xl font-extrabold text-blue-800">{selectedReport.net_weight?.toFixed(2) || "—"} <span className="text-sm font-medium text-blue-600">kg</span></p>
                  </div>

                  {/* Nivel de Llenado */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-start h-full">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Llenado</p>
                      <Badge className={cn("font-bold text-sm rounded-lg px-4 py-1.5 shadow-none border w-full text-center justify-center", FILL_LEVEL_MAP[selectedReport.fill_level]?.color)}>
                        {FILL_LEVEL_MAP[selectedReport.fill_level]?.label || selectedReport.fill_level}
                      </Badge>
                  </div>

                  {/* Categoría */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-start h-full">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5"/> Categoría</p>
                      <Badge
                        className="font-extrabold text-sm rounded-lg px-4 py-1.5 border w-full text-center justify-center"
                        style={{
                          backgroundColor: `${selectedReport.category.color}15`,
                          color: selectedReport.category.color,
                          borderColor: `${selectedReport.category.color}40`,
                        }}
                      >
                        {selectedReport.category.name}
                      </Badge>
                  </div>
              </div>

              {/* FILA 3: Estados y Observaciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-full">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estado Físico</p>
                      <p className="text-sm font-bold text-slate-950 mt-1.5 capitalize">{selectedReport.physical_state || "N/A"}</p>
                  </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-full">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Separación</p>
                      <p className="text-sm font-bold text-slate-950 mt-1.5 capitalize">{selectedReport.separation_level || "N/A"}</p>
                  </div>
                  <div className="md:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center h-full">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Condiciones y Observaciones</p>
                      <p className="text-slate-800 text-sm leading-snug">
                          {selectedReport.condition || "Sin observaciones adicionales registradas."}
                      </p>
                  </div>
              </div>

              {/* FILA 4: Incidencia */}
              {selectedReport.incident && (
                <div className="border border-red-200 rounded-xl p-4 md:p-5 bg-red-50/80 shadow-sm flex flex-col md:flex-row gap-5 items-stretch mt-2">
                  
                  {/* Textos de la Incidencia */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-6 h-6 text-red-600 bg-red-100 rounded-md p-1 shrink-0" />
                      <h3 className="font-extrabold text-red-950 text-lg leading-none">Incidencia Registrada</h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <Badge variant="destructive" className="font-bold text-xs px-2.5 py-0.5 rounded-md">{selectedReport.incident.quick_tag}</Badge>
                        <Badge className="bg-white text-slate-700 border border-slate-200 shadow-none font-bold capitalize text-xs px-2.5 py-0.5 rounded-md">
                            Estado: {selectedReport.incident.status}
                        </Badge>
                    </div>

                    <div className="bg-white p-3 md:p-4 rounded-lg border border-red-100/80 flex-1">
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1.5">Descripción del Recolector</p>
                        <p className="text-slate-900 text-sm leading-snug">
                            {selectedReport.incident.description}
                        </p>
                    </div>
                  </div>
                    
                  {/* Foto de la Incidencia */}
                  {selectedReport.incident.photo_url && (
                    <div className="w-full md:w-64 shrink-0 bg-white p-3 rounded-xl border border-red-100 flex flex-col h-full">
                      <div className="flex-1 bg-slate-100/80 rounded-lg border border-slate-200 overflow-hidden mb-3">
                          <img
                            src={selectedReport.incident.photo_url}
                            alt="Evidencia"
                            className="w-full h-32 md:h-full object-cover"
                          />
                      </div>
                      <Button variant="outline" size="sm" asChild className="h-9 w-full text-xs font-bold border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 rounded-lg shadow-sm">
                           <a href={selectedReport.incident.photo_url} target="_blank" rel="noopener noreferrer">
                              Ver Imagen Completa
                           </a>
                      </Button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}