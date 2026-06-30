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
import type { Campus } from "@/types";

// Tipos de ubicacion sugeridos
const LOCATION_TYPES = [
  { value: "aula", label: "Aula / Salon" },
  { value: "laboratorio", label: "Laboratorio" },
  { value: "biblioteca", label: "Biblioteca" },
  { value: "cafeteria", label: "Cafeteria" },
  { value: "oficina", label: "Oficina Administrativa" },
  { value: "instituto", label: "Instituto" },
  { value: "plaza", label: "Plaza / Area Comun" },
  { value: "deportivo", label: "Area Deportiva" },
  { value: "estacionamiento", label: "Estacionamiento" },
  { value: "auditorio", label: "Auditorio" },
  { value: "jardin", label: "Jardin / Area Verde" },
  { value: "otro", label: "Otro" },
];

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
      toast.error("El nombre de la ubicacion es obligatorio");
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

      toast.success(`Ubicacion "${name}" creada exitosamente`);
      router.push("/locations");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Error al crear la ubicacion";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const selectedCampus = campuses.find((c) => c.id === campusId);
  const selectedType = LOCATION_TYPES.find((t) => t.value === locationType);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/locations" className="hover:text-blue-600">
          Gestion de Ubicaciones
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Nueva Ubicacion</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/locations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nueva Ubicacion</h1>
            <p className="text-gray-600 mt-1">
              Registra un nuevo lugar dentro de un campus
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/locations">
            <Button variant="outline" disabled={saving}>
              Cancelar
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={saving || loadingCampuses}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Ubicacion
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: Formulario - 2 columnas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informacion basica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Informacion Basica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nombre de la Ubicacion <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ej. Instituto de Biologia, Cafeteria Central..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={saving}
                    maxLength={150}
                  />
                  <p className="text-xs text-gray-500">{name.length}/150 caracteres</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector">Sector / Area</Label>
                  <Input
                    id="sector"
                    type="text"
                    placeholder="Ej. Edificio A, Planta Baja, Sector Norte..."
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    disabled={saving}
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500">
                    Sub-area o seccion especifica dentro de la ubicacion (opcional)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripcion</Label>
                  <Textarea
                    id="description"
                    placeholder="Detalles adicionales: capacidad, horarios, accesos..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={saving}
                    rows={4}
                    maxLength={500}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500">
                    {description.length}/500 caracteres
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Asignacion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-600" />
                  Clasificacion y Asignacion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campus">
                    Campus <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={campusId}
                    onValueChange={setCampusId}
                    disabled={saving || loadingCampuses}
                  >
                    <SelectTrigger id="campus">
                      <SelectValue
                        placeholder={
                          loadingCampuses ? "Cargando..." : "Selecciona un campus"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {campuses.map((campus) => (
                        <SelectItem key={campus.id} value={campus.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span>
                              {campus.name} ({campus.code})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Selecciona el campus al que pertenece esta ubicacion
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_type">Tipo de Ubicacion</Label>
                  <Select
                    value={locationType}
                    onValueChange={setLocationType}
                    disabled={saving}
                  >
                    <SelectTrigger id="location_type">
                      <SelectValue placeholder="Selecciona un tipo (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Clasificacion para mejor organizacion y reportes (opcional)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha: Vista Previa */}
          <div>
            <Card className="bg-gradient-to-br from-blue-50 to-white sticky top-6">
              <CardHeader>
                <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Vista Previa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg border-2 border-blue-100 p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center bg-blue-100">
                      <MapPin className="w-7 h-7 text-blue-600" strokeWidth={2} />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {name || "Nombre de la Ubicacion"}
                  </h3>
                  {sector && (
                    <p className="text-sm font-medium text-blue-600 mb-2">
                      Sector: {sector}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 mb-4 line-clamp-2 min-h-[2rem]">
                    {description || "Sin descripcion"}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs font-semibold text-gray-700 truncate max-w-[100px]">
                        {selectedCampus?.name || "Sin campus"}
                      </span>
                    </div>
                    {selectedType && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                        {selectedType.label}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 italic text-center">
                  Asi se vera en la lista de ubicaciones
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}