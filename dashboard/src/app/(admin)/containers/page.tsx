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
import { QrCodeIcon } from "lucide-react";
import QRCodeCard from "@/components/qr/QRCodeCard";

import { containersAPI, categoriesAPI, campusAPI, locationsAPI } from "@/lib/api";
import type { Container, WasteCategory, Campus, Location} from "@/types";

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
      containersAPI.getAll(false), // Traer todos
      categoriesAPI.getAll(false),
      campusAPI.getAll(),
      locationsAPI.getAll(false), // Agregar esta línea
    ]);
    setContainers(containersData);
    setCategories(categoriesData);
    setCampuses(campusesData);
    setLocations(locationsData); // Agregar esta línea
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
      toast.error(
        isActivating
          ? "Error al reactivar el contenedor"
          : "Error al desactivar el contenedor"
      );
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

  // Stats
  const activeCount = containers.filter((c) => c.is_active).length;
  const inactiveCount = containers.filter((c) => !c.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Contenedores</h1>
          <p className="text-gray-600 mt-1">
            Administra los contenedores físicos del sistema y sus asignaciones.
          </p>
        </div>
        <Link href="/containers/new">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Contenedor
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3">
        {/* Primera fila: búsqueda + dropdowns */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por código, categoría o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={campusFilter} onValueChange={setCampusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Building2 className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por campus" />
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

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories
                .filter((c) => c.is_active)
                .map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Segunda fila: filtros de estado */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            Todos ({containers.length})
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("active")}
            className={filter === "active" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Activos ({activeCount})
          </Button>
          <Button
            variant={filter === "inactive" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("inactive")}
            className={filter === "inactive" ? "bg-gray-600 hover:bg-gray-700" : ""}
          >
            Inactivos ({inactiveCount})
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Cargando contenedores...</span>
        </div>
      )}

      {/* Empty states */}
      {!loading && filteredContainers.length === 0 && containers.length > 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No se encontraron contenedores con los filtros actuales</p>
          </CardContent>
        </Card>
      )}

      {!loading && containers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Trash2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">No hay contenedores registrados</p>
            <Link href="/containers/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Crear primer contenedor
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Grid de contenedores */}
      {!loading && filteredContainers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContainers.map((container) => {
            const categoryColor = container.waste_category?.color || "#6b7280";

            return (
              <Card
                key={container.id}
                className={cn(
                  "transition-all relative overflow-hidden",
                  container.is_active
                    ? "hover:shadow-lg"
                    : "opacity-60 grayscale hover:opacity-80"
                )}
              >
                {/* Barra de color superior */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: categoryColor }}
                />

                {!container.is_active && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                      Inactivo
                    </Badge>
                  </div>
                )}

                <CardContent className="p-6 pt-7">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${categoryColor}20` }}
                      >
                        <CategoryIcon
                          icon={container.waste_category?.icon || null}
                          size={24}
                          color={categoryColor}
                        />
                      </div>
                      <div>
                        <p className="font-mono font-bold text-gray-900">
                          {container.container_code}
                        </p>
                        {container.qr_generated ? (
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

                    <div className="flex gap-1">
                      <div className="flex gap-1">
                        <Link href={`/containers/${container.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-blue-600"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-blue-600"
                          onClick={() => {
                            setSelectedContainer(container);
                            setShowQRModal(true);
                          }}
                          title="Ver QR"
                        >
                          <QrCodeIcon className="w-4 h-4" />
                        </Button>
                      </div>
                      {container.is_active ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-red-600"
                          onClick={() => setContainerToToggle(container)}
                          title="Desactivar"
                        >
                          <PowerOff className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-green-600"
                          onClick={() => setContainerToToggle(container)}
                          title="Reactivar"
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Categoría */}
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Categoría</p>
                    <p className="font-semibold text-gray-900" style={{ color: categoryColor }}>
                      {container.waste_category?.name || "Sin categoría"}
                    </p>
                  </div>

                  {/* Datos técnicos */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Volumen</p>
                        <p className="text-sm font-semibold">
                          {container.volume_liters ? `${container.volume_liters} L` : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Tara</p>
                        <p className="text-sm font-semibold">{container.tare_weight} kg</p>
                      </div>
                    </div>
                  </div>
                  {/* QR Modal */}
                  {showQRModal && selectedContainer && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Código QR del Contenedor</h2>
                        <QRCodeCard
                          container={selectedContainer}
                          category={categories.find(
                            (c) => c.id === selectedContainer.waste_category_id
                          )}
                          location={locations.find(
                            (l) => l.id === selectedContainer.location_id
                          )}
                        />
                        <button
                          onClick={() => setShowQRModal(false)}
                          className="mt-4 w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Ubicación */}
                  <div className="flex items-start gap-2 pt-3 border-t border-gray-100">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {container.location?.name || "Sin ubicación"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {container.location?.sector && (
                          <p className="text-xs text-gray-500 truncate">
                            {container.location.sector}
                          </p>
                        )}
                        {container.location?.campus?.name && (
                          <Badge variant="outline" className="text-xs">
                            {container.location.campus.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Card de "Nuevo Contenedor" */}
          {filter !== "inactive" && (
            <Link href="/containers/new">
              <Card className="border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer h-full">
                <CardContent className="flex flex-col items-center justify-center py-12 h-full">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Plus className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-semibold">Nuevo Contenedor</p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      )}

      {/* Footer */}
      {!loading && containers.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
          <div className="flex items-center gap-4">
            <span>
              <span className="font-semibold text-green-700">{activeCount}</span> Activos
            </span>
            {inactiveCount > 0 && (
              <span>
                <span className="font-semibold text-gray-700">{inactiveCount}</span> Inactivos
              </span>
            )}
            <span className="text-gray-400">|</span>
            <span>
              <span className="font-semibold text-gray-900">{containers.length}</span> Total
            </span>
          </div>
        </div>
      )}

      {/* Dialog confirmación */}
      <AlertDialog
        open={!!containerToToggle}
        onOpenChange={() => setContainerToToggle(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {containerToToggle?.is_active ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  ¿Desactivar contenedor?
                </>
              ) : (
                <>
                  <Power className="w-5 h-5 text-green-600" />
                  ¿Reactivar contenedor?
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {containerToToggle?.is_active ? (
                <>
                  El contenedor{" "}
                  <strong className="font-mono">{containerToToggle?.container_code}</strong>{" "}
                  dejará de aparecer en las listas operativas. Los reportes de recolección
                  asociados se mantendrán intactos.
                </>
              ) : (
                <>
                  El contenedor{" "}
                  <strong className="font-mono">{containerToToggle?.container_code}</strong>{" "}
                  volverá a estar disponible en todas las listas operativas.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggling}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
              disabled={toggling}
              className={
                containerToToggle?.is_active
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              {toggling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : containerToToggle?.is_active ? (
                "Sí, desactivar"
              ) : (
                "Sí, reactivar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}