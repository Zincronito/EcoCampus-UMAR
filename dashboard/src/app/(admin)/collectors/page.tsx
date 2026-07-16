"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Loader2,
  Users,
  PowerOff,
  Power,
  AlertTriangle,
  Search,
  Building2,
  Sun,
  Moon,
  Sunset,
  Mail,
  Phone,
  MapPin,
  Clock
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

import { collectorsAPI, campusAPI } from "@/lib/api";
import type { Collector, Campus } from "@/types";

type FilterType = "all" | "active" | "inactive";

const SHIFT_LABELS: Record<string, { label: string; icon: any; colorText: string; hex: string }> = {
  morning: { label: "Mañana", icon: Sun, colorText: "text-amber-600", hex: "#f59e0b" },
  afternoon: { label: "Tarde", icon: Sunset, colorText: "text-orange-600", hex: "#f97316" },
  night: { label: "Noche", icon: Moon, colorText: "text-indigo-600", hex: "#6366f1" },
};

export default function CollectorsPage() {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [campusFilter, setCampusFilter] = useState<string>("all");
  const [shiftFilter, setShiftFilter] = useState<string>("all");
  const [collectorToToggle, setCollectorToToggle] = useState<Collector | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [collectorsData, campusData] = await Promise.all([
        collectorsAPI.getAll(false),
        campusAPI.getAll(),
      ]);
      setCollectors(collectorsData);
      setCampuses(campusData);
    } catch (error: any) {
      toast.error("Error al cargar los datos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!collectorToToggle) return;

    const isActivating = !collectorToToggle.is_active;

    try {
      setToggling(true);

      if (isActivating) {
        await collectorsAPI.update(collectorToToggle.id, { is_active: true });
        toast.success(`Recolector "${collectorToToggle.full_name}" reactivado`);
      } else {
        await collectorsAPI.delete(collectorToToggle.id);
        toast.success(`Recolector "${collectorToToggle.full_name}" desactivado`);
      }

      setCollectorToToggle(null);
      await loadData();
    } catch (error: any) {
      toast.error("Error al cambiar el estado del recolector");
      console.error(error);
    } finally {
      setToggling(false);
    }
  };

  const getCampusCodeFromId = (employeeId: string): string => {
    const parts = employeeId.split("-");
    return parts.length >= 2 ? parts[1] : "";
  };

  const filteredCollectors = collectors.filter((c) => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filter === "all" ||
      (filter === "active" && c.is_active) ||
      (filter === "inactive" && !c.is_active);

    const matchesCampus = (() => {
      if (campusFilter === "all") return true;
      const campusCode = getCampusCodeFromId(c.employee_id);
      const campus = campuses.find((cm) => cm.id === campusFilter);
      return campus?.code === campusCode;
    })();

    const matchesShift =
      shiftFilter === "all" || (c.shift || "") === shiftFilter;

    return matchesSearch && matchesStatus && matchesCampus && matchesShift;
  });

  const getInitials = (fullName: string): string => {
    return fullName
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const activeCount = collectors.filter((c) => c.is_active).length;
  const inactiveCount = collectors.filter((c) => !c.is_active).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      
      {/* HEADER COMPACTO Y MODERNO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-5 mb-6">
        <div className="space-y-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 px-3 py-1 font-bold tracking-wide uppercase">
            Personal Operativo
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Gestión de Recolectores
          </h1>
          <p className="text-slate-500 font-medium text-base max-w-xl">
            Administra al personal en campo encargado de la recolección de residuos.
          </p>
        </div>
        
        <Link href="/collectors/new">
          <Button className="h-12 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95">
            <Plus className="w-5 h-5 mr-2" strokeWidth={3} />
            Nuevo Recolector
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
              placeholder="Busca por nombre, ID o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-6 rounded-full border-none bg-transparent shadow-none focus-visible:ring-0 text-lg font-medium text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto p-1 overflow-x-auto">
            <Button onClick={() => setFilter("all")} className={cn("rounded-full px-6 py-6 font-bold transition-colors", filter === "all" ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-transparent text-slate-500 hover:bg-slate-100")}>
              Todos ({collectors.length})
            </Button>
            <Button onClick={() => setFilter("active")} className={cn("rounded-full px-6 py-6 font-bold transition-colors", filter === "active" ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-transparent text-slate-500 hover:bg-slate-100")}>
              Activos ({activeCount})
            </Button>
            <Button onClick={() => setFilter("inactive")} className={cn("rounded-full px-6 py-6 font-bold transition-colors", filter === "inactive" ? "bg-rose-500 text-white hover:bg-rose-600" : "bg-transparent text-slate-500 hover:bg-slate-100")}>
              Inactivos ({inactiveCount})
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-2">
          <Select value={campusFilter} onValueChange={setCampusFilter}>
            <SelectTrigger className="w-full sm:w-[240px] rounded-2xl bg-white border-slate-200 h-12 font-medium text-slate-700 shadow-sm">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <SelectValue placeholder="Filtrar por campus" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">Todos los campus</SelectItem>
              {campuses.map((campus) => (
                <SelectItem key={campus.id} value={campus.id}>{campus.name} ({campus.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={shiftFilter} onValueChange={setShiftFilter}>
            <SelectTrigger className="w-full sm:w-[240px] rounded-2xl bg-white border-slate-200 h-12 font-medium text-slate-700 shadow-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <SelectValue placeholder="Filtrar por turno" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">Todos los turnos</SelectItem>
              <SelectItem value="morning">Mañana</SelectItem>
              <SelectItem value="afternoon">Tarde</SelectItem>
              <SelectItem value="night">Noche</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ESTADOS DE CARGA Y VACÍOS */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
          <p className="text-slate-500 font-bold text-lg">Cargando recolectores...</p>
        </div>
      )}

      {!loading && filteredCollectors.length === 0 && collectors.length > 0 && (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center max-w-2xl mx-auto mt-12">
          <div className="bg-slate-50 p-6 rounded-full mb-6">
            <Search className="w-12 h-12 text-slate-300" strokeWidth={3} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Sin coincidencias</h3>
          <p className="text-slate-500 font-medium">No encontramos personal con los filtros actuales.</p>
        </div>
      )}

      {!loading && collectors.length === 0 && (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center max-w-2xl mx-auto mt-12">
          <div className="bg-slate-50 p-6 rounded-full mb-6">
            <Users className="w-12 h-12 text-slate-300" strokeWidth={3} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Plantilla vacía</h3>
          <p className="text-slate-500 font-medium mb-8">No hay recolectores registrados en el sistema actualmente.</p>
          <Link href="/collectors/new">
            <Button className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold">
              <Plus className="w-5 h-5 mr-2" strokeWidth={3} />
              Registrar el primero
            </Button>
          </Link>
        </div>
      )}

      {/* GRID MÁGICO DE RECOLECTORES */}
      {!loading && filteredCollectors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCollectors.map((collector) => {
            const shiftInfo = collector.shift ? SHIFT_LABELS[collector.shift] : null;
            const ShiftIcon = shiftInfo?.icon;
            const campusCode = getCampusCodeFromId(collector.employee_id);
            const campus = campuses.find((c) => c.code === campusCode);
            
            // Si tiene turno usa su color, si no, usa un slate (gris azulado)
            const cardThemeColor = shiftInfo?.hex || "#94a3b8"; 

            return (
              <div
                key={collector.id}
                className={cn(
                  "group relative bg-white rounded-3xl p-8 border transition-all duration-300 overflow-hidden",
                  collector.is_active
                    ? "border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1"
                    : "border-dashed border-slate-200 bg-slate-50/50 grayscale-[50%] hover:grayscale-0"
                )}
              >
                {/* DETALLE PERRÍSIMO: Aura y línea de color por turno */}
                <div 
                  className="absolute top-0 left-0 w-full h-2 transition-all duration-300 group-hover:h-3"
                  style={{ backgroundColor: cardThemeColor }} 
                />
                <div 
                  className="absolute top-0 left-0 w-full h-32 opacity-10 blur-3xl pointer-events-none"
                  style={{ backgroundColor: cardThemeColor }} 
                />

                {!collector.is_active && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-rose-500 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-md shadow-rose-500/20">
                      INACTIVO
                    </span>
                  </div>
                )}

                {/* Cabecera (Avatar + Nombre + ID) */}
                <div className="flex justify-between items-start mb-6 pt-2">
                  <div className="flex gap-4 items-center">
                    <Avatar className="w-16 h-16 border-2 shadow-sm" style={{ borderColor: `${cardThemeColor}40` }}>
                      <AvatarFallback className="text-white font-bold text-xl" style={{ backgroundColor: cardThemeColor }}>
                        {getInitials(collector.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight truncate pb-0.5">
                        {collector.full_name}
                      </h3>
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-0.5 rounded-md text-xs font-bold text-slate-600 font-mono mt-1">
                        ID: {collector.employee_id}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info de contacto */}
                <div className="space-y-2.5 mb-6 relative z-10">
                  {collector.email && (
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                        <Mail className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="truncate">{collector.email}</span>
                    </div>
                  )}
                  {collector.phone && (
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                        <Phone className="w-4 h-4 text-slate-400" />
                      </div>
                      <span>{collector.phone}</span>
                    </div>
                  )}
                  {!collector.email && !collector.phone && (
                    <div className="h-8 flex items-center text-sm italic text-slate-400">
                      Sin datos de contacto
                    </div>
                  )}
                </div>

                {/* Footer (Asignación y Turno) */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Asignación
                    </p>
                    <span className="text-sm font-bold text-slate-800 truncate block">
                      {campus?.name || campusCode}
                    </span>
                    {collector.assigned_sector && (
                      <span className="text-xs font-medium text-slate-500 truncate block mt-0.5">
                        {collector.assigned_sector}
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Turno
                    </p>
                    {shiftInfo && ShiftIcon ? (
                      <div className="flex items-center gap-2">
                        <ShiftIcon className="w-4 h-4" style={{ color: cardThemeColor }} />
                        <span className="text-sm font-bold text-slate-800">{shiftInfo.label}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-slate-800">No asignado</span>
                    )}
                  </div>
                </div>

                {/* BOTONES FLOTANTES AL HOVER */}
                <div className="absolute top-6 right-6 flex gap-1.5 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all z-20">
                  <Link href={`/collectors/${collector.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white shadow-md shadow-slate-200/50 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-100">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollectorToToggle(collector)}
                    className={cn(
                      "h-10 w-10 rounded-full bg-white shadow-md shadow-slate-200/50 border border-slate-100",
                      collector.is_active ? "text-slate-600 hover:text-rose-600 hover:bg-rose-50" : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                    )}
                  >
                    {collector.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Tarjeta para Agregar Nuevo Recolector */}
          {filter !== "inactive" && (
            <Link href="/collectors/new" className="block h-full group">
              <div className="h-full min-h-[340px] border-2 border-dashed border-slate-200 hover:border-blue-400 bg-transparent hover:bg-blue-50/50 transition-colors rounded-3xl flex flex-col items-center justify-center p-8 text-center cursor-pointer">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-blue-600 transition-all">
                  <Plus className="w-10 h-10 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-black text-slate-700 group-hover:text-blue-700">Nuevo Recolector</h3>
                <p className="text-base text-slate-500 font-medium mt-2">Dar de alta a un operador en el sistema</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      <AlertDialog open={!!collectorToToggle} onOpenChange={() => setCollectorToToggle(null)}>
        <AlertDialogContent className="rounded-3xl p-8 border-0 shadow-2xl max-w-md">
          <AlertDialogHeader className="mb-4">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-4",
              collectorToToggle?.is_active ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
            )}>
              {collectorToToggle?.is_active ? <AlertTriangle className="w-6 h-6" /> : <Power className="w-6 h-6" />}
            </div>
            <AlertDialogTitle className="text-2xl font-black text-slate-900">
              {collectorToToggle?.is_active ? "¿Desactivar recolector?" : "Reactivar recolector"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-slate-600 font-medium pt-2">
              {collectorToToggle?.is_active ? (
                <>
                  El recolector <strong className="text-slate-900">{collectorToToggle?.full_name}</strong> ya no tendrá acceso a la aplicación móvil. Su historial operativo se mantendrá intacto.
                </>
              ) : (
                <>
                  El recolector <strong className="text-slate-900">{collectorToToggle?.full_name}</strong> recuperará su acceso a la aplicación móvil y podrá reanudar sus operaciones.
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
                collectorToToggle?.is_active ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {toggling ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
              ) : collectorToToggle?.is_active ? (
                "Desactivar Acceso"
              ) : (
                "Reactivar Acceso"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}