"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Save,
  ArrowLeft,
  Loader2,
  Recycle,
  Trash2,
  Leaf,
  FlaskConical,
  Droplet,
  Apple,
  Zap,
  Archive,
  Newspaper,
  Palette,
  Info,
  ShoppingBag,
  Package,
  Sprout,
  TreePine,
  Wine,
  Coffee,
  Waves,
  BookOpen,
  FileText,
  Battery,
  AlertOctagon,
  Gem,
  Lightbulb,
  Laptop,
  Smartphone,
  Cross,
  Pill,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { categoriesAPI } from "@/lib/api";

const ICONS = [
  { name: "Reciclaje", Icon: Recycle, value: "recycle" },
  { name: "Basura", Icon: Trash2, value: "trash" },
  { name: "Bolsa", Icon: ShoppingBag, value: "bag" },
  { name: "Caja", Icon: Package, value: "package" },
  { name: "Hoja", Icon: Leaf, value: "leaf" },
  { name: "Manzana", Icon: Apple, value: "apple" },
  { name: "Hierba", Icon: Sprout, value: "sprout" },
  { name: "Arbol", Icon: TreePine, value: "tree" },
  { name: "Gota", Icon: Droplet, value: "droplet" },
  { name: "Botella", Icon: Wine, value: "bottle" },
  { name: "Vaso", Icon: Coffee, value: "coffee" },
  { name: "Agua", Icon: Waves, value: "waves" },
  { name: "Periodico", Icon: Newspaper, value: "newspaper" },
  { name: "Libro", Icon: BookOpen, value: "book" },
  { name: "Archivo", Icon: Archive, value: "archive" },
  { name: "Documento", Icon: FileText, value: "file" },
  { name: "Laboratorio", Icon: FlaskConical, value: "flask" },
  { name: "Bateria", Icon: Battery, value: "battery" },
  { name: "Energia", Icon: Zap, value: "zap" },
  { name: "Alerta", Icon: AlertOctagon, value: "alert" },
  { name: "Diamante", Icon: Gem, value: "gem" },
  { name: "Bombillo", Icon: Lightbulb, value: "bulb" },
  { name: "Computador", Icon: Laptop, value: "laptop" },
  { name: "Telefono", Icon: Smartphone, value: "phone" },
  { name: "Cruz", Icon: Cross, value: "cross" },
  { name: "Pildora", Icon: Pill, value: "pill" },
];

const COLORS = [
  { name: "Verde", value: "#10b981" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Amarillo", value: "#eab308" },
  { name: "Rojo", value: "#ef4444" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Negro", value: "#1f2937" },
  { name: "Marron", value: "#8B4513" },
  { name: "Morado", value: "#8b5cf6" },
  { name: "Gris", value: "#6b7280" },
];

export default function NewCategoryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string>("leaf");
  const [selectedColor, setSelectedColor] = useState<string>("#10b981");
  const [density, setDensity] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre de la categoria es obligatorio");
      return;
    }

    if (name.length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres");
      return;
    }

    try {
      setSaving(true);

      const payload: any = {
        name: name.trim(),
        description: description.trim() || null,
        color: selectedColor,
        icon: selectedIcon,
      };

      if (density.trim() !== "") {
        const densityNum = parseFloat(density.replace(",", "."));
        if (isNaN(densityNum) || densityNum < 0) {
          toast.error("La densidad debe ser un numero positivo");
          setSaving(false);
          return;
        }
        payload.density_kg_per_liter = densityNum;
      }

      await categoriesAPI.create(payload);

      toast.success(`Categoria "${name}" creada exitosamente`);
      router.push("/categories");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Error al crear la categoria";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const SelectedIconComponent = ICONS.find((i) => i.value === selectedIcon)?.Icon || Leaf;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/categories" className="hover:text-blue-600">
          Gestion de Categorias
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Nueva Categoria</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/categories">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nueva Categoria de Residuos</h1>
            <p className="text-gray-600 mt-1">
              Crea una nueva clasificacion de residuos con sus protocolos
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/categories">
            <Button variant="outline" disabled={saving}>
              Cancelar
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={saving}
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
                Guardar Categoria
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* FILA 1: Informacion Basica + Vista Previa */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informacion basica - 2 columnas */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Informacion Basica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nombre de la Categoria <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ej. Plasticos Especiales, Vidrio, RPBI..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={saving}
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500">{name.length}/100 caracteres</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Protocolos de Manejo y Descripcion
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Especifique los procedimientos de recoleccion, manejo y seguridad de este tipo de residuo..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={saving}
                    rows={5}
                    maxLength={500}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500">
                    {description.length}/500 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="density">
                    Densidad Estimada (kg/L)
                  </Label>
                  <Input
                    id="density"
                    type="text"
                    placeholder="Ej. 0.5"
                    value={density}
                    onChange={(e) => setDensity(e.target.value)}
                    disabled={saving}
                  />
                  <p className="text-xs text-gray-500">
                    Densidad aproximada del residuo. Se usa para calculos volumetricos en el dashboard.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
                    <p className="text-xs text-blue-900">
                      <strong>Referencia:</strong> Organicos: 0.5 kg/L, Inorganicos
                      humedos: 0.5 kg/L, Inorganicos secos: 0.2 kg/L
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vista Previa - 1 columna sticky */}
          <div>
            <Card className="bg-gradient-to-br from-blue-50 to-white sticky top-6">
              <CardHeader>
                <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Vista Previa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="bg-white rounded-lg border-2 p-4 transition-all"
                  style={{ borderColor: `${selectedColor}40` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${selectedColor}20` }}
                    >
                      <SelectedIconComponent
                        className="w-7 h-7"
                        style={{ color: selectedColor }}
                        strokeWidth={2}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">
                        {name || "Nombre de Categoria"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {density ? `Densidad: ${density} kg/L` : "Sin densidad definida"}
                      </p>
                    </div>
                  </div>
                  {description && (
                    <p className="text-xs text-gray-600 line-clamp-3 mt-2 pt-2 border-t border-gray-100">
                      {description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: selectedColor }}
                      />
                      <span className="text-xs font-mono text-gray-500">
                        {selectedColor}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 italic text-center">
                  Asi se vera en la lista de categorias
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FILA 2: Iconos + Colores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selector de Icono */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Recycle className="w-5 h-5 text-blue-600" />
                Icono Distintivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 sm:grid-cols-7 gap-2">
                {ICONS.map(({ Icon, value, name }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedIcon(value)}
                    disabled={saving}
                    className={cn(
                      "aspect-square rounded-lg border-2 flex items-center justify-center transition-all",
                      selectedIcon === value
                        ? "border-blue-600 bg-blue-50 scale-105"
                        : "border-gray-200 hover:border-gray-300 bg-gray-50 hover:scale-105"
                    )}
                    title={name}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{
                        color: selectedIcon === value ? selectedColor : "#6b7280",
                      }}
                      strokeWidth={2}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Selecciona el icono que mejor represente este tipo de residuo.
              </p>
            </CardContent>
          </Card>

          {/* Selector de Color */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-600" />
                Color de Identificacion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 mb-4">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    disabled={saving}
                    className={cn(
                      "aspect-square rounded-lg border-4 transition-all",
                      selectedColor === color.value
                        ? "border-blue-600 scale-110"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>

              <div className="border-t pt-4">
                <Label htmlFor="custom-color" className="text-sm">
                  O elige un color personalizado
                </Label>
                <div className="flex gap-2 mt-2">
                  <input
                    id="custom-color"
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    disabled={saving}
                    className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    disabled={saving}
                    maxLength={7}
                    className="flex-1 font-mono"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-3 italic">
                Este color se utilizara en los mapas de rutas y reportes analiticos.
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}