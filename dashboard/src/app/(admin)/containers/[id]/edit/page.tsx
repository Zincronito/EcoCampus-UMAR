"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Save,
  ArrowLeft,
  Loader2,
  Tag,
  MapPin,
  Scale,
  Box,
  Info,
  Building2,
  QrCode,
  ClipboardList,
  AlertTriangle,
  Eye
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import CategoryIcon from "@/components/shared/CategoryIcon";

import { containersAPI, categoriesAPI, locationsAPI, campusAPI } from "@/lib/api";
import type { WasteCategory, Location, Campus, Container } from "@/types";

export default function EditContainerPage() {
  const router = useRouter();
  const params = useParams();
  const containerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [originalContainer, setOriginalContainer] = useState<Container | null>(null);
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);

  // Form state
  const [containerCode, setContainerCode] = useState("");
  const [tareWeight, setTareWeight] = useState("");
  const [volumeCubicMeters, setVolumeCubicMeters] = useState("");
  const [status, setStatus] = useState("active");
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");

  const [selectedCampus, setSelectedCampus] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, [containerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [containerData, categoriesData, locationsData, campusData] =
        await Promise.all([
          containersAPI.getById(containerId),
          categoriesAPI.getAll(true),
          locationsAPI.getAll(true),
          campusAPI.getAll(),
        ]);

      setOriginalContainer(containerData);
      setContainerCode(containerData.container_code);
      setTareWeight(String(containerData.tare_weight));
      setVolumeCubicMeters(
        containerData.volume_cubic_meters !== null ? String(containerData.volume_cubic_meters) : ""
      );
      setStatus(containerData.status);
      setCategoryId(containerData.waste_category_id);
      setLocationId(containerData.location_id);

      // Pre-filtrar por campus de la ubicación
      if (containerData.location?.campus?.id) {
        setSelectedCampus(containerData.location.campus.id);
      }

      setCategories(categoriesData);
      setLocations(locationsData);
      setCampuses(campusData);
    } catch (error: any) {
      toast.error("Error al cargar el contenedor");
      console.error(error);
      router.push("/containers");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    if (!originalContainer) return false;

    const originalVolume =
      originalContainer.volume_cubic_meters !== null
        ? String(originalContainer.volume_cubic_meters)
        : "";

    return (
      containerCode.trim() !== originalContainer.container_code ||
      tareWeight.trim() !== String(originalContainer.tare_weight) ||
      volumeCubicMeters.trim() !== originalVolume ||
      status !== originalContainer.status ||
      categoryId !== originalContainer.waste_category_id ||
      locationId !== originalContainer.location_id
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!containerCode.trim()) {
      toast.error("El código del contenedor es obligatorio");
      return;
    }
    if (!tareWeight.trim()) {
      toast.error("La tara del contenedor es obligatoria");
      return;
    }
    if (!categoryId) {
      toast.error("Debes seleccionar una categoría");
      return;
    }
    if (!locationId) {
      toast.error("Debes seleccionar una ubicación");
      return;
    }
    if (!hasChanges()) {
      toast.info("No has realizado cambios");
      return;
    }

    const tareNum = parseFloat(tareWeight.replace(",", "."));
    if (isNaN(tareNum) || tareNum < 0) {
      toast.error("La tara debe ser un número positivo");
      return;
    }

    let volumeNum: number | null = null;
    if (volumeCubicMeters.trim() !== "") {
      volumeNum = parseFloat(volumeCubicMeters.replace(",", "."));
      if (isNaN(volumeNum) || volumeNum < 0) {
        toast.error("El volumen debe ser un número positivo");
        return;
      }
    }

    try {
      setSaving(true);

      const payload: any = {
        container_code: containerCode.trim().toUpperCase(),
        tare_weight: tareNum,
        volume_cubic_meters: volumeNum,
        status: status,
        waste_category_id: categoryId,
        location_id: locationId,
      };

      await containersAPI.update(containerId, payload);

      toast.success(`Contenedor "${containerCode}" actualizado exitosamente`);
      router.push("/containers");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Error al actualizar el contenedor";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const filteredLocations =
    selectedCampus === "all"
      ? locations
      : locations.filter((l) => l.campus_id === selectedCampus);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedLocation = locations.find((l) => l.id === locationId);
  const categoryColor = selectedCategory?.color || "#94a3b8";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <span className="text-slate-500 font-bold text-lg block text-center w-full">Cargando datos del contenedor...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans pb-24">
      
      {/* HEADER TOP-TIER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">
            <Link href="/containers" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Inventario
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900">Editar</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Editar Contenedor
            </h1>
            <Badge className="bg-blue-100 text-blue-800 border-none font-mono text-base px-3 py-1">
              {originalContainer?.container_code}
            </Badge>
          </div>
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <Link href="/containers" className="flex-1 lg:flex-none">
            <Button variant="outline" disabled={saving} className="w-full rounded-full h-12 px-6 font-bold border-slate-200 text-slate-600 hover:bg-slate-50">
              Cancelar
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={saving || !hasChanges()}
            className="flex-1 lg:flex-none h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {saving ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Guardando</>
            ) : (
              <><Save className="w-5 h-5 mr-2" /> Guardar Cambios</>
            )}
          </Button>
        </div>
      </div>

      {/* BANNER DE CAMBIOS SIN GUARDAR */}
      <div className={cn(
        "mb-8 overflow-hidden transition-all duration-500",
        hasChanges() ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-amber-100 p-2.5 rounded-full shrink-0">
            <Info className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900">Modificaciones detectadas</p>
            <p className="text-sm text-amber-700">Recuerda presionar "Guardar Cambios" para aplicar la nueva configuración.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: FORMULARIO */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* SECCIÓN 1: Identificación */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  <QrCode className="w-5 h-5 text-slate-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Identificación</h2>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="container_code" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Código del Contenedor <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="container_code"
                    type="text"
                    placeholder="Ej. CONT-HUA-003"
                    value={containerCode}
                    onChange={(e) => setContainerCode(e.target.value.toUpperCase())}
                    disabled={saving}
                    maxLength={50}
                    className="h-14 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 text-lg font-black font-mono tracking-widest px-5"
                  />
                  {originalContainer?.qr_generated && containerCode !== originalContainer.container_code && (
                    <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 mt-2 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <p className="text-xs font-medium text-rose-800">
                        Este contenedor ya tiene un QR generado. Si cambias el código, tendrás que imprimir y pegar un nuevo QR físico.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado Operativo</Label>
                  <Select value={status} onValueChange={setStatus} disabled={saving}>
                    <SelectTrigger id="status" className="h-14 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 text-base font-medium px-5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="active" className="font-bold text-emerald-600">Activo (En uso)</SelectItem>
                      <SelectItem value="maintenance" className="font-bold text-amber-600">En mantenimiento</SelectItem>
                      <SelectItem value="damaged" className="font-bold text-rose-600">Dañado</SelectItem>
                      <SelectItem value="reserved" className="font-bold text-slate-600">En bodega (Reservado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: Asignación */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  <Tag className="w-5 h-5 text-slate-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Configuración de Recolección</h2>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Categoría de Residuos <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={categoryId} onValueChange={setCategoryId} disabled={saving}>
                    <SelectTrigger id="category" className="h-14 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 text-base font-medium px-5">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id} className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="campus_filter" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtrar por Campus</Label>
                    <Select
                      value={selectedCampus}
                      onValueChange={(value) => {
                        setSelectedCampus(value);
                        if (value !== "all") {
                          const currentLoc = locations.find((l) => l.id === locationId);
                          if (currentLoc && currentLoc.campus_id !== value) {
                            setLocationId("");
                          }
                        }
                      }}
                      disabled={saving}
                    >
                      <SelectTrigger id="campus_filter" className="h-14 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 text-base font-medium px-5">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <SelectValue placeholder="Todos los campus" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all" className="font-medium">Todos los campus</SelectItem>
                        {campuses.map((campus) => (
                          <SelectItem key={campus.id} value={campus.id} className="font-medium">
                            {campus.name} ({campus.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Ubicación Física <span className="text-rose-500">*</span>
                    </Label>
                    <Select value={locationId} onValueChange={setLocationId} disabled={saving}>
                      <SelectTrigger id="location" className="h-14 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 text-base font-medium px-5">
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <SelectValue placeholder="Selecciona un punto" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-60">
                        {filteredLocations.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-slate-500 text-center font-medium">
                            No hay ubicaciones en este campus
                          </div>
                        ) : (
                          filteredLocations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              <div className="flex flex-col py-1">
                                <span className="font-bold text-slate-700">{location.name}</span>
                                {location.sector && (
                                  <span className="text-xs font-medium text-slate-400 mt-0.5">Sector: {location.sector}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: Datos Físicos */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  <ClipboardList className="w-5 h-5 text-slate-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Métricas Físicas</h2>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="tare_weight" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Tara del Contenedor (kg) <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="tare_weight"
                        type="text"
                        placeholder="Ej. 15.5"
                        value={tareWeight}
                        onChange={(e) => setTareWeight(e.target.value)}
                        disabled={saving}
                        className="h-14 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 text-lg font-black pl-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="volume_cubic_meters" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Capacidad Volumétrica (m³)
                    </Label>
                    <div className="relative">
                      <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="volume_cubic_meters"
                        type="text"
                        placeholder="Ej. 1.2"
                        value={volumeCubicMeters}
                        onChange={(e) => setVolumeCubicMeters(e.target.value)}
                        disabled={saving}
                        className="h-14 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 text-lg font-black pl-12"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 mt-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-amber-900 leading-relaxed">
                    Modificar la tara afectará los cálculos de peso neto en los <strong className="font-black">próximos reportes</strong> de recolección. Los reportes históricos conservarán la tara anterior para mantener la integridad de los datos.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: VISTA PREVIA (Sticky) */}
          <div className="xl:col-span-1 xl:sticky xl:top-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 ml-2">
              <Eye className="w-4 h-4" /> Tarjeta de Previsualización
            </h3>
            
            {/* RÉPLICA EXACTA DEL DASHBOARD DE CONTENEDORES */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden transition-all duration-300">
              
              {/* Aura y línea de color */}
              <div 
                className="absolute top-0 left-0 w-full h-2 transition-all duration-500"
                style={{ backgroundColor: categoryColor }} 
              />
              <div 
                className="absolute top-0 left-0 w-full h-32 opacity-10 blur-3xl pointer-events-none transition-all duration-500"
                style={{ backgroundColor: categoryColor }} 
              />

              {/* Cabecera de la Tarjeta */}
              <div className="flex justify-between items-start mb-6 pt-2">
                <div className="flex gap-4 items-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm relative z-10 transition-colors duration-500"
                    style={{ backgroundColor: `${categoryColor}15` }}
                  >
                    <CategoryIcon
                      icon={selectedCategory?.icon || null}
                      size={32}
                      color={categoryColor}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-mono text-2xl font-black text-slate-900 tracking-tight truncate">
                      {containerCode || "CONT-XXX-XXX"}
                    </h3>
                    {originalContainer?.qr_generated ? (
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

              {/* Info Categoría */}
              <div className="mb-6 relative z-10">
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Clasificación</p>
                <p className="font-bold text-lg transition-colors duration-500 truncate" style={{ color: categoryColor }}>
                  {selectedCategory?.name || "Sin categoría asignada"}
                </p>
              </div>

              {/* Footer de la Tarjeta (Métricas y Ubicación) */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5" /> Volumen
                  </p>
                  <span className={cn("text-sm font-bold", volumeCubicMeters ? "text-slate-800" : "text-slate-400")}>
                    {volumeCubicMeters ? `${volumeCubicMeters} m³` : "N/D"}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" /> Tara
                  </p>
                  <span className={cn("text-sm font-bold", tareWeight ? "text-slate-800" : "text-slate-400")}>
                    {tareWeight ? `${tareWeight} kg` : "N/D"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="bg-slate-100 p-2 rounded-lg text-slate-500 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-bold truncate", selectedLocation ? "text-slate-900" : "text-slate-400")}>
                    {selectedLocation?.name || "Sin ubicación"}
                  </p>
                  <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                    {selectedLocation?.sector ? selectedLocation.sector : "Pendiente"} 
                    {selectedLocation?.campus?.name && ` • ${selectedLocation.campus.name}`}
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 text-center mt-4 font-medium">
              Los cambios se reflejarán en vivo al editar.
            </p>
          </div>

        </div>
      </form>
    </div>
  );
}