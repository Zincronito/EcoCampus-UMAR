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
  Droplets,
  Layers
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
        await categoriesAPI.update(categoryToToggle.id, { is_active: true });
        toast.success(`Categoría "${categoryToToggle.name}" reactivada con éxito`);
      } else {
        await categoriesAPI.delete(categoryToToggle.id);
        toast.success(`Categoría "${categoryToToggle.name}" desactivada`);
      }
      setCategoryToToggle(null);
      await loadCategories();
    } catch (error: any) {
      toast.error(isActivating ? "Error al reactivar" : "Error al desactivar");
      console.error(error);
    } finally {
      setToggling(false);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && cat.is_active) ||
      (filter === "inactive" && !cat.is_active);
    return matchesSearch && matchesFilter;
  });

  const activeCount = categories.filter((c) => c.is_active).length;
  const inactiveCount = categories.filter((c) => !c.is_active).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      
      {/* HEADER AJUSTADO (Más compacto) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-5 mb-6">
        <div className="space-y-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 px-3 py-1 font-bold tracking-wide uppercase">
            Catálogo del Sistema
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Categorías de Residuos
          </h1>
          <p className="text-slate-500 font-medium text-base max-w-xl">
            Controla las clasificaciones y métricas base para la recolección en todo el campus.
          </p>
        </div>
        
        <Link href="/categories/new">
          <Button className="h-12 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95">
            <Plus className="w-5 h-5 mr-2" strokeWidth={3} />
            Crear Categoría
          </Button>
        </Link>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-white p-2 rounded-full shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-2 mb-10">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Busca por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-6 rounded-full border-none bg-transparent shadow-none focus-visible:ring-0 text-lg font-medium text-slate-700 placeholder:text-slate-400"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto p-1 overflow-x-auto">
          <Button
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-full px-6 py-6 font-bold transition-colors",
              filter === "all" ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-transparent text-slate-500 hover:bg-slate-100"
            )}
          >
            Todas ({categories.length})
          </Button>
          <Button
            onClick={() => setFilter("active")}
            className={cn(
              "rounded-full px-6 py-6 font-bold transition-colors",
              filter === "active" ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-transparent text-slate-500 hover:bg-slate-100"
            )}
          >
            Activas ({activeCount})
          </Button>
          <Button
            onClick={() => setFilter("inactive")}
            className={cn(
              "rounded-full px-6 py-6 font-bold transition-colors",
              filter === "inactive" ? "bg-rose-500 text-white hover:bg-rose-600" : "bg-transparent text-slate-500 hover:bg-slate-100"
            )}
          >
            Inactivas ({inactiveCount})
          </Button>
        </div>
      </div>

      {/* ESTADO DE CARGA Y VACÍOS */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
          <p className="text-slate-500 font-bold text-lg">Cargando base de datos...</p>
        </div>
      )}

      {!loading && filteredCategories.length === 0 && categories.length > 0 && (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center max-w-2xl mx-auto mt-12">
          <div className="bg-slate-50 p-6 rounded-full mb-6">
            <Search className="w-12 h-12 text-slate-300" strokeWidth={3} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Sin resultados</h3>
          <p className="text-slate-500 font-medium">No encontramos ninguna categoría que coincida con tu búsqueda actual.</p>
        </div>
      )}

      {/* GRID MÁGICO DE CATEGORÍAS (Máximo 3 columnas y tarjetas más espaciosas) */}
      {!loading && filteredCategories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className={cn(
                "group relative bg-white rounded-3xl p-8 border transition-all duration-300",
                category.is_active 
                  ? "border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1" 
                  : "border-dashed border-slate-200 bg-slate-50/50 grayscale-[50%] hover:grayscale-0"
              )}
            >
              {/* Badge Inactivo flotante */}
              {!category.is_active && (
                <div className="absolute -top-3 -right-3 z-10">
                  <span className="bg-rose-500 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-md shadow-rose-500/20">
                    INACTIVA
                  </span>
                </div>
              )}

              {/* Cabecera de la Tarjeta */}
              <div className="flex justify-between items-start mb-6">
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: `${category.color}15` }}
                >
                  <CategoryIcon 
                    icon={category.icon} 
                    size={40} 
                    color={category.color} 
                  />
                </div>
                
                {/* Botones de Acción */}
                <div className="flex gap-1.5 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/categories/${category.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-slate-50 text-slate-600 hover:text-blue-600 hover:bg-blue-50">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setCategoryToToggle(category)}
                    className={cn(
                      "h-10 w-10 rounded-full bg-slate-50",
                      category.is_active ? "text-slate-600 hover:text-rose-600 hover:bg-rose-50" : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                    )}
                  >
                    {category.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Cuerpo de la Tarjeta */}
              <div className="mb-6">
                <h3 className="text-2xl font-black text-slate-900 mb-2 truncate" title={category.name}>
                  {category.name}
                </h3>
                <p className="text-base text-slate-500 font-medium line-clamp-2 min-h-[3rem]">
                  {category.description || "Sin descripción proporcionada."}
                </p>
              </div>

              {/* Footer de la Tarjeta (Métricas) */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5" /> Color
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: category.color }} />
                    <span className="text-sm font-bold text-slate-700 truncate">{category.color}</span>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Densidad
                  </p>
                  <span className="text-sm font-bold text-slate-700">
                    {category.density_kg_per_cubic_meter ? `${category.density_kg_per_cubic_meter} kg/m³` : "N/D"}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Tarjeta para Agregar Nueva Categoría */}
          {filter !== "inactive" && (
            <Link href="/categories/new" className="block h-full group">
              <div className="h-full min-h-[340px] border-2 border-dashed border-slate-200 hover:border-blue-400 bg-transparent hover:bg-blue-50/50 transition-colors rounded-3xl flex flex-col items-center justify-center p-8 text-center cursor-pointer">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-blue-600 transition-all">
                  <Plus className="w-10 h-10 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-black text-slate-700 group-hover:text-blue-700">Nueva Categoría</h3>
                <p className="text-base text-slate-500 font-medium mt-2">Configura un nuevo tipo de residuo</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      <AlertDialog open={!!categoryToToggle} onOpenChange={() => setCategoryToToggle(null)}>
        <AlertDialogContent className="rounded-3xl p-8 border-0 shadow-2xl max-w-md">
          <AlertDialogHeader className="mb-4">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-4",
              categoryToToggle?.is_active ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
            )}>
              {categoryToToggle?.is_active ? <AlertTriangle className="w-6 h-6" /> : <Power className="w-6 h-6" />}
            </div>
            <AlertDialogTitle className="text-2xl font-black text-slate-900">
              {categoryToToggle?.is_active ? "¿Desactivar categoría?" : "Reactivar categoría"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-slate-600 font-medium pt-2">
              {categoryToToggle?.is_active ? (
                <>
                  La categoría <strong className="text-slate-900">"{categoryToToggle?.name}"</strong> dejará de estar disponible para nuevos reportes, pero su historial se mantendrá intacto.
                </>
              ) : (
                <>
                  La categoría <strong className="text-slate-900">"{categoryToToggle?.name}"</strong> volverá a estar activa y visible en todas las operaciones del campus.
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
                categoryToToggle?.is_active ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {toggling ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
              ) : categoryToToggle?.is_active ? (
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