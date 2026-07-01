"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Save,
  ArrowLeft,
  Loader2,
  User,
  Info,
  Building2,
  Sparkles,
  Mail,
  Phone,
  Key,
  MapPin,
  Sun,
  Sunset,
  Moon,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Campus } from "@/types";

const SHIFTS = [
  { value: "morning", label: "Mañana", icon: Sun, color: "text-amber-600" },
  { value: "afternoon", label: "Tarde", icon: Sunset, color: "text-orange-600" },
  { value: "night", label: "Noche", icon: Moon, color: "text-indigo-600" },
];

export default function NewCollectorPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingId, setLoadingId] = useState(false);

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [suggestedId, setSuggestedId] = useState<string>("");

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [campusCode, setCampusCode] = useState("");
  const [shift, setShift] = useState("");
  const [assignedSector, setAssignedSector] = useState("");

  useEffect(() => {
    loadCampuses();
  }, []);

  // Cuando cambia el campus, obtener el siguiente ID
  useEffect(() => {
    if (campusCode) {
      loadNextId(campusCode);
    } else {
      setSuggestedId("");
    }
  }, [campusCode]);

  const loadCampuses = async () => {
    try {
      setLoadingData(true);
      const data = await campusAPI.getAll();
      setCampuses(data);
    } catch (error: any) {
      toast.error("Error al cargar los campus");
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadNextId = async (code: string) => {
    try {
      setLoadingId(true);
      const data = await collectorsAPI.getNextId(code);
      setSuggestedId(data.employee_id);
    } catch (error: any) {
      toast.error("Error al generar el ID");
      console.error(error);
      setSuggestedId("");
    } finally {
      setLoadingId(false);
    }
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
    if (!campusCode) {
      toast.error("Debes seleccionar un campus");
      return;
    }
    if (!pin.trim()) {
      toast.error("El PIN es obligatorio");
      return;
    }
    if (pin.length < 4) {
      toast.error("El PIN debe tener al menos 4 dígitos");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("Los PINs no coinciden");
      return;
    }

    try {
      setSaving(true);

      const payload: any = {
        full_name: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        pin: pin.trim(),
        shift: shift || null,
        assigned_sector: assignedSector.trim() || null,
        campus_code: campusCode,
      };

      const created = await collectorsAPI.create(payload);

      toast.success(`Recolector "${created.full_name}" creado exitosamente`);
      router.push("/collectors");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Error al crear el recolector";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Iniciales para preview
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

  const selectedCampus = campuses.find((c) => c.code === campusCode);
  const selectedShift = SHIFTS.find((s) => s.value === shift);
  const ShiftIcon = selectedShift?.icon;

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
        <Link href="/collectors" className="hover:text-blue-600">
          Gestión de Recolectores
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Nuevo Recolector</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/collectors">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nuevo Recolector</h1>
            <p className="text-gray-600 mt-1">
              Registra un nuevo miembro del personal operativo
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/collectors">
            <Button variant="outline" disabled={saving}>
              Cancelar
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={saving || !campusCode}
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
                Guardar Recolector
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario - 2 columnas */}
          <div className="lg:col-span-2 space-y-6">
            {/* ID Autogenerado */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  ID de Empleado Autogenerado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-white border-2 border-blue-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">ID de empleado</p>
                      <p className="font-mono font-bold text-2xl text-gray-900">
                        {loadingId ? (
                          <span className="text-gray-400 flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generando...
                          </span>
                        ) : suggestedId ? (
                          suggestedId
                        ) : (
                          <span className="text-gray-400">REC-???-???</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {suggestedId && !loadingId && (
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                      ✓ Disponible
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  <strong>El ID se genera automáticamente</strong> según el campus asignado.
                  Selecciona primero un campus para ver el ID que se asignará.
                </p>
              </CardContent>
            </Card>

            {/* Información personal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">
                    Nombre Completo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="Ej. Juan Pérez García"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={saving}
                    maxLength={150}
                  />
                  <p className="text-xs text-gray-500">
                    {fullName.length}/150 caracteres
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Ej. juan.perez@umar.mx"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={saving}
                        maxLength={100}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Ej. 958 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={saving}
                        maxLength={20}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credenciales de Acceso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-600" />
                  Credenciales de Acceso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pin">
                      PIN de Acceso <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="pin"
                        type={showPin ? "text" : "password"}
                        placeholder="Mínimo 4 dígitos"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        disabled={saving}
                        maxLength={10}
                        className="pr-10 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showPin ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Entre 4 y 10 caracteres
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_pin">
                      Confirmar PIN <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="confirm_pin"
                      type={showPin ? "text" : "password"}
                      placeholder="Repite el PIN"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      disabled={saving}
                      maxLength={10}
                      className="font-mono"
                    />
                    {confirmPin && pin !== confirmPin && (
                      <p className="text-xs text-red-500">Los PINs no coinciden</p>
                    )}
                    {confirmPin && pin === confirmPin && pin.length >= 4 && (
                      <p className="text-xs text-green-600">✓ PINs coinciden</p>
                    )}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-xs text-amber-900">
                    <strong>⚠ Importante:</strong> Este PIN será el que el recolector use
                    para iniciar sesión en la app móvil. Compárteselo de forma segura.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Asignación operativa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Asignación Operativa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campus">
                    Campus <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={campusCode}
                    onValueChange={setCampusCode}
                    disabled={saving}
                  >
                    <SelectTrigger id="campus">
                      <SelectValue placeholder="Selecciona el campus" />
                    </SelectTrigger>
                    <SelectContent>
                      {campuses.map((campus) => (
                        <SelectItem key={campus.id} value={campus.code}>
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
                    El recolector será asignado a este campus principalmente
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shift">Turno</Label>
                    <Select value={shift} onValueChange={setShift} disabled={saving}>
                      <SelectTrigger id="shift">
                        <SelectValue placeholder="Selecciona un turno" />
                      </SelectTrigger>
                      <SelectContent>
                        {SHIFTS.map((s) => {
                          const Icon = s.icon;
                          return (
                            <SelectItem key={s.value} value={s.value}>
                              <div className="flex items-center gap-2">
                                <Icon className={cn("w-4 h-4", s.color)} />
                                <span>{s.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigned_sector">Sector Asignado</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="assigned_sector"
                        type="text"
                        placeholder="Ej. Zona Norte"
                        value={assignedSector}
                        onChange={(e) => setAssignedSector(e.target.value)}
                        disabled={saving}
                        maxLength={100}
                        className="pl-10"
                      />
                    </div>
                  </div>
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
                <div className="bg-white rounded-lg border-2 border-blue-100 p-4">
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-14 h-14 border-2 border-blue-200">
                      <AvatarFallback className="bg-blue-600 text-white font-semibold text-lg">
                        {getInitials(fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">
                        {fullName || "Nombre del Recolector"}
                      </h3>
                      <p className="text-xs font-mono text-gray-500">
                        {suggestedId || "REC-???-???"}
                      </p>
                    </div>
                  </div>

                  {/* Contacto */}
                  <div className="space-y-1.5 mb-3 pb-3 border-b border-gray-100">
                    {email ? (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{email}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Sin email</p>
                    )}
                    {phone && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Asignación */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-700 font-medium">
                        {selectedCampus?.name || "Sin campus"}
                      </span>
                    </div>
                    {assignedSector && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-700 truncate">
                          {assignedSector}
                        </span>
                      </div>
                    )}
                    {selectedShift && ShiftIcon && (
                      <div className="flex items-center gap-2">
                        <ShiftIcon className={cn("w-4 h-4", selectedShift.color)} />
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                          Turno {selectedShift.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 italic text-center">
                  Así se verá en la lista de recolectores
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}