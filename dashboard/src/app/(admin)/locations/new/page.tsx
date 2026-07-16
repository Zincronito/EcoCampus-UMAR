"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Save,
  ArrowLeft,
  Loader2,
  MapPin,
  Building2,
  Info,
  Tag,
  AlignLeft,
  Navigation,
  Eye
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { locationsAPI, campusAPI } from "@/lib/api";
import type { Campus } from "@/types";

// Tipos de ubicación sugeridos
const LOCATION_TYPES = [
  { value: "aula", label: "Aula / Salón" },
  { value: "laboratorio", label: "Laboratorio" },
  { value: "biblioteca", label: "Biblioteca" },
  { value: "cafeteria", label: "Cafetería" },
  { value: "oficina", label: "Oficina Administrativa" },
  { value: "instituto", label: "Instituto" },
  { value: "plaza", label: "Plaza / Área Común" },
  { value: "deportivo", label: "Área Deportiva" },
  { value: "estacionamiento", label: "Estacionamiento" },
  { value: "auditorio", label: "Auditorio" },
  { value: "jardin", label: "Jardín / Área Verde" },
  { value: "otro", label: "Otro" },
];

// Reutilizamos la Paleta de colores para mantener consistencia con el Dashboard
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

const getColorForCampus = (campusId: string | undefined, campuses: Campus[]) => {
  if (!campusId || campuses.length === 0) return "#94a3b8"; // Gris slate por defecto
  const campusIndex = campuses.findIndex(c => c.id === campusId);
  if (campusIndex === -1) return "#94a3b8";
  return CAMPUS_COLORS[campusIndex % CAMPUS_COLORS.length];
};

export default function NewLocationPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loadingCampuses, setLoadingCampuses] = useState(true);
  const [campuses, setCampuses] = useState<Campus[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [campusId, setCampusId] = useState("");
  const [locationType, setLocationType] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadCampuses();
  }, []);

  const loadCampuses = async () => {
    try {
      setLoadingCampuses(true);
      const data = await campusAPI.getAll();
      setCampuses(data);
    } catch (error: any) {
      toast.error("Error al cargar los campus");
      console.error(error);
    } finally {
      setLoadingCampuses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre de la ubicación es obligatorio");
      return;
    }

    if (!campusId) {
      toast.error("Debes seleccionar un campus");
      return;
    }

    try {
      setSaving(true);

      const payload: any = {
        name: name.trim(),
        campus_id: campusId,
        sector: sector.trim() || null,
        description: description.trim() || null,
        location_type: locationType || null,
      };

      await locationsAPI.create(payload);

      toast.success(`Ubicación "${name}" creada exitosamente`);
      router.push("/locations");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Error al crear la ubicación";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const selectedCampus = campuses.find((c) => c.id === campusId);
  const selectedType = LOCATION_TYPES.find((t) => t.value === locationType);
  const themeColor = getColorForCampus(campusId, campuses);

  if (loadingCampuses) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <span className="text-slate-500 font-bold text-lg block text-center w-full">Cargando base de datos...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans pb-24">
      
      {/* HEADER TOP-TIER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">
            <Link href="/locations" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Mapa Operativo
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900">Alta</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Nueva Ubicación
          </h1>
          <p className="text-slate-500 font-medium text-base mt-1">
            Traza y registra un nuevo punto físico dentro del mapa del campus.
          </p>
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <Link href="/locations" className="flex-1 lg:flex-none">
            <Button variant="outline" disabled={saving} className="w-full rounded-full h-12 px-6 font-bold border-slate-200 text-slate-600 hover:bg-slate-50">
              Cancelar
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={saving || !campusId}
            className="flex-1 lg:flex-none h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {saving ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Procesando</>
            ) : (
              <><Save className="w-5 h-5 mr-2" /> Guardar Ubicación</>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: FORMULARIO */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* SECCIÓN 1: Información Básica */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 relative z-10">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  <Info className="w-5 h-5 text-slate-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Información General</h2>
              </div>
              
              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Nombre del Área <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Ej. Instituto de Biología, Cafetería Central..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={saving}
                      maxLength={150}
                      className="h-14 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 text-lg font-black px-5 pl-12"
                    />
                  </div>
                  <p className="text-xs font-medium text-slate-400 text-right">{name.length}/150</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sector Específico (Opcional)</Label>
                  <div className="relative">
                    <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="sector"
                      type="text"
                      placeholder="Ej. Edificio A, Planta Baja, Zona Norte..."
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      disabled={saving}
                      maxLength={100}
                      className="h-14 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 text-base font-medium px-5 pl-12"
                    />
                  </div>
                  <p className="text-xs font-medium text-slate-400">Ayuda a identificar la sub-área o sección precisa donde se ubicarán los contenedores.</p>
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="description" className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <AlignLeft className="w-4 h-4" /> Descripción / Observaciones (Opcional)
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Escribe detalles adicionales relevantes: capacidad del área, horarios de acceso, referencias visuales..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={saving}
                    rows={4}
                    maxLength={500}
                    className="rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 text-base font-medium p-4 resize-none"
                  />
                  <p className="text-xs font-medium text-slate-400 text-right">{description.length}/500</p>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: Clasificación y Asignación */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  <Tag className="w-5 h-5 text-slate-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Ubicación Estructural</h2>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="campus" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Campus Base <span className="text-rose-500">*</span>
                    </Label>
                    <Select value={campusId} onValueChange={setCampusId} disabled={saving}>
                      <SelectTrigger id="campus" className="h-14 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 text-base font-bold px-5 text-slate-800">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                          <SelectValue placeholder="Selecciona un campus" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {campuses.map((campus) => (
                          <SelectItem key={campus.id} value={campus.id} className="font-bold text-slate-700 py-3">
                            {campus.name} ({campus.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location_type" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Zona (Opcional)</Label>
                    <Select value={locationType} onValueChange={setLocationType} disabled={saving}>
                      <SelectTrigger id="location_type" className="h-14 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 text-base font-medium px-5">
                        <SelectValue placeholder="Sin especificar" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {LOCATION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="font-medium">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: VISTA PREVIA (Sticky) */}
          <div className="xl:col-span-1 xl:sticky xl:top-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 ml-2">
              <Eye className="w-4 h-4" /> Tarjeta de Previsualización
            </h3>
            
            {/* RÉPLICA EXACTA DEL DASHBOARD DE UBICACIONES */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden transition-all duration-300">
              
              {/* Aura y línea de color asignada por el Campus */}
              <div 
                className="absolute top-0 left-0 w-full h-2 transition-all duration-500"
                style={{ backgroundColor: themeColor }} 
              />
              <div 
                className="absolute top-0 left-0 w-full h-32 opacity-10 blur-3xl pointer-events-none transition-all duration-500"
                style={{ backgroundColor: themeColor }} 
              />

              {/* Cabecera de la Tarjeta */}
              <div className="flex justify-between items-start mb-6 pt-2">
                <div className="flex gap-4 items-center">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm relative z-10 transition-colors duration-500"
                    style={{ backgroundColor: `${themeColor}15` }}
                  >
                    <MapPin className="w-7 h-7 transition-colors duration-500" style={{ color: themeColor }} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 pr-4">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-0.5 flex items-center gap-1">
                      <Navigation className="w-3 h-3" /> Sector
                    </p>
                    <h4 className="font-bold text-slate-700 truncate transition-colors duration-500" style={{ color: themeColor }}>
                      {sector || "Sin sector"}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Cuerpo de la Tarjeta */}
              <div className="mb-6 relative z-10">
                <h3 className={cn("text-2xl font-black mb-2 truncate transition-colors", name ? "text-slate-900" : "text-slate-300")} title={name}>
                  {name || "Nombre del Área"}
                </h3>
                <p className={cn("text-sm font-medium line-clamp-2 min-h-[2.5rem]", description ? "text-slate-500" : "text-slate-300 italic")}>
                  {description || "La descripción aparecerá aquí para dar más contexto..."}
                </p>
              </div>

              {/* Footer de la Tarjeta (Campus y Tipo) */}
              <div className="flex items-center justify-between pt-5 border-t border-slate-100 relative z-10">
                <div className="flex items-center gap-2 max-w-[65%]">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 leading-none">Campus</span>
                    <span className="text-sm font-bold text-slate-800 leading-tight truncate">
                      {selectedCampus?.name || "Sin asignar"}
                    </span>
                  </div>
                </div>
                
                {selectedType && (
                  <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 font-bold px-3 py-1 truncate shrink-0 max-w-[30%]">
                    {selectedType.label}
                  </Badge>
                )}
              </div>
            </div>
            
            <p className="text-xs text-slate-400 text-center mt-4 font-medium">
              El color de la tarjeta se asigna automáticamente al seleccionar el campus.
            </p>
          </div>

        </div>
      </form>
    </div>
  );
}