"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Loader2,
  Trash2,
  PowerOff,
  Power,
  AlertTriangle,
  Search,
  MapPin,
  Scale,
  Box,
  QrCode,
  Building2,
  Tag
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import CategoryIcon from "@/components/shared/CategoryIcon";
import QRCodeCard from "@/components/qr/QRCodeCard";

import { containersAPI, categoriesAPI, campusAPI, locationsAPI } from "@/lib/api";
import type { Container, WasteCategory, Campus, Location } from "@/types";

type FilterType = "all" | "active" | "inactive";

export default function ContainersPage() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [campusFilter, setCampusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Toggle
  const [containerToToggle, setContainerToToggle] = useState<Container | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [containersData, categoriesData, campusesData, locationsData] = await Promise.all([
        containersAPI.getAll(false),
        categoriesAPI.getAll(false),
        campusAPI.getAll(),
        locationsAPI.getAll(false),
      ]);
      setContainers(containersData);
      setCategories(categoriesData);
      setCampuses(campusesData);
      setLocations(locationsData);
    } catch (error: any) {
      toast.error("Error al cargar los datos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!containerToToggle) return;
    const isActivating = !containerToToggle.is_active;
    try {
      setToggling(true);
      if (isActivating) {
        await containersAPI.update(containerToToggle.id, { is_active: true });
        toast.success(`Contenedor "${containerToToggle.container_code}" reactivado`);
      } else {
        await containersAPI.delete(containerToToggle.id);
        toast.success(`Contenedor "${containerToToggle.container_code}" desactivado`);
      }
      setContainerToToggle(null);
      await loadData();
    } catch (error: any) {
      toast.error(isActivating ? "Error al reactivar" : "Error al desactivar");
      console.error(error);
    } finally {
      setToggling(false);
    }
  };

  // Filtrar
  const filteredContainers = containers.filter((cont) => {
    const matchesSearch =
      cont.container_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cont.waste_category?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cont.location?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filter === "all" ||
      (filter === "active" && cont.is_active) ||
      (filter === "inactive" && !cont.is_active);
    const matchesCampus =
      campusFilter === "all" || cont.location?.campus?.id === campusFilter;
    const matchesCategory =
      categoryFilter === "all" || cont.waste_category_id === categoryFilter;

    return matchesSearch && matchesStatus && matchesCampus && matchesCategory;
  });

  const activeCount = containers.filter((c) => c.is_active).length;
  const inactiveCount = containers.filter((c) => !c.is_active).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      
      {/* HEADER COMPACTO Y MODERNO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-5 mb-6">
        <div className="space-y-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 px-3 py-1 font-bold tracking-wide uppercase">
            Inventario Físico
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Gestión de Contenedores
          </h1>
          <p className="text-slate-500 font-medium text-base max-w-xl">
            Administra los depósitos del sistema, códigos QR y asignaciones por zona.
          </p>
        </div>
        
        <Link href="/containers/new">
          <Button className="h-12 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95">
            <Plus className="w-5 h-5 mr-2" strokeWidth={3} />
            Nuevo Contenedor
          </Button>
        </Link>
      </div>

      {/* BLOQUE DE FILTROS (Píldora principal + Dropdowns secundarios) */}
      <div className="flex flex-col gap-4 mb-10">
        {/* Barra de búsqueda y Tabs de estado */}
        <div className="bg-white p-2 rounded-full shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Busca por código, categoría o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-6 rounded-full border-none bg-transparent shadow-none focus-visible:ring-0 text-lg font-medium text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto p-1 overflow-x-auto">
            <Button onClick={() => setFilter("all")} className={cn("rounded-full px-6 py-6 font-bold transition-colors", filter === "all" ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-transparent text-slate-500 hover:bg-slate-100")}>
              Todos ({containers.length})
            </Button>
            <Button onClick={() => setFilter("active")} className={cn("rounded-full px-6 py-6 font-bold transition-colors", filter === "active" ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-transparent text-slate-500 hover:bg-slate-100")}>
              Activos ({activeCount})
            </Button>
            <Button onClick={() => setFilter("inactive")} className={cn("rounded-full px-6 py-6 font-bold transition-colors", filter === "inactive" ? "bg-rose-500 text-white hover:bg-rose-600" : "bg-transparent text-slate-500 hover:bg-slate-100")}>
              Inactivos ({inactiveCount})
            </Button>
          </div>
        </div>

        {/* Dropdowns (Campus y Categoría) */}
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

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[240px] rounded-2xl bg-white border-slate-200 h-12 font-medium text-slate-700 shadow-sm">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400" />
                <SelectValue placeholder="Filtrar por categoría" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.filter((c) => c.is_active).map((category) => (
                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ESTADOS DE CARGA Y VACÍOS */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
          <p className="text-slate-500 font-bold text-lg">Cargando contenedores...</p>
        </div>
      )}

      {!loading && filteredContainers.length === 0 && containers.length > 0 && (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center max-w-2xl mx-auto mt-12">
          <div className="bg-slate-50 p-6 rounded-full mb-6">
            <Search className="w-12 h-12 text-slate-300" strokeWidth={3} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Sin coincidencias</h3>
          <p className="text-slate-500 font-medium">No encontramos contenedores con los filtros que aplicaste.</p>
        </div>
      )}

      {!loading && containers.length === 0 && (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center max-w-2xl mx-auto mt-12">
          <div className="bg-slate-50 p-6 rounded-full mb-6">
            <Trash2 className="w-12 h-12 text-slate-300" strokeWidth={3} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Inventario vacío</h3>
          <p className="text-slate-500 font-medium mb-8">No hay contenedores registrados en el sistema.</p>
          <Link href="/containers/new">
            <Button className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold">
              <Plus className="w-5 h-5 mr-2" strokeWidth={3} />
              Registrar el primero
            </Button>
          </Link>
        </div>
      )}

      {/* GRID MÁGICO DE CONTENEDORES */}
      {!loading && filteredContainers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredContainers.map((container) => {
            const categoryColor = container.waste_category?.color || "#94a3b8"; // Slate-400 fallback

            return (
              <div
                key={container.id}
                className={cn(
                  "group relative bg-white rounded-3xl p-8 border transition-all duration-300 overflow-hidden",
                  container.is_active
                    ? "border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1"
                    : "border-dashed border-slate-200 bg-slate-50/50 grayscale-[50%] hover:grayscale-0"
                )}
              >
                {/* DETALLE PERRÍSIMO: Aura y línea de color superior */}
                <div 
                  className="absolute top-0 left-0 w-full h-2 transition-all duration-300 group-hover:h-3"
                  style={{ backgroundColor: categoryColor }} 
                />
                <div 
                  className="absolute top-0 left-0 w-full h-32 opacity-10 blur-3xl pointer-events-none"
                  style={{ backgroundColor: categoryColor }} 
                />

                {/* Badge Inactivo flotante */}
                {!container.is_active && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-rose-500 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-md shadow-rose-500/20">
                      INACTIVO
                    </span>
                  </div>
                )}

                {/* Cabecera de la Tarjeta */}
                <div className="flex justify-between items-start mb-6 pt-2">
                  <div className="flex gap-4 items-center">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm relative z-10"
                      style={{ backgroundColor: `${categoryColor}15` }}
                    >
                      <CategoryIcon
                        icon={container.waste_category?.icon || null}
                        size={32}
                        color={categoryColor}
                      />
                    </div>
                    <div>
                      <h3 className="font-mono text-2xl font-black text-slate-900 tracking-tight">
                        {container.container_code}
                      </h3>
                      {container.qr_generated ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mt-1 uppercase tracking-wider">
                          <QrCode className="w-3.5 h-3.5" /> Generado
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                          <QrCode className="w-3.5 h-3.5" /> Pendiente
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Categoría (Minimalista) */}
                <div className="mb-6 relative z-10">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Clasificación</p>
                  <p className="font-bold text-lg" style={{ color: categoryColor }}>
                    {container.waste_category?.name || "Sin categoría asignada"}
                  </p>
                </div>

                {/* Footer de la Tarjeta (Métricas y Ubicación) */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5" /> Volumen
                    </p>
                    <span className="text-sm font-bold text-slate-800">
                      {container.volume_cubic_meters ? `${container.volume_cubic_meters} m³` : "N/D"}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" /> Tara
                    </p>
                    <span className="text-sm font-bold text-slate-800">{container.tare_weight} kg</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="bg-slate-100 p-2 rounded-lg text-slate-500 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {container.location?.name || "Sin ubicación"}
                    </p>
                    <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                      {container.location?.sector} {container.location?.campus?.name && `• ${container.location.campus.name}`}
                    </p>
                  </div>
                </div>

                {/* BOTONES FLOTANTES AL HOVER (Se ven increíbles) */}
                <div className="absolute top-6 right-6 flex gap-1.5 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all z-20">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-white shadow-md shadow-slate-200/50 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100"
                    onClick={() => {
                      setSelectedContainer(container);
                      setShowQRModal(true);
                    }}
                    title="Ver Código QR"
                  >
                    <QrCode className="w-4 h-4" />
                  </Button>
                  <Link href={`/containers/${container.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white shadow-md shadow-slate-200/50 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-100">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setContainerToToggle(container)}
                    className={cn(
                      "h-10 w-10 rounded-full bg-white shadow-md shadow-slate-200/50 border border-slate-100",
                      container.is_active ? "text-slate-600 hover:text-rose-600 hover:bg-rose-50" : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                    )}
                  >
                    {container.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </Button>
                </div>

              </div>
            );
          })}

          {/* Tarjeta para Agregar Nuevo Contenedor */}
          {filter !== "inactive" && (
            <Link href="/containers/new" className="block h-full group">
              <div className="h-full min-h-[340px] border-2 border-dashed border-slate-200 hover:border-blue-400 bg-transparent hover:bg-blue-50/50 transition-colors rounded-3xl flex flex-col items-center justify-center p-8 text-center cursor-pointer">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-blue-600 transition-all">
                  <Plus className="w-10 h-10 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-black text-slate-700 group-hover:text-blue-700">Nuevo Contenedor</h3>
                <p className="text-base text-slate-500 font-medium mt-2">Dar de alta un depósito en el sistema</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* MODAL DE CÓDIGO QR (Diseño limpio y moderno) */}
      {showQRModal && selectedContainer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl scale-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">Código QR del Contenedor</h2>
            <QRCodeCard
              container={selectedContainer}
              category={categories.find((c) => c.id === selectedContainer.waste_category_id)}
              location={locations.find((l) => l.id === selectedContainer.location_id)}
            />
            <Button
              onClick={() => setShowQRModal(false)}
              className="mt-6 w-full h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base shadow-none"
            >
              Cerrar Vista
            </Button>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      <AlertDialog open={!!containerToToggle} onOpenChange={() => setContainerToToggle(null)}>
        <AlertDialogContent className="rounded-3xl p-8 border-0 shadow-2xl max-w-md">
          <AlertDialogHeader className="mb-4">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-4",
              containerToToggle?.is_active ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
            )}>
              {containerToToggle?.is_active ? <AlertTriangle className="w-6 h-6" /> : <Power className="w-6 h-6" />}
            </div>
            <AlertDialogTitle className="text-2xl font-black text-slate-900">
              {containerToToggle?.is_active ? "¿Desactivar contenedor?" : "Reactivar contenedor"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-slate-600 font-medium pt-2">
              {containerToToggle?.is_active ? (
                <>
                  El contenedor <strong className="font-mono text-slate-900">{containerToToggle?.container_code}</strong> se marcará como inactivo. Ya no recibirá nuevas recolecciones.
                </>
              ) : (
                <>
                  El contenedor <strong className="font-mono text-slate-900">{containerToToggle?.container_code}</strong> volverá a estar disponible para la recolección activa.
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
                containerToToggle?.is_active ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {toggling ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
              ) : containerToToggle?.is_active ? (
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