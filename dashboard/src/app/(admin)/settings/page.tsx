"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Settings, Archive, AlertTriangle, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserFromCookie } from "@/lib/api";

interface ArchivePreview {
  before_date: string;
  records_to_delete: number;
  incidents_to_delete: number;
  photos_to_delete: number;
  notifications_to_delete: number;
}

export default function SettingsPage() {
  const router = useRouter();

  // Validar que el usuario sea admin
  useEffect(() => {
    const user = getUserFromCookie();
    if (!user || user.role !== "admin") {
      toast.error("Acceso restringido. Solo administradores pueden acceder a esta sección.");
      router.push("/dashboard");
    }
  }, [router]);
  const [beforeDate, setBeforeDate] = useState("");
  const [preview, setPreview] = useState<ArchivePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [archiving, setArchiving] = useState(false);

  const handlePreview = async () => {
    if (!beforeDate) {
      toast.error("Selecciona una fecha límite");
      return;
    }

    try {
      setLoadingPreview(true);
      const response = await api.get(
        `/records/archive-preview?before_date=${beforeDate}`
      );
      setPreview(response.data);
    } catch (error: any) {
      toast.error("Error al obtener la vista previa");
      console.error(error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleArchive = async () => {
    if (confirmText !== "ELIMINAR") {
      toast.error('Escribe "ELIMINAR" exactamente para confirmar');
      return;
    }

    try {
      setArchiving(true);
      const response = await api.delete(
        `/records/archive?before_date=${beforeDate}`
      );
      const data = response.data;

      toast.success(
        `Archivado exitoso: ${data.records_deleted} registros, ${data.notifications_deleted} notificaciones, ${data.photos_deleted} fotos eliminadas`
      );

      // Limpiar el estado
      setShowConfirmDialog(false);
      setConfirmText("");
      setPreview(null);
      setBeforeDate("");
    } catch (error: any) {
      toast.error("Error al archivar los registros");
      console.error(error);
    } finally {
      setArchiving(false);
    }
  };

  const hasDataToDelete = preview && (
    preview.records_to_delete > 0 ||
    preview.incidents_to_delete > 0 ||
    preview.notifications_to_delete > 0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600 mt-1">
            Ajustes generales y mantenimiento del sistema.
          </p>
        </div>
      </div>

      {/* Módulo: Archivar registros antiguos */}
      <Card className="border-orange-200">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Archive className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <CardTitle>Archivar registros antiguos</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Elimina permanentemente registros anteriores a una fecha. Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Aviso importante */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Antes de continuar:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Exporta el CSV de <a href="/reports" className="underline font-medium">Reportes</a> como respaldo</li>
                <li>Exporta el CSV de <a href="/analytics" className="underline font-medium">Análisis</a> con las KPIs históricas</li>
                <li>Esta operación borra registros, incidencias, notificaciones y fotos asociadas</li>
                <li>Los usuarios y contenedores NO se ven afectados</li>
              </ul>
            </div>
          </div>

          {/* Selector de fecha */}
          <div className="space-y-2">
            <Label htmlFor="before-date">
              Eliminar registros anteriores a:
            </Label>
            <div className="flex gap-2">
              <Input
                id="before-date"
                type="date"
                value={beforeDate}
                onChange={(e) => {
                  setBeforeDate(e.target.value);
                  setPreview(null); // Reset preview al cambiar fecha
                }}
                className="max-w-xs"
              />
              <Button
                onClick={handlePreview}
                disabled={!beforeDate || loadingPreview}
                variant="outline"
              >
                {loadingPreview ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Vista previa
              </Button>
            </div>
          </div>

          {/* Preview de datos a eliminar */}
          {preview && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="font-semibold text-gray-900">
                Se eliminarán los siguientes datos anteriores al {preview.before_date}:
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded p-3 border">
                  <p className="text-gray-500">Registros de recolección</p>
                  <p className="text-2xl font-bold text-gray-900">{preview.records_to_delete}</p>
                </div>
                <div className="bg-white rounded p-3 border">
                  <p className="text-gray-500">Incidencias</p>
                  <p className="text-2xl font-bold text-gray-900">{preview.incidents_to_delete}</p>
                </div>
                <div className="bg-white rounded p-3 border">
                  <p className="text-gray-500">Fotos en almacenamiento</p>
                  <p className="text-2xl font-bold text-gray-900">{preview.photos_to_delete}</p>
                </div>
                <div className="bg-white rounded p-3 border">
                  <p className="text-gray-500">Notificaciones</p>
                  <p className="text-2xl font-bold text-gray-900">{preview.notifications_to_delete}</p>
                </div>
              </div>

              {hasDataToDelete ? (
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  variant="destructive"
                  className="w-full mt-4"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archivar y eliminar permanentemente
                </Button>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No hay datos anteriores a esta fecha.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmar eliminación permanente
            </DialogTitle>
            <DialogDescription className="pt-2">
              Estás a punto de eliminar <strong>{preview?.records_to_delete} registros</strong>,{" "}
              <strong>{preview?.incidents_to_delete} incidencias</strong>,{" "}
              <strong>{preview?.photos_to_delete} fotos</strong> y{" "}
              <strong>{preview?.notifications_to_delete} notificaciones</strong>{" "}
              anteriores al {preview?.before_date}.
              <br /><br />
              <span className="text-red-600 font-semibold">Esta acción NO se puede deshacer.</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="confirm-text">
              Para confirmar, escribe <span className="font-bold text-red-600">ELIMINAR</span>:
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setConfirmText("");
              }}
              disabled={archiving}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleArchive}
              disabled={confirmText !== "ELIMINAR" || archiving}
            >
              {archiving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 mr-2" />
                  Sí, eliminar permanentemente
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}