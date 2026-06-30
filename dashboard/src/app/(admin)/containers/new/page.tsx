"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CategoryIcon from "@/components/shared/CategoryIcon";

import { containersAPI, categoriesAPI, locationsAPI, campusAPI } from "@/lib/api";
import type { WasteCategory, Location, Campus } from "@/types";

export default function NewContainerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingCode, setLoadingCode] = useState(false);

  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);

  // Form state
  const [suggestedCode, setSuggestedCode] = useState<string>("");
  const [tareWeight, setTareWeight] = useState("");
  const [volumeLiters, setVolumeLiters] = useState("");
  const [status, setStatus] = useState("active");
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");

  // Filtro UX
  const [selectedCampus, setSelectedCampus] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  // Cuando cambia la ubicacion, obtener el siguiente codigo del campus
  useEffect(() => {
    if (locationId) {
      const location = locations.find((l) => l.id === locationId);
      if (location?.campus_id) {
        loadNextCode(location.campus_id);
      }
    } else {
      setSuggestedCode("");
    }
  }, [locationId, locations]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [categoriesData, locationsData, campusData] = await Promise.all([
        categoriesAPI.getAll(true),
        locationsAPI.getAll(true),
        campusAPI.getAll(),
      ]);
      setCategories(categoriesData);
      setLocations(locationsData);
      setCampuses(campusData);
    } catch (error: any) {
      toast.error("Error al cargar los datos");
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadNextCode = async (campusId: string) => {
    try {
      setLoadingCode(true);
      const data = await containersAPI.getNextCode(campusId);
      setSuggestedCode(data.code);
    } catch (error: any) {
      toast.error("Error al generar el codigo");
      console.error(error);
      setSuggestedCode("");
    } finally {
      setLoadingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tareWeight.trim()) {
      toast.error("La tara del contenedor es obligatoria");
      return;
    }
    if (!categoryId) {
      toast.error("Debes seleccionar una categoria");
      return;
    }
    if (!locationId) {
      toast.error("Debes seleccionar una ubicacion");
      return;
    }

    const tareNum = parseFloat(tareWeight.replace(",", "."));
    if (isNaN(tareNum) || tareNum < 0) {
      toast.error("La tara debe ser un numero positivo");
      return;
    }

    let volumeNum: number | null = null;
    if (volumeLiters.trim() !== "") {
      volumeNum = parseFloat(volumeLiters.replace(",", "."));
      if (isNaN(volumeNum) || volumeNum < 0) {
        toast.error("El volumen debe ser un numero positivo");
        return;
      }
    }

    try {
      setSaving(true);

      // NO enviamos container_code: el backend lo autogenera
      const payload: any = {
        tare_weight: tareNum,
        volume_liters: volumeNum,
        status: status,
        waste_category_id: categoryId,
        location_id: locationId,
      };

      const created = await containersAPI.create(payload);

      toast.success(`Contenedor "${created.container_code}" creado exitosamente`);
      router.push("/containers");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Error al crear el contenedor";
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
  const categoryColor = selectedCategory?.color || "#6b7280";

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/containers" className="hover:text-blue-600">
          Gestion de Contenedores
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Nuevo Contenedor</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/containers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nuevo Contenedor</h1>
            <p className="text-gray-600 mt-1">
              Registra un nuevo contenedor fisico en el sistema
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/containers">
            <Button variant="outline" disabled={saving}>
              Cancelar
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={saving || !locationId}
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
                Guardar Contenedor
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario - 2 columnas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Codigo autogenerado */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Codigo Autogenerado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-white border-2 border-blue-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <QrCode className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Codigo del contenedor</p>
                      <p className="font-mono font-bold text-2xl text-gray-900">
                        {loadingCode ? (
                          <span className="text-gray-400 flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generando...
                          </span>
                        ) : suggestedCode ? (
                          suggestedCode
                        ) : (
                          <span className="text-gray-400">CONT-???-???</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {suggestedCode && !loadingCode && (
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                      ✓ Disponible
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  <strong>El codigo se genera automaticamente</strong> segun el campus de
                  la ubicacion seleccionada.
                </p>
              </CardContent>
            </Card>

            {/* Asignacion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-600" />
                  Asignacion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Categoria de Residuos <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={categoryId}
                    onValueChange={setCategoryId}
                    disabled={saving}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecciona una categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Tipo de residuo que recibira este contenedor
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campus_filter">Filtrar ubicaciones por campus</Label>
                  <Select
                    value={selectedCampus}
                    onValueChange={(value) => {
                      setSelectedCampus(value);
                      setLocationId("");
                      setSuggestedCode("");
                    }}
                    disabled={saving}
                  >
                    <SelectTrigger id="campus_filter">
                      <Building2 className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Todos los campus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los campus</SelectItem>
                      {campuses.map((campus) => (
                        <SelectItem key={campus.id} value={campus.id}>
                          {campus.name} ({campus.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">
                    Ubicacion <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={locationId}
                    onValueChange={setLocationId}
                    disabled={saving}
                  >
                    <SelectTrigger id="location">
                      <SelectValue placeholder="Selecciona una ubicacion" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLocations.length === 0 ? (
                        <div className="px-2 py-3 text-sm text-gray-500 text-center">
                          No hay ubicaciones en este campus
                        </div>
                      ) : (
                        filteredLocations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <div className="flex flex-col">
                                <span className="font-medium">{location.name}</span>
                                {location.sector && (
                                  <span className="text-xs text-gray-500">
                                    {location.sector}
                                  </span>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    El codigo del contenedor se genera segun el campus de esta ubicacion
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Estado y Datos Fisicos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-blue-600" />
                  Estado y Datos Fisicos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Estado Operativo</Label>
                  <Select value={status} onValueChange={setStatus} disabled={saving}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="maintenance">En mantenimiento</SelectItem>
                      <SelectItem value="damaged">Daniado</SelectItem>
                      <SelectItem value="reserved">Reservado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tare_weight">
                      Tara (kg) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="tare_weight"
                        type="text"
                        placeholder="Ej. 5"
                        value={tareWeight}
                        onChange={(e) => setTareWeight(e.target.value)}
                        disabled={saving}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Peso del contenedor vacio
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="volume_liters">Volumen (L)</Label>
                    <div className="relative">
                      <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="volume_liters"
                        type="text"
                        placeholder="Ej. 120"
                        value={volumeLiters}
                        onChange={(e) => setVolumeLiters(e.target.value)}
                        disabled={saving}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Capacidad maxima (opcional)</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-xs text-blue-900">
                    <strong>Tip:</strong> La tara se descuenta del peso total medido durante
                    las recolecciones para calcular el peso neto del residuo.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vista Previa */}
          <div>
            <Card className="bg-gradient-to-br from-blue-50 to-white sticky top-6">
              <CardHeader>
                <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Vista Previa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg border-2 overflow-hidden relative">
                  <div
                    className="h-1.5"
                    style={{ backgroundColor: categoryColor }}
                  />

                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${categoryColor}20` }}
                      >
                        <CategoryIcon
                          icon={selectedCategory?.icon || null}
                          size={24}
                          color={categoryColor}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono font-bold text-gray-900 text-sm truncate">
                          {suggestedCode || "CONT-???-???"}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <QrCode className="w-3 h-3" />
                          <span>QR pendiente</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3 pb-3 border-b border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Categoria</p>
                      <p
                        className="font-semibold text-sm"
                        style={{ color: categoryColor }}
                      >
                        {selectedCategory?.name || "Sin categoria"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Box className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-500">Vol:</span>
                        <span className="font-semibold">{volumeLiters || "—"} L</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Scale className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-500">Tara:</span>
                        <span className="font-semibold">{tareWeight || "—"} kg</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-3 border-t border-gray-100">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {selectedLocation?.name || "Sin ubicacion"}
                        </p>
                        {selectedLocation?.sector && (
                          <p className="text-xs text-gray-500 truncate">
                            {selectedLocation.sector}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 italic text-center">
                  Asi se vera en la lista de contenedores
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}