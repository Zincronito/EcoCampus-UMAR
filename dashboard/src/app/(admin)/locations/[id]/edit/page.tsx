"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
  FileText,
  LayoutGrid,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { locationsAPI, campusAPI } from "@/lib/api";
import type { Campus, Location } from "@/types";

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

export default function EditLocationPage() {
  const router = useRouter();
  const params = useParams();
  const locationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [originalLocation, setOriginalLocation] = useState<Location | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [campusId, setCampusId] = useState("");
  const [locationType, setLocationType] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadData();
  }, [locationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [locationData, campusData] = await Promise.all([
        locationsAPI.getById(locationId),
        campusAPI.getAll(),
      ]);

      setOriginalLocation(locationData);
      setName(locationData.name);
      setSector(locationData.sector || "");
      setCampusId(locationData.campus_id);
      setLocationType(locationData.location_type || "");
      setDescription(locationData.description || "");

      setCampuses(campusData);
    } catch (error: any) {
      toast.error("Error al cargar la ubicación");
      console.error(error);
      router.push("/locations");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    if (!originalLocation) return false;

    return (
      name.trim() !== originalLocation.name ||
      sector.trim() !== (originalLocation.sector || "") ||
      campusId !== originalLocation.campus_id ||
      locationType !== (originalLocation.location_type || "") ||
      description.trim() !== (originalLocation.description || "")
    );
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

    if (!hasChanges()) {
      toast.info("No has realizado cambios");
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

      await locationsAPI.update(locationId, payload);

      toast.success(`Ubicación "${name}" actualizada exitosamente`);
      router.push("/locations");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Error al actualizar la ubicación";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const selectedCampus = campuses.find((c) => c.id === campusId);
  const selectedType = LOCATION_TYPES.find((t) => t.value === locationType);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-lg font-semibold text-slate-600">Cargando ubicación...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Header y Acciones */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/locations">
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-2.5 py-1 rounded-md">
                  Gestión de Ubicaciones
                </span>
                {hasChanges() && (
                  <span className="text-[10px] font-bold tracking-wider text-amber-600 uppercase bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Cambios sin guardar
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tighter text-slate-950">
                Editar Ubicación
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/locations">
              <Button variant="ghost" disabled={saving} className="h-12 px-6 rounded-xl font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                Cancelar
              </Button>
            </Link>
            <Button
              onClick={handleSubmit}
              disabled={saving || !hasChanges()}
              className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold shadow-sm shadow-blue-200 transition-all"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* GRID PRINCIPAL */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* COLUMNA IZQUIERDA: FORMULARIO */}
            <div className="xl:col-span-8 space-y-8">
              
              {/* Tarjeta 1: Información Básica */}
              <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-5">
                  <CardTitle className="flex items-center gap-3 text-xl font-extrabold text-slate-950">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <FileText className="w-5 h-5" />
                    </div>
                    Información General
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-6">
                  
                  {/* Nombre */}
                  <div>
                    <Label htmlFor="name" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                      Nombre de la Ubicación <span className="text-red-500 text-sm">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Ej. Instituto de Biología, Cafetería Central..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={saving}
                      maxLength={150}
                      className="h-14 text-lg rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                    <p className="text-xs font-medium text-slate-400 mt-2 text-right">
                      {name.length}/150 caracteres
                    </p>
                  </div>

                  {/* Sector */}
                  <div>
                    <Label htmlFor="sector" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                      Sector / Área
                    </Label>
                    <Input
                      id="sector"
                      type="text"
                      placeholder="Ej. Edificio A, Planta Baja..."
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      disabled={saving}
                      maxLength={100}
                      className="h-14 text-base rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <Label htmlFor="description" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                      Descripción
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Detalles adicionales, referencias de acceso..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={saving}
                      rows={4}
                      maxLength={500}
                      className="resize-none text-base rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all p-4"
                    />
                    <p className="text-xs font-medium text-slate-400 mt-2 text-right">
                      {description.length}/500 caracteres
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tarjeta 2: Clasificación y Asignación */}
              <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-5">
                  <CardTitle className="flex items-center gap-3 text-xl font-extrabold text-slate-950">
                    <div className="p-2 bg-slate-900 text-white rounded-lg">
                      <Tag className="w-5 h-5" />
                    </div>
                    Clasificación y Asignación
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Campus */}
                  <div>
                    <Label htmlFor="campus" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                      Campus Asignado <span className="text-red-500 text-sm">*</span>
                    </Label>
                    <Select
                      value={campusId}
                      onValueChange={setCampusId}
                      disabled={saving}
                    >
                      <SelectTrigger 
                        id="campus"
                        className="h-14 text-base rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                      >
                        <SelectValue placeholder="Selecciona un campus" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        {campuses.map((campus) => (
                          <SelectItem key={campus.id} value={campus.id} className="py-3 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-400" />
                              <span className="font-medium text-slate-700">
                                {campus.name} <span className="text-slate-400 font-normal">({campus.code})</span>
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tipo de Ubicación */}
                  <div>
                    <Label htmlFor="location_type" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                      Tipo de Ubicación
                    </Label>
                    <Select
                      value={locationType}
                      onValueChange={setLocationType}
                      disabled={saving}
                    >
                      <SelectTrigger 
                        id="location_type"
                        className="h-14 text-base rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                      >
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        {LOCATION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="py-3 cursor-pointer font-medium text-slate-700">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* COLUMNA DERECHA: VISTA PREVIA */}
            <div className="xl:col-span-4 relative">
              <div className="sticky top-8 space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Vista Previa (Como en Menú)
                </h3>
                
                <Card className="rounded-3xl border border-slate-100 shadow-sm bg-white overflow-hidden p-2">
                  <CardContent className="p-6 md:p-8">
                    {/* Icono Superior */}
                    <div className="w-[84px] h-[84px] rounded-3xl bg-blue-50 flex items-center justify-center mb-6 border border-blue-100/50">
                      <MapPin className="w-10 h-10 text-blue-600" strokeWidth={2} />
                    </div>

                    {/* Textos Principales */}
                    <div className="space-y-2.5 mb-8">
                      <h3 className="text-[28px] font-extrabold text-slate-900 leading-tight">
                        {name || "Nombre de ubicación"}
                      </h3>
                      {description && (
                        <p className="text-[17px] font-medium text-slate-500 leading-relaxed line-clamp-3">
                          {description}
                        </p>
                      )}
                    </div>

                    {/* Separador Fino */}
                    <div className="h-px w-full bg-slate-100 mb-6" />

                    {/* Cajas Inferiores */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Caja de Campus */}
                      <div className="bg-[#f8fafc] rounded-2xl p-4 flex flex-col justify-center gap-2.5 border border-transparent">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Campus</span>
                        </div>
                        <p className="text-base font-bold text-slate-700 truncate" title={selectedCampus?.name || "Sin campus"}>
                          {selectedCampus?.name || "Sin campus"}
                        </p>
                      </div>

                      {/* Caja de Sector / Tipo */}
                      <div className="bg-[#f8fafc] rounded-2xl p-4 flex flex-col justify-center gap-2.5 border border-transparent">
                        <div className="flex items-center gap-1.5">
                          <LayoutGrid className="w-4 h-4 text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Clasificación</span>
                        </div>
                        <p className="text-base font-bold text-slate-700 truncate" title={sector || selectedType?.label || "Sin clasificar"}>
                          {sector || selectedType?.label || "Sin clasificar"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}