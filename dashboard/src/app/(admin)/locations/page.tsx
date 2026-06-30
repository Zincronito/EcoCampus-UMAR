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

import { locationsAPI, campusAPI } from "@/lib/api";
import type { Location, Campus } from "@/types";

type FilterType = "all" | "active" | "inactive";

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
        locationsAPI.getAll(false), // Traer todas (activas e inactivas)
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
        toast.success(`Ubicación "${locationToToggle.name}" reactivada`);
      } else {
        await locationsAPI.delete(locationToToggle.id);
        toast.success(`Ubicación "${locationToToggle.name}" desactivada`);
      }

      setLocationToToggle(null);
      await loadData();
    } catch (error: any) {
      toast.error(
        isActivating
          ? "Error al reactivar la ubicación"
          : "Error al desactivar la ubicación"
      );
      console.error(error);
    } finally {
      setToggling(false);
    }
  };

  // Filtrar
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

  // Stats
  const activeCount = locations.filter((l) => l.is_active).length;
  const inactiveCount = locations.filter((l) => !l.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Ubicaciones</h1>
          <p className="text-gray-600 mt-1">
            Administra los lugares específicos dentro de cada campus.
          </p>
        </div>
        <Link href="/locations/new">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Nueva Ubicación
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar ubicación o sector..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtro por Campus */}
        <Select value={campusFilter} onValueChange={setCampusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
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

        {/* Filtros por estado */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            Todas ({locations.length})
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("active")}
            className={filter === "active" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Activas ({activeCount})
          </Button>
          <Button
            variant={filter === "inactive" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("inactive")}
            className={filter === "inactive" ? "bg-gray-600 hover:bg-gray-700" : ""}
          >
            Inactivas ({inactiveCount})
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Cargando ubicaciones...</span>
        </div>
      )}

      {/* Empty states */}
      {!loading && filteredLocations.length === 0 && locations.length > 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No se encontraron ubicaciones con los filtros actuales</p>
          </CardContent>
        </Card>
      )}

      {!loading && locations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">No hay ubicaciones registradas</p>
            <Link href="/locations/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Crear primera ubicación
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Grid de ubicaciones */}
      {!loading && filteredLocations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((location) => (
            <Card
              key={location.id}
              className={cn(
                "transition-all relative",
                location.is_active
                  ? "hover:shadow-lg"
                  : "opacity-60 grayscale hover:opacity-80"
              )}
            >
              {!location.is_active && (
                <div className="absolute top-3 right-3 z-10">
                  <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                    Inactiva
                  </Badge>
                </div>
              )}

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-lg flex items-center justify-center bg-blue-100">
                    <MapPin className="w-7 h-7 text-blue-600" strokeWidth={2} />
                  </div>

                  <div className="flex gap-1">
                    <Link href={`/locations/${location.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-blue-600"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    {location.is_active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-red-600"
                        onClick={() => setLocationToToggle(location)}
                        title="Desactivar"
                      >
                        <PowerOff className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-green-600"
                        onClick={() => setLocationToToggle(location)}
                        title="Reactivar"
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {location.name}
                </h3>
                {location.sector && (
                  <p className="text-sm font-medium text-blue-600 mb-2">
                    Sector: {location.sector}
                  </p>
                )}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                  {location.description || "Sin descripción"}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-700">
                      {location.campus?.name || "Sin campus"}
                    </span>
                  </div>
                  {location.location_type && (
                    <Badge variant="outline" className="text-xs">
                      {location.location_type}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Card de "Nueva Ubicación" - solo si no es filtro de inactivas */}
          {filter !== "inactive" && (
            <Link href="/locations/new">
              <Card className="border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer h-full">
                <CardContent className="flex flex-col items-center justify-center py-12 h-full">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Plus className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-semibold">Nueva Ubicación</p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      )}

      {/* Footer con stats */}
      {!loading && locations.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
          <div className="flex items-center gap-4">
            <span>
              <span className="font-semibold text-green-700">{activeCount}</span> Activas
            </span>
            {inactiveCount > 0 && (
              <span>
                <span className="font-semibold text-gray-700">{inactiveCount}</span> Inactivas
              </span>
            )}
            <span className="text-gray-400">|</span>
            <span>
              <span className="font-semibold text-gray-900">{locations.length}</span> Total
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>{campuses.length} Campus</span>
          </div>
        </div>
      )}

      {/* Dialog de confirmación */}
      <AlertDialog open={!!locationToToggle} onOpenChange={() => setLocationToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {locationToToggle?.is_active ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  ¿Desactivar ubicación?
                </>
              ) : (
                <>
                  <Power className="w-5 h-5 text-green-600" />
                  ¿Reactivar ubicación?
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locationToToggle?.is_active ? (
                <>
                  La ubicación <strong>"{locationToToggle?.name}"</strong> dejará de
                  aparecer en las listas operativas, pero los contenedores y reportes
                  asociados se mantendrán intactos.
                </>
              ) : (
                <>
                  La ubicación <strong>"{locationToToggle?.name}"</strong> volverá a
                  estar disponible en todas las listas operativas.
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
                locationToToggle?.is_active
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              {toggling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : locationToToggle?.is_active ? (
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