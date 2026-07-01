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
import type { Campus, Collector } from "@/types";

const SHIFTS = [
  { value: "morning", label: "Mañana", icon: Sun, color: "text-amber-600" },
  { value: "afternoon", label: "Tarde", icon: Sunset, color: "text-orange-600" },
  { value: "night", label: "Noche", icon: Moon, color: "text-indigo-600" },
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

      toast.success(`Recolector "${fullName}" actualizado exitosamente`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Cargando recolector...</span>
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
        <span className="text-gray-900 font-medium">Editar Recolector</span>
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
            <h1 className="text-3xl font-bold text-gray-900">Editar Recolector</h1>
            <p className="text-gray-600 mt-1 font-mono">
              {originalCollector?.employee_id}
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
          {/* Formulario - 2 columnas */}
          <div className="lg:col-span-2 space-y-6">
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

            {/* Cambio de PIN */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-600" />
                  Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!changePin ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        PIN de Acceso
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        El PIN actual está oculto por seguridad
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setChangePin(true)}
                      disabled={saving}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Cambiar PIN
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new_pin">
                          Nuevo PIN <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="new_pin"
                            type={showPin ? "text" : "password"}
                            placeholder="Mínimo 4 dígitos"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
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
                        <p className="text-xs text-gray-500">Entre 4 y 10 caracteres</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm_pin">
                          Confirmar PIN <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="confirm_pin"
                          type={showPin ? "text" : "password"}
                          placeholder="Repite el nuevo PIN"
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value)}
                          disabled={saving}
                          maxLength={10}
                          className="font-mono"
                        />
                        {confirmPin && newPin !== confirmPin && (
                          <p className="text-xs text-red-500">Los PINs no coinciden</p>
                        )}
                        {confirmPin && newPin === confirmPin && newPin.length >= 4 && (
                          <p className="text-xs text-green-600">✓ PINs coinciden</p>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setChangePin(false);
                        setNewPin("");
                        setConfirmPin("");
                      }}
                      disabled={saving}
                    >
                      Cancelar cambio de PIN
                    </Button>

                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                      <p className="text-xs text-amber-900">
                        <strong>⚠ Importante:</strong> Al cambiar el PIN, el recolector
                        deberá usar el nuevo PIN para iniciar sesión. Compárteselo de forma
                        segura.
                      </p>
                    </div>
                  </>
                )}
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
                {/* Campus (solo lectura) */}
                <div className="space-y-2">
                  <Label>Campus Asignado</Label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {collectorCampus
                        ? `${collectorCampus.name} (${collectorCampus.code})`
                        : "Campus desconocido"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    El campus está codificado en el ID del empleado y no se puede cambiar.
                    Si necesitas asignarlo a otro campus, crea un nuevo recolector.
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
                        {originalCollector?.employee_id}
                      </p>
                    </div>
                  </div>

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

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-700 font-medium">
                        {collectorCampus?.name || "Sin campus"}
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