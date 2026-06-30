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
  const [volumeLiters, setVolumeLiters] = useState("");
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
      setVolumeLiters(
        containerData.volume_liters !== null ? String(containerData.volume_liters) : ""
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
      originalContainer.volume_liters !== null
        ? String(originalContainer.volume_liters)
        : "";

    return (
      containerCode.trim() !== originalContainer.container_code ||
      tareWeight.trim() !== String(originalContainer.tare_weight) ||
      volumeLiters.trim() !== originalVolume ||
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
    if (volumeLiters.trim() !== "") {
      volumeNum = parseFloat(volumeLiters.replace(",", "."));
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
        volume_liters: volumeNum,
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
  const categoryColor = selectedCategory?.color || "#6b7280";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Cargando contenedor...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/containers" className="hover:text-blue-600">
          Gestión de Contenedores
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Editar Contenedor</span>
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
            <h1 className="text-3xl font-bold text-gray-900">Editar Contenedor</h1>
            <p className="text-gray-600 mt-1 font-mono">
              {originalContainer?.container_code}
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
            disabled={saving || !hasChanges()}
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
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>

      {hasChanges() && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600" />
          <p className="text-sm text-amber-900">Tienes cambios sin guardar</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-2 space-y-6">
            {/* Identificación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-blue-600" />
                  Identificación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="container_code">
                    Código del Contenedor <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="container_code"
                    type="text"
                    placeholder="Ej. CONT-HUA-003"
                    value={containerCode}
                    onChange={(e) => setContainerCode(e.target.value.toUpperCase())}
                    disabled={saving}
                    maxLength={50}
                    className="font-mono"
                  />
                  {originalContainer?.qr_generated && (
                    <p className="text-xs text-amber-600">
                      ⚠️ Este contenedor ya tiene QR generado. Cambiar el código requerirá regenerar el QR.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado Operativo</Label>
                  <Select value={status} onValueChange={setStatus} disabled={saving}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="maintenance">En mantenimiento</SelectItem>
                      <SelectItem value="damaged">Dañado</SelectItem>
                      <SelectItem value="reserved">Reservado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Asignación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-600" />
                  Asignación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Categoría de Residuos <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={categoryId}
                    onValueChange={setCategoryId}
                    disabled={saving}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecciona una categoría" />
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campus_filter">Filtrar ubicaciones por campus</Label>
                  <Select
                    value={selectedCampus}
                    onValueChange={(value) => {
                      setSelectedCampus(value);
                      if (value !== "all") {
                        // Si la ubicación actual no es del campus, reset
                        const currentLoc = locations.find((l) => l.id === locationId);
                        if (currentLoc && currentLoc.campus_id !== value) {
                          setLocationId("");
                        }
                      }
                    }}
                    disabled={saving}
                  >
                    <SelectTrigger id="campus_filter">
                      <Building2 className="w-4 h-4 mr-2" />
                      <SelectValue />
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
                    Ubicación <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={locationId}
                    onValueChange={setLocationId}
                    disabled={saving}
                  >
                    <SelectTrigger id="location">
                      <SelectValue placeholder="Selecciona una ubicación" />
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
                </div>
              </CardContent>
            </Card>

            {/* Datos físicos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-blue-600" />
                  Datos Físicos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-xs text-amber-900">
                    <strong>⚠️ Cuidado:</strong> Modificar la tara afectará los cálculos de
                    peso neto en los próximos reportes de recolección. Los reportes históricos
                    no se verán afectados.
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
                          {containerCode || "CONT-XXX-XXX"}
                        </p>
                        {originalContainer?.qr_generated ? (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <QrCode className="w-3 h-3" />
                            <span>QR generado</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <QrCode className="w-3 h-3" />
                            <span>QR pendiente</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-3 pb-3 border-b border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Categoría</p>
                      <p
                        className="font-semibold text-sm"
                        style={{ color: categoryColor }}
                      >
                        {selectedCategory?.name || "Sin categoría"}
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
                          {selectedLocation?.name || "Sin ubicación"}
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
                  Así se verá en la lista de contenedores
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}