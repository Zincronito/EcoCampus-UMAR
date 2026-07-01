"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Loader2,
  Users,
  PowerOff,
  Power,
  AlertTriangle,
  Search,
  Building2,
  Sun,
  Moon,
  Sunset,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

import { collectorsAPI, campusAPI } from "@/lib/api";
import type { Collector, Campus } from "@/types";

type FilterType = "all" | "active" | "inactive";

const SHIFT_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  morning: { label: "Mañana", icon: Sun, color: "text-amber-600" },
  afternoon: { label: "Tarde", icon: Sunset, color: "text-orange-600" },
  night: { label: "Noche", icon: Moon, color: "text-indigo-600" },
};

export default function CollectorsPage() {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [campusFilter, setCampusFilter] = useState<string>("all");
  const [shiftFilter, setShiftFilter] = useState<string>("all");
  const [collectorToToggle, setCollectorToToggle] = useState<Collector | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [collectorsData, campusData] = await Promise.all([
        collectorsAPI.getAll(false),
        campusAPI.getAll(),
      ]);
      setCollectors(collectorsData);
      setCampuses(campusData);
    } catch (error: any) {
      toast.error("Error al cargar los datos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!collectorToToggle) return;

    const isActivating = !collectorToToggle.is_active;

    try {
      setToggling(true);

      if (isActivating) {
        await collectorsAPI.update(collectorToToggle.id, { is_active: true });
        toast.success(`Recolector "${collectorToToggle.full_name}" reactivado`);
      } else {
        await collectorsAPI.delete(collectorToToggle.id);
        toast.success(`Recolector "${collectorToToggle.full_name}" desactivado`);
      }

      setCollectorToToggle(null);
      await loadData();
    } catch (error: any) {
      toast.error("Error al cambiar el estado del recolector");
      console.error(error);
    } finally {
      setToggling(false);
    }
  };

  // Extraer codigo de campus del employee_id (REC-HUA-001 -> HUA)
  const getCampusCodeFromId = (employeeId: string): string => {
    const parts = employeeId.split("-");
    return parts.length >= 2 ? parts[1] : "";
  };

  // Filtrar
  const filteredCollectors = collectors.filter((c) => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filter === "all" ||
      (filter === "active" && c.is_active) ||
      (filter === "inactive" && !c.is_active);

    const matchesCampus = (() => {
      if (campusFilter === "all") return true;
      const campusCode = getCampusCodeFromId(c.employee_id);
      const campus = campuses.find((cm) => cm.id === campusFilter);
      return campus?.code === campusCode;
    })();

    const matchesShift =
      shiftFilter === "all" || (c.shift || "") === shiftFilter;

    return matchesSearch && matchesStatus && matchesCampus && matchesShift;
  });

  // Iniciales para avatar
  const getInitials = (fullName: string): string => {
    return fullName
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Stats
  const activeCount = collectors.filter((c) => c.is_active).length;
  const inactiveCount = collectors.filter((c) => !c.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Recolectores</h1>
          <p className="text-gray-600 mt-1">
            Administra al personal en campo encargado de la recolección de residuos.
          </p>
        </div>
        <Link href="/collectors/new">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Recolector
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por nombre, ID o email..."
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

          <Select value={shiftFilter} onValueChange={setShiftFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por turno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los turnos</SelectItem>
              <SelectItem value="morning">Mañana</SelectItem>
              <SelectItem value="afternoon">Tarde</SelectItem>
              <SelectItem value="night">Noche</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            Todos ({collectors.length})
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

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Cargando recolectores...</span>
        </div>
      )}

      {/* Empty states */}
      {!loading && filteredCollectors.length === 0 && collectors.length > 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No se encontraron recolectores con los filtros actuales</p>
          </CardContent>
        </Card>
      )}

      {!loading && collectors.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">No hay recolectores registrados</p>
            <Link href="/collectors/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Registrar primer recolector
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Grid de recolectores */}
      {!loading && filteredCollectors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollectors.map((collector) => {
            const shiftInfo = collector.shift ? SHIFT_LABELS[collector.shift] : null;
            const ShiftIcon = shiftInfo?.icon;
            const campusCode = getCampusCodeFromId(collector.employee_id);
            const campus = campuses.find((c) => c.code === campusCode);

            return (
              <Card
                key={collector.id}
                className={cn(
                  "transition-all relative",
                  collector.is_active
                    ? "hover:shadow-lg"
                    : "opacity-60 grayscale hover:opacity-80"
                )}
              >
                {!collector.is_active && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                      Inactivo
                    </Badge>
                  </div>
                )}

                <CardContent className="p-6">
                  {/* Header con avatar + nombre + ID */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-14 h-14 border-2 border-blue-200">
                        <AvatarFallback className="bg-blue-600 text-white font-semibold text-lg">
                          {getInitials(collector.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">
                          {collector.full_name}
                        </h3>
                        <p className="text-xs font-mono text-gray-500">
                          {collector.employee_id}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Link href={`/collectors/${collector.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-blue-600"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      {collector.is_active ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-red-600"
                          onClick={() => setCollectorToToggle(collector)}
                          title="Desactivar"
                        >
                          <PowerOff className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-green-600"
                          onClick={() => setCollectorToToggle(collector)}
                          title="Reactivar"
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Info de contacto */}
                  <div className="space-y-1.5 mb-3 pb-3 border-b border-gray-100">
                    {collector.email && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{collector.email}</span>
                      </div>
                    )}
                    {collector.phone && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{collector.phone}</span>
                      </div>
                    )}
                    {!collector.email && !collector.phone && (
                      <p className="text-xs text-gray-400 italic">Sin datos de contacto</p>
                    )}
                  </div>

                  {/* Asignación */}
                  <div className="space-y-2">
                    {/* Campus */}
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-700 font-medium">
                        {campus?.name || campusCode}
                      </span>
                    </div>

                    {/* Sector */}
                    {collector.assigned_sector && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-700 truncate">
                          {collector.assigned_sector}
                        </span>
                      </div>
                    )}

                    {/* Turno */}
                    {shiftInfo && ShiftIcon && (
                      <div className="flex items-center gap-2">
                        <ShiftIcon className={cn("w-4 h-4", shiftInfo.color)} />
                        <Badge variant="outline" className="text-xs">
                          Turno {shiftInfo.label}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Card de "Nuevo Recolector" */}
          {filter !== "inactive" && (
            <Link href="/collectors/new">
              <Card className="border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer h-full">
                <CardContent className="flex flex-col items-center justify-center py-12 h-full">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Plus className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-semibold">Nuevo Recolector</p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      )}

      {/* Footer */}
      {!loading && collectors.length > 0 && (
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
              <span className="font-semibold text-gray-900">{collectors.length}</span> Total
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Personal Operativo</span>
          </div>
        </div>
      )}

      {/* Dialog confirmación */}
      <AlertDialog
        open={!!collectorToToggle}
        onOpenChange={() => setCollectorToToggle(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {collectorToToggle?.is_active ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  ¿Desactivar recolector?
                </>
              ) : (
                <>
                  <Power className="w-5 h-5 text-green-600" />
                  ¿Reactivar recolector?
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {collectorToToggle?.is_active ? (
                <>
                  El recolector <strong>{collectorToToggle?.full_name}</strong>{" "}
                  (<span className="font-mono">{collectorToToggle?.employee_id}</span>) ya
                  no podrá iniciar sesión en la app móvil. Los reportes históricos generados
                  por este recolector se mantendrán intactos.
                </>
              ) : (
                <>
                  El recolector <strong>{collectorToToggle?.full_name}</strong>{" "}
                  (<span className="font-mono">{collectorToToggle?.employee_id}</span>) volverá
                  a estar disponible y podrá iniciar sesión en la app móvil.
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
                collectorToToggle?.is_active
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              {toggling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : collectorToToggle?.is_active ? (
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