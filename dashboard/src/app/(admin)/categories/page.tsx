"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Loader2,
  Leaf,
  PowerOff,
  Power,
  AlertTriangle,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

import { categoriesAPI } from "@/lib/api";
import CategoryIcon from "@/components/shared/CategoryIcon";
import type { WasteCategory } from "@/types";

type FilterType = "all" | "active" | "inactive";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [categoryToToggle, setCategoryToToggle] = useState<WasteCategory | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      // Traemos TODAS (activas e inactivas)
      const data = await categoriesAPI.getAll(false);
      setCategories(data);
    } catch (error: any) {
      toast.error("Error al cargar las categorías");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!categoryToToggle) return;

    const isActivating = !categoryToToggle.is_active;

    try {
      setToggling(true);

      if (isActivating) {
        // Reactivar: usar PATCH para cambiar is_active a true
        await categoriesAPI.update(categoryToToggle.id, { is_active: true });
        toast.success(`Categoría "${categoryToToggle.name}" reactivada`);
      } else {
        // Desactivar: usar DELETE (soft delete)
        await categoriesAPI.delete(categoryToToggle.id);
        toast.success(`Categoría "${categoryToToggle.name}" desactivada`);
      }

      setCategoryToToggle(null);
      await loadCategories();
    } catch (error: any) {
      toast.error(
        isActivating
          ? "Error al reactivar la categoría"
          : "Error al desactivar la categoría"
      );
      console.error(error);
    } finally {
      setToggling(false);
    }
  };

  // Filtrado combinado: búsqueda + estado activo/inactivo
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && cat.is_active) ||
      (filter === "inactive" && !cat.is_active);
    return matchesSearch && matchesFilter;
  });

  // Stats
  const activeCount = categories.filter((c) => c.is_active).length;
  const inactiveCount = categories.filter((c) => !c.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Categorías</h1>
          <p className="text-gray-600 mt-1">
            Administra las clasificaciones de residuos y sus protocolos de recolección.
          </p>
        </div>
        <Link href="/categories/new">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Dar de alta categoría
          </Button>
        </Link>
      </div>

      {/* Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            Todas ({categories.length})
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
          <span className="ml-3 text-gray-600">Cargando categorías...</span>
        </div>
      )}

      {/* Empty states */}
      {!loading && filteredCategories.length === 0 && categories.length > 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No se encontraron categorías con los filtros actuales</p>
          </CardContent>
        </Card>
      )}

      {!loading && categories.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Leaf className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">No hay categorías registradas</p>
            <Link href="/categories/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Crear primera categoría
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Grid de categorías */}
      {!loading && filteredCategories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card
              key={category.id}
              className={cn(
                "transition-all relative",
                category.is_active
                  ? "hover:shadow-lg"
                  : "opacity-60 grayscale hover:opacity-80"
              )}
            >
              {/* Badge de inactivo */}
              {!category.is_active && (
                <div className="absolute top-3 right-3 z-10">
                  <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                    Inactiva
                  </Badge>
                </div>
              )}

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  {/* Icon con color de fondo */}
                  <div
                    className="w-14 h-14 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: `${category.color}20`,
                    }}
                  >
                    <CategoryIcon
                      icon={category.icon}
                      size={28}
                      color={category.color}
                    />
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-1">
                    <Link href={`/categories/${category.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-blue-600"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    {category.is_active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-red-600"
                        onClick={() => setCategoryToToggle(category)}
                        title="Desactivar"
                      >
                        <PowerOff className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-green-600"
                        onClick={() => setCategoryToToggle(category)}
                        title="Reactivar"
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Información */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3 min-h-[3.75rem]">
                  {category.description || "Sin descripción"}
                </p>

                {/* Color y densidad */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      {category.color}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Densidad:{" "}
                    <span className="font-semibold text-gray-900">
                      {category.density_kg_per_cubic_meter
                        ? `${category.density_kg_per_cubic_meter} kg/m³`
                        : "Sin definir"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Card de "Nueva Categoría" - solo si estamos en "Todas" o "Activas" */}
          {filter !== "inactive" && (
            <Link href="/categories/new">
              <Card className="border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer h-full">
                <CardContent className="flex flex-col items-center justify-center py-12 h-full">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Plus className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-semibold">Nueva Categoría</p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      )}

      {/* Footer con stats */}
      {!loading && categories.length > 0 && (
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
              <span className="font-semibold text-gray-900">{categories.length}</span> Total
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Sistema Operativo</span>
          </div>
        </div>
      )}

      {/* Dialog de confirmación */}
      <AlertDialog open={!!categoryToToggle} onOpenChange={() => setCategoryToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {categoryToToggle?.is_active ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  ¿Desactivar categoría?
                </>
              ) : (
                <>
                  <Power className="w-5 h-5 text-green-600" />
                  ¿Reactivar categoría?
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToToggle?.is_active ? (
                <>
                  La categoría <strong>"{categoryToToggle?.name}"</strong> dejará de
                  aparecer en las listas operativas, pero todos los datos asociados (contenedores
                  y reportes históricos) se mantendrán intactos. Podrás reactivarla en cualquier
                  momento.
                </>
              ) : (
                <>
                  La categoría <strong>"{categoryToToggle?.name}"</strong> volverá a estar
                  disponible en todas las listas operativas del sistema.
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
                categoryToToggle?.is_active
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              {toggling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : categoryToToggle?.is_active ? (
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