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
  Scale,
  Settings2,
  Layers,
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
  { name: "Árbol", Icon: TreePine, value: "tree" },
  { name: "Gota", Icon: Droplet, value: "droplet" },
  { name: "Botella", Icon: Wine, value: "bottle" },
  { name: "Vaso", Icon: Coffee, value: "coffee" },
  { name: "Agua", Icon: Waves, value: "waves" },
  { name: "Periódico", Icon: Newspaper, value: "newspaper" },
  { name: "Libro", Icon: BookOpen, value: "book" },
  { name: "Archivo", Icon: Archive, value: "archive" },
  { name: "Documento", Icon: FileText, value: "file" },
  { name: "Laboratorio", Icon: FlaskConical, value: "flask" },
  { name: "Batería", Icon: Battery, value: "battery" },
  { name: "Energía", Icon: Zap, value: "zap" },
  { name: "Alerta", Icon: AlertOctagon, value: "alert" },
  { name: "Diamante", Icon: Gem, value: "gem" },
  { name: "Bombillo", Icon: Lightbulb, value: "bulb" },
  { name: "Computador", Icon: Laptop, value: "laptop" },
  { name: "Teléfono", Icon: Smartphone, value: "phone" },
  { name: "Cruz", Icon: Cross, value: "cross" },
  { name: "Píldora", Icon: Pill, value: "pill" },
];

const COLORS = [
  { name: "Verde Esmeralda", value: "#10b981" },
  { name: "Azul Rey", value: "#3b82f6" },
  { name: "Amarillo Sol", value: "#eab308" },
  { name: "Rojo Alerta", value: "#ef4444" },
  { name: "Cyan Brillante", value: "#06b6d4" },
  { name: "Negro Carbón", value: "#1f2937" },
  { name: "Marrón Tierra", value: "#8B4513" },
  { name: "Morado Místico", value: "#8b5cf6" },
  { name: "Gris Industrial", value: "#6b7280" },
];

export default function NewCategoryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string>("trash");
  const [selectedColor, setSelectedColor] = useState<string>("#ef4444");
  const [density, setDensity] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre de la categoría es obligatorio");
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
          toast.error("La densidad debe ser un número positivo");
          setSaving(false);
          return;
        }
        payload.density_kg_per_cubic_meter = densityNum;
      }

      await categoriesAPI.create(payload);

      toast.success(`Categoría "${name}" creada exitosamente`);
      router.push("/categories");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Error al crear la categoría";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const SelectedIconComponent = ICONS.find((i) => i.value === selectedIcon)?.Icon || Leaf;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Header y Acciones */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/categories">
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-2.5 py-1 rounded-md">
                  Gestión de Categorías
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tighter text-slate-950">
                Nueva Categoría de Residuos
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/categories">
              <Button variant="ghost" disabled={saving} className="h-12 px-6 rounded-xl font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                Cancelar
              </Button>
            </Link>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shadow-blue-200 transition-all"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {saving ? "Guardando..." : "Guardar Categoría"}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* GRID PRINCIPAL: 8 Columnas Formulario / 4 Columnas Vista Previa */}
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
                      Nombre de la Categoría <span className="text-red-500 text-sm">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Ej. Inorgánicos secos, Orgánicos, RPBI..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={saving}
                      maxLength={100}
                      className="h-14 text-lg rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                    <p className="text-xs font-medium text-slate-400 mt-2 text-right">
                      {name.length}/100 caracteres
                    </p>
                  </div>

                  {/* Protocolos */}
                  <div>
                    <Label htmlFor="description" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                      Descripción
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Ej. Residuos inorgánicos secos..."
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

                  {/* Densidad */}
                  <div>
                    <Label htmlFor="density" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                      Densidad Estimada (kg/m³)
                    </Label>
                    <div className="relative">
                      <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="density"
                        type="text"
                        placeholder="Ej. 650"
                        value={density}
                        onChange={(e) => setDensity(e.target.value)}
                        disabled={saving}
                        className="h-14 pl-12 text-base rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4 flex gap-3">
                      <Info className="w-5 h-5 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900 mb-1">Referencia de Densidades</p>
                        <p className="text-sm text-blue-700/80 leading-relaxed">
                          Orgánicos: <strong>500 kg/m³</strong> • Inorgánicos húmedos: <strong>500 kg/m³</strong> • Inorgánicos secos: <strong>200 kg/m³</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Tarjeta 2: Selector de Icono */}
                <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg font-bold text-slate-950">
                      <div className="p-1.5 bg-slate-900 text-white rounded-md">
                        <Settings2 className="w-4 h-4" />
                      </div>
                      Ícono Distintivo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-5 gap-3">
                      {ICONS.map(({ Icon, value, name }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSelectedIcon(value)}
                          disabled={saving}
                          className={cn(
                            "aspect-square rounded-xl flex items-center justify-center transition-all duration-200 border-2",
                            selectedIcon === value
                              ? "border-blue-600 bg-blue-50 shadow-md shadow-blue-100 scale-105 ring-4 ring-blue-500/10"
                              : "border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50 hover:scale-105"
                          )}
                          title={name}
                        >
                          <Icon
                            className="w-6 h-6 transition-colors"
                            style={{
                              color: selectedIcon === value ? selectedColor : "#94a3b8",
                            }}
                            strokeWidth={2.5}
                          />
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Tarjeta 3: Selector de Color */}
                <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg font-bold text-slate-950">
                      <div className="p-1.5 bg-slate-900 text-white rounded-md">
                        <Palette className="w-4 h-4" />
                      </div>
                      Color de Identificación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-5 gap-4 mb-6">
                      {COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setSelectedColor(color.value)}
                          disabled={saving}
                          className={cn(
                            "aspect-square rounded-full transition-all duration-200 relative",
                            selectedColor === color.value
                              ? "scale-110 ring-4 ring-offset-2 ring-blue-500/30"
                              : "hover:scale-110 shadow-sm"
                          )}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>

                    <div className="border-t border-slate-100 pt-5">
                      <Label htmlFor="custom-color" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                        Color Personalizado (HEX)
                      </Label>
                      <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all">
                        <input
                          id="custom-color"
                          type="color"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          disabled={saving}
                          className="h-10 w-12 rounded-lg cursor-pointer bg-transparent border-0 p-0 m-0"
                        />
                        <Input
                          type="text"
                          value={selectedColor.toLowerCase()}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          disabled={saving}
                          maxLength={7}
                          className="flex-1 font-mono font-bold text-slate-700 bg-transparent border-0 focus-visible:ring-0 shadow-none h-10 lowercase"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* COLUMNA DERECHA: VISTA PREVIA EXACTA AL DISEÑO */}
            <div className="xl:col-span-4 relative">
              <div className="sticky top-8 space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Vista Previa (Como en Menú)
                </h3>
                
                <Card className="rounded-3xl border border-slate-100 shadow-sm bg-white overflow-hidden p-2">
                  <CardContent className="p-6 md:p-8">
                    {/* Icono Superior */}
                    <div 
                      className="w-[84px] h-[84px] rounded-3xl flex items-center justify-center mb-6"
                      style={{ backgroundColor: `${selectedColor}10` }}
                    >
                      <SelectedIconComponent
                        className="w-10 h-10"
                        style={{ color: selectedColor }}
                        strokeWidth={2}
                      />
                    </div>

                    {/* Textos Principales */}
                    <div className="space-y-2.5 mb-8">
                      <h3 className="text-[28px] font-extrabold text-slate-900 leading-tight">
                        {name || "Nombre de categoría"}
                      </h3>
                      <p className="text-[17px] font-medium text-slate-500 leading-relaxed">
                        {description || "Descripción de la categoría"}
                      </p>
                    </div>

                    {/* Separador Fino */}
                    <div className="h-px w-full bg-slate-100 mb-6" />

                    {/* Cajas Inferiores */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Caja de Color */}
                      <div className="bg-[#f8fafc] rounded-2xl p-4 flex flex-col justify-center gap-2.5 border border-transparent">
                        <div className="flex items-center gap-1.5">
                          <Droplet className="w-4 h-4 text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Color</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: selectedColor }} 
                          />
                          <span className="text-base font-bold text-slate-700">
                            {selectedColor.toLowerCase()}
                          </span>
                        </div>
                      </div>

                      {/* Caja de Densidad */}
                      <div className="bg-[#f8fafc] rounded-2xl p-4 flex flex-col justify-center gap-2.5 border border-transparent">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Densidad</span>
                        </div>
                        <p className="text-base font-bold text-slate-700">
                          {density || "0"} kg/m³
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