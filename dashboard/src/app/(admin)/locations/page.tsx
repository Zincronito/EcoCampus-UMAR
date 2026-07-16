"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Loader2,
  MapPin,
  PowerOff,
  Power,
  AlertTriangle,
  Search,
  Building2,
  Navigation
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

import { locationsAPI, campusAPI } from "@/lib/api";
import type { Location, Campus } from "@/types";

type FilterType = "all" | "active" | "inactive";

// Paleta ampliada de colores vibrantes
const CAMPUS_COLORS = [
  "#0ea5e9", // Sky blue
  "#10b981", // Emerald
  "#8b5cf6", // Violet
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#06b6d4", // Cyan
  "#d946ef", // Fuchsia
  "#84cc16", // Lime
];

// Función mejorada: Asigna el color basado en la posición real del campus en tu base de datos
const getColorForCampus = (campusId: string | undefined, campuses: Campus[]) => {
  if (!campusId || campuses.length === 0) return "#94a3b8"; // Gris por defecto
  
  // Buscamos en qué posición de la lista está este campus
  const campusIndex = campuses.findIndex(c => c.id === campusId);
  
  if (campusIndex === -1) return "#94a3b8";
  
  // Le asignamos su color basado en su posición
  return CAMPUS_COLORS[campusIndex % CAMPUS_COLORS.length];
};

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [campusFilter, setCampusFilter] = useState<string>("all");
  const [locationToToggle, setLocationToToggle] = useState<Location | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [locationsData, campusData] = await Promise.all([
        locationsAPI.getAll(false),
        campusAPI.getAll(),
      ]);
      setLocations(locationsData);
      setCampuses(campusData);
    } catch (error: any) {
      toast.error("Error al cargar los datos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!locationToToggle) return;
    const isActivating = !locationToToggle.is_active;
    try {
      setToggling(true);
      if (isActivating) {
        await locationsAPI.update(locationToToggle.id, { is_active: true });
        toast.success(`Ubicación "${locationToToggle.name}" reactivada con éxito`);
      } else {
        await locationsAPI.delete(locationToToggle.id);
        toast.success(`Ubicación "${locationToToggle.name}" desactivada`);
      }
      setLocationToToggle(null);
      await loadData();
    } catch (error: any) {
      toast.error(isActivating ? "Error al reactivar" : "Error al desactivar");
      console.error(error);
    } finally {
      setToggling(false);
    }
  };

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loc.sector || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filter === "all" ||
      (filter === "active" && loc.is_active) ||
      (filter === "inactive" && !loc.is_active);
    const matchesCampus = campusFilter === "all" || loc.campus_id === campusFilter;

    return matchesSearch && matchesStatus && matchesCampus;
  });

  const activeCount = locations.filter((l) => l.is_active).length;
  const inactiveCount = locations.filter((l) => !l.is_active).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      
      {/* HEADER COMPACTO Y MODERNO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-5 mb-6">
        <div className="space-y-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 px-3 py-1 font-bold tracking-wide uppercase">
            Mapa Operativo
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Gestión de Ubicaciones
          </h1>
          <p className="text-slate-500 font-medium text-base max-w-xl">
            Administra los sectores, áreas y puntos específicos de recolección dentro de cada campus.
          </p>
        </div>
        
        <Link href="/locations/new">
          <Button className="h-12 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95">
            <Plus className="w-5 h-5 mr-2" strokeWidth={3} />
            Nueva Ubicación
          </Button>
        </Link>
      </div>

      {/* BLOQUE DE FILTROS */}
      <div className="flex flex-col gap-4 mb-10">
        <div className="bg-white p-2 rounded-full shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Busca por nombre de área o sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-6 rounded-full border-none bg-transparent shadow-none focus-visible:ring-0 text-lg font-medium text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto p-1 overflow-x-auto">
            <Button onClick={() => setFilter("all")} className={cn("rounded-full px-6 py-6 font-bold transition-colors", filter === "all" ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-transparent text-slate-500 hover:bg-slate-100")}>
              Todas ({locations.length})
            </Button>
            <Button onClick={() => setFilter("active")} className={cn("rounded-full px-6 py-6 font-bold transition-colors", filter === "active" ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-transparent text-slate-500 hover:bg-slate-100")}>
              Activas ({activeCount})
            </Button>
            <Button onClick={() => setFilter("inactive")} className={cn("rounded-full px-6 py-6 font-bold transition-colors", filter === "inactive" ? "bg-rose-500 text-white hover:bg-rose-600" : "bg-transparent text-slate-500 hover:bg-slate-100")}>
              Inactivas ({inactiveCount})
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-2">
          <Select value={campusFilter} onValueChange={setCampusFilter}>
            <SelectTrigger className="w-full sm:w-[260px] rounded-2xl bg-white border-slate-200 h-12 font-medium text-slate-700 shadow-sm">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <SelectValue placeholder="Filtrar mapa por campus" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">Todos los campus</SelectItem>
              {campuses.map((campus) => (
                <SelectItem key={campus.id} value={campus.id}>{campus.name} ({campus.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ESTADOS DE CARGA Y VACÍOS */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
          <p className="text-slate-500 font-bold text-lg">Cargando ubicaciones...</p>
        </div>
      )}

      {!loading && filteredLocations.length === 0 && locations.length > 0 && (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center max-w-2xl mx-auto mt-12">
          <div className="bg-slate-50 p-6 rounded-full mb-6">
            <Search className="w-12 h-12 text-slate-300" strokeWidth={3} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Sin coincidencias</h3>
          <p className="text-slate-500 font-medium">No encontramos áreas con los filtros actuales.</p>
        </div>
      )}

      {!loading && locations.length === 0 && (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center max-w-2xl mx-auto mt-12">
          <div className="bg-slate-50 p-6 rounded-full mb-6">
            <MapPin className="w-12 h-12 text-slate-300" strokeWidth={3} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Mapa en blanco</h3>
          <p className="text-slate-500 font-medium mb-8">No hay ubicaciones registradas en la base de datos.</p>
          <Link href="/locations/new">
            <Button className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold">
              <Plus className="w-5 h-5 mr-2" strokeWidth={3} />
              Trazar primera ubicación
            </Button>
          </Link>
        </div>
      )}

      {/* GRID MÁGICO DE UBICACIONES */}
      {!loading && filteredLocations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredLocations.map((location) => {
            // AHORA PASAMOS EL ARRAY DE CAMPUS TAMBIÉN
            const themeColor = getColorForCampus(location.campus_id, campuses);

            return (
              <div
                key={location.id}
                className={cn(
                  "group relative bg-white rounded-3xl p-8 border transition-all duration-300 overflow-hidden",
                  location.is_active
                    ? "border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1"
                    : "border-dashed border-slate-200 bg-slate-50/50 grayscale-[50%] hover:grayscale-0"
                )}
              >
                {/* DETALLE PERRÍSIMO: Aura y línea de color por Campus */}
                <div 
                  className="absolute top-0 left-0 w-full h-2 transition-all duration-300 group-hover:h-3"
                  style={{ backgroundColor: themeColor }} 
                />
                <div 
                  className="absolute top-0 left-0 w-full h-32 opacity-10 blur-3xl pointer-events-none"
                  style={{ backgroundColor: themeColor }} 
                />

                {!location.is_active && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-rose-500 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-md shadow-rose-500/20">
                      INACTIVA
                    </span>
                  </div>
                )}

                {/* Cabecera de la Tarjeta */}
                <div className="flex justify-between items-start mb-6 pt-2">
                  <div className="flex gap-4 items-center">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm relative z-10"
                      style={{ backgroundColor: `${themeColor}15` }}
                    >
                      <MapPin className="w-7 h-7" style={{ color: themeColor }} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 pr-4">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-0.5 flex items-center gap-1">
                        <Navigation className="w-3 h-3" /> Sector
                      </p>
                      <h4 className="font-bold text-slate-700 truncate" style={{ color: themeColor }}>
                        {location.sector || "Sin sector"}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Cuerpo de la Tarjeta */}
                <div className="mb-6 relative z-10">
                  <h3 className="text-2xl font-black text-slate-900 mb-2 truncate" title={location.name}>
                    {location.name}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium line-clamp-2 min-h-[2.5rem]">
                    {location.description || "Ninguna descripción registrada para este punto."}
                  </p>
                </div>

                {/* Footer de la Tarjeta (Métricas y Campus) */}
                <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 leading-none">Campus</span>
                      <span className="text-sm font-bold text-slate-800 leading-tight">
                        {location.campus?.name || "Sin asignar"}
                      </span>
                    </div>
                  </div>
                  
                  {location.location_type && (
                    <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 font-bold px-3 py-1">
                      {location.location_type}
                    </Badge>
                  )}
                </div>

                {/* BOTONES FLOTANTES AL HOVER */}
                <div className="absolute top-6 right-6 flex gap-1.5 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all z-20">
                  <Link href={`/locations/${location.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white shadow-md shadow-slate-200/50 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-100">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLocationToToggle(location)}
                    className={cn(
                      "h-10 w-10 rounded-full bg-white shadow-md shadow-slate-200/50 border border-slate-100",
                      location.is_active ? "text-slate-600 hover:text-rose-600 hover:bg-rose-50" : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                    )}
                  >
                    {location.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Tarjeta para Agregar Nueva Ubicación */}
          {filter !== "inactive" && (
            <Link href="/locations/new" className="block h-full group">
              <div className="h-full min-h-[300px] border-2 border-dashed border-slate-200 hover:border-blue-400 bg-transparent hover:bg-blue-50/50 transition-colors rounded-3xl flex flex-col items-center justify-center p-8 text-center cursor-pointer">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-blue-600 transition-all">
                  <Plus className="w-10 h-10 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-black text-slate-700 group-hover:text-blue-700">Trazar Ubicación</h3>
                <p className="text-base text-slate-500 font-medium mt-2">Agrega un nuevo punto de recolección</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      <AlertDialog open={!!locationToToggle} onOpenChange={() => setLocationToToggle(null)}>
        <AlertDialogContent className="rounded-3xl p-8 border-0 shadow-2xl max-w-md">
          <AlertDialogHeader className="mb-4">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-4",
              locationToToggle?.is_active ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
            )}>
              {locationToToggle?.is_active ? <AlertTriangle className="w-6 h-6" /> : <Power className="w-6 h-6" />}
            </div>
            <AlertDialogTitle className="text-2xl font-black text-slate-900">
              {locationToToggle?.is_active ? "¿Desactivar ubicación?" : "Reactivar ubicación"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-slate-600 font-medium pt-2">
              {locationToToggle?.is_active ? (
                <>
                  La ubicación <strong className="text-slate-900">"{locationToToggle?.name}"</strong> dejará de estar disponible operativamente, pero los contenedores y el historial de recolección en esta zona se mantendrán protegidos en la base de datos.
                </>
              ) : (
                <>
                  La ubicación <strong className="text-slate-900">"{locationToToggle?.name}"</strong> volverá a estar disponible para asignar contenedores y trazar rutas.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-0 mt-6">
            <AlertDialogCancel disabled={toggling} className="rounded-full px-6 font-bold border-slate-200 hover:bg-slate-50">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
              disabled={toggling}
              className={cn(
                "rounded-full px-8 font-bold text-white shadow-md",
                locationToToggle?.is_active ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {toggling ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
              ) : locationToToggle?.is_active ? (
                "Desactivar"
              ) : (
                "Reactivar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}