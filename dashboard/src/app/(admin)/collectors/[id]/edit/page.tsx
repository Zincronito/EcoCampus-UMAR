"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Save,
  ArrowLeft,
  Loader2,
  User,
  Info,
  Building2,
  Mail,
  Phone,
  Key,
  MapPin,
  Sun,
  Sunset,
  Moon,
  Eye,
  EyeOff,
  Clock,
  IdCard,
  ShieldCheck,
  Badge
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { collectorsAPI, campusAPI } from "@/lib/api";
import type { Campus, Collector } from "@/types";

// Le agregamos el HEX para la magia del Aura en la vista previa
const SHIFTS = [
  { value: "morning", label: "Mañana", icon: Sun, color: "text-amber-600", hex: "#f59e0b" },
  { value: "afternoon", label: "Tarde", icon: Sunset, color: "text-orange-600", hex: "#f97316" },
  { value: "night", label: "Noche", icon: Moon, color: "text-indigo-600", hex: "#6366f1" },
];

export default function EditCollectorPage() {
  const router = useRouter();
  const params = useParams();
  const collectorId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [originalCollector, setOriginalCollector] = useState<Collector | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shift, setShift] = useState("");
  const [assignedSector, setAssignedSector] = useState("");

  // PIN change state
  const [changePin, setChangePin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    loadData();
  }, [collectorId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [collectorData, campusData] = await Promise.all([
        collectorsAPI.getById(collectorId),
        campusAPI.getAll(),
      ]);

      setOriginalCollector(collectorData);
      setFullName(collectorData.full_name);
      setEmail(collectorData.email || "");
      setPhone(collectorData.phone || "");
      setShift(collectorData.shift || "");
      setAssignedSector(collectorData.assigned_sector || "");
      setCampuses(campusData);
    } catch (error: any) {
      toast.error("Error al cargar el recolector");
      console.error(error);
      router.push("/collectors");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    if (!originalCollector) return false;

    const dataChanges =
      fullName.trim() !== originalCollector.full_name ||
      email.trim() !== (originalCollector.email || "") ||
      phone.trim() !== (originalCollector.phone || "") ||
      shift !== (originalCollector.shift || "") ||
      assignedSector.trim() !== (originalCollector.assigned_sector || "");

    const pinChange = changePin && newPin.length >= 4;

    return dataChanges || pinChange;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("El nombre completo es obligatorio");
      return;
    }
    if (fullName.trim().length < 3) {
      toast.error("El nombre debe tener al menos 3 caracteres");
      return;
    }

    // Validar PIN si se va a cambiar
    if (changePin) {
      if (!newPin.trim()) {
        toast.error("Debes ingresar el nuevo PIN");
        return;
      }
      if (newPin.length < 4) {
        toast.error("El PIN debe tener al menos 4 dígitos");
        return;
      }
      if (newPin !== confirmPin) {
        toast.error("Los PINs no coinciden");
        return;
      }
    }

    if (!hasChanges()) {
      toast.info("No has realizado cambios");
      return;
    }

    try {
      setSaving(true);

      const payload: any = {
        full_name: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        shift: shift || null,
        assigned_sector: assignedSector.trim() || null,
      };

      // Solo incluir PIN si se va a cambiar
      if (changePin && newPin.trim()) {
        payload.pin = newPin.trim();
      }

      await collectorsAPI.update(collectorId, payload);

      toast.success(`Perfil de "${fullName}" actualizado exitosamente`);
      router.push("/collectors");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Error al actualizar el recolector";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string): string => {
    if (!name.trim()) return "??";
    return name
      .trim()
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getCampusFromId = (empId: string): Campus | undefined => {
    const parts = empId.split("-");
    if (parts.length < 2) return undefined;
    const code = parts[1];
    return campuses.find((c) => c.code === code);
  };

  const collectorCampus = originalCollector
    ? getCampusFromId(originalCollector.employee_id)
    : undefined;
  const selectedShift = SHIFTS.find((s) => s.value === shift);
  const ShiftIcon = selectedShift?.icon;

  // Color dinámico para la tarjeta de previsualización
  const themeColor = selectedShift?.hex || "#94a3b8";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <span className="text-slate-500 font-bold text-lg block text-center w-full">Cargando perfil...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans pb-24">
      
      {/* HEADER TOP-TIER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">
            <Link href="/collectors" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Equipo
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900">Editar</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Editar Perfil
            </h1>
            <Badge className="bg-blue-100 text-blue-800 border-none font-mono text-base px-3 py-1">
              {originalCollector?.employee_id}
            </Badge>
          </div>
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <Link href="/collectors" className="flex-1 lg:flex-none">
            <Button variant="outline" disabled={saving} className="w-full rounded-full h-12 px-6 font-bold border-slate-200 text-slate-600 hover:bg-slate-50">
              Cancelar
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={saving || !hasChanges()}
            className="flex-1 lg:flex-none h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {saving ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Guardando</>
            ) : (
              <><Save className="w-5 h-5 mr-2" /> Guardar Cambios</>
            )}
          </Button>
        </div>
      </div>

      {/* BANNER DE CAMBIOS SIN GUARDAR */}
      <div className={cn(
        "mb-8 overflow-hidden transition-all duration-500",
        hasChanges() ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-amber-100 p-2.5 rounded-full shrink-0">
            <Info className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900">Modificaciones detectadas</p>
            <p className="text-sm text-amber-700">Recuerda presionar "Guardar Cambios" para aplicar la nueva configuración.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: FORMULARIO */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* SECCIÓN 1: Información Personal */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  <User className="w-5 h-5 text-slate-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Datos Personales</h2>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Nombre Completo <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="Ej. Juan Pérez García"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={saving}
                    maxLength={150}
                    className="h-14 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 text-base font-medium px-5"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="juan.perez@umar.mx"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={saving}
                        maxLength={100}
                        className="h-14 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 text-base font-medium pl-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="958 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={saving}
                        maxLength={20}
                        className="h-14 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 text-base font-medium pl-12"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: Cambio de PIN */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 relative z-10">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  <Key className="w-5 h-5 text-slate-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Seguridad Móvil</h2>
              </div>
              
              <div className="space-y-5 relative z-10">
                {!changePin ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-500">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Acceso Protegido</p>
                        <p className="text-sm text-slate-500 font-medium">El PIN actual está oculto por seguridad.</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setChangePin(true)}
                      disabled={saving}
                      className="rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold w-full sm:w-auto shadow-sm"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Modificar PIN
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 flex items-start sm:items-center justify-between gap-4">
                      <p className="text-sm font-medium text-blue-900">
                        Ingresa el nuevo código. Al guardar, el operador deberá usar este nuevo PIN.
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setChangePin(false);
                          setNewPin("");
                          setConfirmPin("");
                        }}
                        disabled={saving}
                        className="text-blue-700 hover:bg-blue-100 rounded-full shrink-0"
                      >
                        Cancelar cambio
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="new_pin" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Nuevo PIN <span className="text-rose-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="new_pin"
                            type={showPin ? "text" : "password"}
                            placeholder="Ej. 1234"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            disabled={saving}
                            maxLength={10}
                            className="h-14 rounded-xl bg-white border-none ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 text-lg font-black font-mono tracking-widest px-5 pr-12 shadow-inner"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-md p-1 shadow-sm border border-slate-200"
                            tabIndex={-1}
                          >
                            {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm_pin" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Confirmar PIN <span className="text-rose-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirm_pin"
                            type={showPin ? "text" : "password"}
                            placeholder="Repite el nuevo PIN"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value)}
                            disabled={saving}
                            maxLength={10}
                            className={cn(
                              "h-14 rounded-xl bg-white border-none ring-1 focus-visible:ring-2 text-lg font-black font-mono tracking-widest px-5 shadow-inner",
                              confirmPin && newPin !== confirmPin ? "ring-rose-300 focus-visible:ring-rose-500 bg-rose-50" : "ring-slate-200 focus-visible:ring-blue-500",
                              confirmPin && newPin === confirmPin && newPin.length >= 4 && "ring-emerald-300 focus-visible:ring-emerald-500 bg-emerald-50 text-emerald-900"
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 3: Asignación Operativa */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  <Building2 className="w-5 h-5 text-slate-600" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Operaciones en Campo</h2>
              </div>
              
              <div className="space-y-6">
                
                {/* Placa Inmutable del Campus */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campus Base Asignado</Label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center border border-slate-100 shrink-0">
                      <Building2 className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-lg">
                        {collectorCampus ? `${collectorCampus.name} (${collectorCampus.code})` : "Campus desconocido"}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Este dato está anclado a la matrícula operativa y no se puede modificar.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="shift" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Turno Laboral</Label>
                    <Select value={shift} onValueChange={setShift} disabled={saving}>
                      <SelectTrigger id="shift" className="h-14 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 text-base font-medium px-5">
                        <SelectValue placeholder="Asignar turno" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {SHIFTS.map((s) => {
                          const Icon = s.icon;
                          return (
                            <SelectItem key={s.value} value={s.value} className="font-medium">
                              <div className="flex items-center gap-2">
                                <Icon className={cn("w-4 h-4", s.color)} />
                                {s.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigned_sector" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sector Específico</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="assigned_sector"
                        type="text"
                        placeholder="Ej. Zona Norte"
                        value={assignedSector}
                        onChange={(e) => setAssignedSector(e.target.value)}
                        disabled={saving}
                        maxLength={100}
                        className="h-14 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 text-base font-medium pl-12"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: VISTA PREVIA (Sticky) */}
          <div className="xl:col-span-1 xl:sticky xl:top-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 ml-2">
              <Eye className="w-4 h-4" /> Tarjeta de Previsualización
            </h3>
            
            {/* RÉPLICA EXACTA DEL DASHBOARD */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden transition-all duration-300">
              {/* Aura y línea de color */}
              <div 
                className="absolute top-0 left-0 w-full h-2 transition-all duration-500"
                style={{ backgroundColor: themeColor }} 
              />
              <div 
                className="absolute top-0 left-0 w-full h-32 opacity-10 blur-3xl pointer-events-none transition-all duration-500"
                style={{ backgroundColor: themeColor }} 
              />

              {/* Cabecera (Avatar + Nombre + ID) */}
              <div className="flex justify-between items-start mb-6 pt-2">
                <div className="flex gap-4 items-center">
                  <Avatar className="w-16 h-16 border-2 shadow-sm transition-colors duration-500" style={{ borderColor: `${themeColor}40` }}>
                    <AvatarFallback className="text-white font-bold text-xl transition-colors duration-500" style={{ backgroundColor: themeColor }}>
                      {getInitials(fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 max-w-[200px]">
                    <h3 className={cn("text-xl font-black tracking-tight truncate pb-0.5", fullName ? "text-slate-900" : "text-slate-300")}>
                      {fullName || "Nombre Operador"}
                    </h3>
                    <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-0.5 rounded-md text-xs font-bold text-slate-600 font-mono mt-1">
                      ID: {originalCollector?.employee_id}
                    </div>
                  </div>
                </div>
              </div>

              {/* Info de contacto */}
              <div className="space-y-2.5 mb-6 relative z-10">
                {email ? (
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="truncate">{email}</span>
                  </div>
                ) : (
                  <div className="h-8 flex items-center gap-3 text-sm italic text-slate-300">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <Mail className="w-4 h-4 text-slate-200" />
                    </div>
                    Sin correo capturado
                  </div>
                )}
                
                {phone ? (
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </div>
                    <span>{phone}</span>
                  </div>
                ) : (
                  <div className="h-8 flex items-center gap-3 text-sm italic text-slate-300">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <Phone className="w-4 h-4 text-slate-200" />
                    </div>
                    Sin teléfono capturado
                  </div>
                )}
              </div>

              {/* Footer (Asignación y Turno) */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 relative z-10">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Asignación
                  </p>
                  <span className={cn("text-sm font-bold truncate block", collectorCampus ? "text-slate-800" : "text-slate-300")}>
                    {collectorCampus?.name || "Sin Campus"}
                  </span>
                  {assignedSector && (
                    <span className="text-xs font-medium text-slate-500 truncate block mt-0.5">
                      {assignedSector}
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Turno
                  </p>
                  {selectedShift && ShiftIcon ? (
                    <div className="flex items-center gap-2">
                      <ShiftIcon className="w-4 h-4 transition-colors duration-500" style={{ color: themeColor }} />
                      <span className="text-sm font-bold text-slate-800">{selectedShift.label}</span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-slate-300">No asignado</span>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 text-center mt-4 font-medium">
              Los cambios se reflejarán en vivo al editar.
            </p>
          </div>

        </div>
      </form>
    </div>
  );
}