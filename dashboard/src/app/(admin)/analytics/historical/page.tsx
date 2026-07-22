"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  X,
  ArrowLeft,
  BarChart3,
  Loader2,
  TrendingUp,
  Target,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Legend,
} from "recharts";

// ─── HELPERS (idénticos a analytics normal) ───

const SeparationLevelCard = ({ level }: { level: number }) => {
  const levelInfo = {
    0: { text: "Excelente", bgColor: "bg-green-100", iconColor: "text-green-700" },
    1: { text: "Aceptable", bgColor: "bg-green-100", iconColor: "text-green-700" },
    2: { text: "Deficiente", bgColor: "bg-orange-100", iconColor: "text-orange-700" },
    3: { text: "Crítico", bgColor: "bg-red-100", iconColor: "text-red-700" },
  };
  const info = levelInfo[Math.round(level) as keyof typeof levelInfo] || levelInfo[0];
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              Nivel Promedio de Separación
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{level.toFixed(2)}</p>
            </div>
            <p className={`text-sm font-semibold mt-2 ${info.iconColor}`}>{info.text}</p>
          </div>
          <div className={`p-3 ${info.bgColor} rounded-lg`}>
            <Target className={`w-6 h-6 ${info.iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const getSeparationColor = (levelNumber: number): string => {
  const colorMap: { [key: number]: string } = {
    0: "#10b981", // Excelente - Verde
    1: "#84cc16", // Aceptable - Verde claro
    2: "#f97316", // Deficiente - Naranja
    3: "#ef4444", // Crítico - Rojo
  };
  return colorMap[levelNumber] || "#8b5cf6";
};

const SEPARATION_LABEL_MAP: Record<number, string> = {
  0: "Excelente",
  1: "Aceptable",
  2: "Deficiente",
  3: "Crítico",
};

// Mapeo de fill_level string → número (para nivel promedio)
const FILL_LEVEL_TO_NUMBER: Record<string, number> = {
  empty: 0,
  quarter: 1,
  half: 2,
  three_quarter: 3,
  full: 4,
  overflow: 5,
};

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#6366f1",
];

// ─── ESTRUCTURA DE UN RECORD DEL CSV ───

interface HistoricalRecord {
  fecha: string;
  hora: string;
  contenedor: string;
  categoria: string;
  ubicacion: string;
  sector: string;
  campus: string;
  recolector: string;
  peso_bruto: number | null;
  peso_neto: number | null;
  peso_estimado: boolean;
  nivel_llenado_label: string;
  nivel_llenado_raw: string;
  estado_fisico: string;
  condiciones: string;
  nivel_separacion: string;
  tiene_incidencia: boolean;
  tipo_incidencia: string;
  descripcion_incidencia: string;
  fecha_iso: string;
}

export default function HistoricalAnalyticsPage() {
  const [records, setRecords] = useState<HistoricalRecord[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // ─── PARSER CSV ───

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const parseCSV = (text: string): HistoricalRecord[] => {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) throw new Error("CSV vacío o inválido");

    // Quitar BOM si existe
    if (lines[0].charCodeAt(0) === 0xFEFF) {
      lines[0] = lines[0].slice(1);
    }

    const data: HistoricalRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < 15) continue;

      const get = (idx: number) => (values[idx] || "").trim();

      // Fecha + hora → ISO
      const fechaStr = get(0);
      const horaStr = get(1);
      const [d, m, y] = fechaStr.split("/");
      const fechaIso = y && m && d
        ? `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${horaStr || "00:00:00"}`
        : "";

      data.push({
        fecha: fechaStr,
        hora: horaStr,
        contenedor: get(2),
        categoria: get(3),
        ubicacion: get(4),
        sector: get(5),
        campus: get(6),
        recolector: get(7),
        peso_bruto: get(8) ? parseFloat(get(8)) : null,
        peso_neto: get(9) ? parseFloat(get(9)) : null,
        peso_estimado: get(10) === "Sí",
        nivel_llenado_label: get(11),
        nivel_llenado_raw: get(12),
        estado_fisico: get(13),
        condiciones: get(14),
        nivel_separacion: get(15),
        tiene_incidencia: get(16) === "Sí",
        tipo_incidencia: get(17),
        descripcion_incidencia: get(18),
        fecha_iso: fechaIso,
      });
    }
    return data;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Por favor selecciona un archivo CSV");
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          toast.error("El CSV no contiene datos válidos");
          setLoading(false);
          return;
        }
        setRecords(parsed);
        setFileName(file.name);
        toast.success(`${parsed.length} registros cargados correctamente`);
      } catch (error: any) {
        toast.error(`Error al procesar el CSV: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleCloseHistorical = () => {
    setRecords([]);
    setFileName("");
    toast.info("Datos históricos cerrados");
  };

  // ─── MÉTRICAS AL VUELO ───

  const metrics = useMemo(() => {
    if (records.length === 0) return null;

    // Weight total y registros
    const total_weight = records.reduce((sum, r) => sum + (r.peso_neto || 0), 0);
    const total_records = records.length;

    // Fechas para cálculo de tasas
    const fechas = records
      .map((r) => new Date(r.fecha_iso).getTime())
      .filter((t) => !isNaN(t))
      .sort((a, b) => a - b);
    const daysSpan = fechas.length > 1
      ? Math.max(1, (fechas[fechas.length - 1] - fechas[0]) / (1000 * 60 * 60 * 24))
      : 1;
    const average_generation_rate = total_weight / daysSpan;
    const weekly_generation_rate = average_generation_rate * 7;

    // Separación
    const separation_levels = records
      .map((r) => parseInt(r.nivel_separacion))
      .filter((n) => !isNaN(n));
    const correct_separation = separation_levels.filter((n) => n === 0 || n === 1).length;
    const correct_separation_percentage =
      total_records > 0 ? (correct_separation / total_records) * 100 : 0;
    const average_separation_level =
      separation_levels.length > 0
        ? separation_levels.reduce((a, b) => a + b, 0) / separation_levels.length
        : 0;

    // Agrupar por categoría (con percentage)
    const by_category_map: Record<string, number> = {};
    records.forEach((r) => {
      const cat = r.categoria || "Sin categoría";
      by_category_map[cat] = (by_category_map[cat] || 0) + (r.peso_neto || 0);
    });
    const by_category = Object.entries(by_category_map)
      .map(([name, weight]) => ({
        name,
        weight: Number(weight.toFixed(2)),
        percentage: total_weight > 0 ? Number(((weight / total_weight) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.weight - a.weight);

    // Por sector
    const by_sector_map: Record<string, number> = {};
    records.forEach((r) => {
      const sec = r.sector || "Sin sector";
      by_sector_map[sec] = (by_sector_map[sec] || 0) + (r.peso_neto || 0);
    });
    const by_sector = Object.entries(by_sector_map)
      .map(([sector, weight]) => ({ sector, weight: Number(weight.toFixed(2)) }))
      .sort((a, b) => b.weight - a.weight);

    // Por campus
    const by_campus_map: Record<string, number> = {};
    records.forEach((r) => {
      const camp = r.campus || "Sin campus";
      by_campus_map[camp] = (by_campus_map[camp] || 0) + (r.peso_neto || 0);
    });
    const by_campus = Object.entries(by_campus_map)
      .map(([campus, weight]) => ({ campus, weight: Number(weight.toFixed(2)) }))
      .sort((a, b) => b.weight - a.weight);

    // Nivel de llenado promedio por sector
    const fill_by_sector: Record<string, { sum: number; count: number }> = {};
    records.forEach((r) => {
      const sec = r.sector || "Sin sector";
      const level = FILL_LEVEL_TO_NUMBER[r.nivel_llenado_raw];
      if (level !== undefined) {
        if (!fill_by_sector[sec]) fill_by_sector[sec] = { sum: 0, count: 0 };
        fill_by_sector[sec].sum += level;
        fill_by_sector[sec].count += 1;
      }
    });
    const by_fill_level_sector = Object.entries(fill_by_sector).map(([sector, { sum, count }]) => ({
      sector,
      average_fill: count > 0 ? Number((sum / count).toFixed(2)) : 0,
    }));

    // Incidencias por tipo
    const incidents = {
      uncovered: records.filter((r) => r.tipo_incidencia === "uncovered").length,
      fauna: records.filter((r) => r.tipo_incidencia === "fauna").length,
      odor: records.filter((r) => r.tipo_incidencia === "odor").length,
      overflow: records.filter((r) => r.tipo_incidencia === "overflow").length,
    };

    // Separación: by_level (para gráfica)
    const by_level_map: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
    separation_levels.forEach((n) => {
      if (by_level_map[n] !== undefined) by_level_map[n]++;
    });
    const separationChartData = Object.entries(by_level_map).map(([level, count]) => ({
      level: SEPARATION_LABEL_MAP[parseInt(level)] || `Nivel ${level}`,
      count,
      levelNumber: parseInt(level),
    }));

    // Temporal generación (por día)
    const by_day_map: Record<string, number> = {};
    records.forEach((r) => {
      if (!r.fecha_iso) return;
      const day = r.fecha_iso.split("T")[0];
      by_day_map[day] = (by_day_map[day] || 0) + (r.peso_neto || 0);
    });
    const temporal_generation = Object.entries(by_day_map)
      .map(([date, weight]) => ({ date, weight: Number(weight.toFixed(2)) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Temporal separación (% correcta por día)
    const by_day_sep: Record<string, { correct: number; total: number }> = {};
    records.forEach((r) => {
      if (!r.fecha_iso) return;
      const day = r.fecha_iso.split("T")[0];
      const level = parseInt(r.nivel_separacion);
      if (!by_day_sep[day]) by_day_sep[day] = { correct: 0, total: 0 };
      by_day_sep[day].total++;
      if (level === 0 || level === 1) by_day_sep[day].correct++;
    });
    const temporal_separation = Object.entries(by_day_sep)
      .map(([date, { correct, total }]) => ({
        date,
        correct_percentage: total > 0 ? Number(((correct / total) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total_weight: Number(total_weight.toFixed(2)),
      total_records,
      average_generation_rate: Number(average_generation_rate.toFixed(2)),
      weekly_generation_rate: Number(weekly_generation_rate.toFixed(2)),
      correct_separation_percentage: Number(correct_separation_percentage.toFixed(1)),
      average_separation_level: Number(average_separation_level.toFixed(2)),
      by_category,
      by_sector,
      by_campus,
      by_fill_level_sector,
      incidents,
      separationChartData,
      temporal_generation,
      temporal_separation,
    };
  }, [records]);

  // ─── RENDER ───

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/analytics" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Volver a Análisis
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Datos Históricos</h1>
          <p className="text-gray-600 mt-1">
            Consulta gráficas y KPIs a partir de un CSV exportado previamente.
          </p>
        </div>

        {records.length > 0 && (
          <Button onClick={handleCloseHistorical} variant="outline" className="gap-2">
            <X className="w-4 h-4" />
            Cerrar histórico
          </Button>
        )}
      </div>

      {/* Uploader */}
      {records.length === 0 && (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sube un archivo CSV histórico
              </h3>
              <p className="text-gray-600 mb-6">
                Selecciona un CSV exportado desde la sección de Reportes para consultar sus gráficas y métricas.
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={loading}
                />
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                  {loading ? "Procesando..." : "Seleccionar archivo CSV"}
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-6">
                📝 Solo se procesa en tu navegador. No se guarda en el servidor.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info del archivo cargado */}
      {records.length > 0 && (
        <Card className="border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold text-gray-900">{fileName}</p>
                <p className="text-sm text-gray-600">{records.length} registros cargados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs + Gráficas */}
      {records.length > 0 && metrics && (
        <>
          {/* KPI Cards (idéntico a analytics normal) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Residuos Acumulados</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-gray-900">{metrics.total_weight.toFixed(1)}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mt-2">kg</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Tasa Promedio Diaria</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-gray-900">{metrics.average_generation_rate.toFixed(2)}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mt-2">kg/día</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Tasa Semanal Estimada</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-gray-900">{metrics.weekly_generation_rate.toFixed(2)}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mt-2">kg/semana</p>
                  </div>
                  <div className="p-3 bg-cyan-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-cyan-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Total de Registros</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-gray-900">{metrics.total_records}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mt-2">eventos</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Efectividad de Separación</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-gray-900">{metrics.correct_separation_percentage.toFixed(1)}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mt-2">% correctos</p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <SeparationLevelCard level={metrics.average_separation_level} />
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">

            {/* Gráfica 1: Tendencia de Generación */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">Tendencia de Generación</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={metrics.temporal_generation} margin={{ left: 20, right: 30, top: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      label={{ value: "Fecha", position: "insideBottom", offset: -15, fill: "#6b7280", fontSize: 12 }}
                    />
                    <YAxis
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: "Generación (kg)", angle: -90, position: "insideLeft", offset: -5, style: { textAnchor: "middle", fill: "#6b7280", fontSize: 12 } }}
                    />
                    <Tooltip
                      formatter={(value: any) => [`${value} kg`, "Peso"]}
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4, stroke: "#fff" }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfica 2: Distribución por Categoría */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">Distribución por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={metrics.by_category}
                      dataKey="weight"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={105}
                      label={(entry: any) => `${entry.name}: ${entry.percentage}%`}
                      labelLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                    >
                      {metrics.by_category.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`${value} kg`, "Peso"]}
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfica 3: Generación por Sector */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">Generación por Sector</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={metrics.by_sector}
                    layout="vertical"
                    margin={{ left: 20, right: 50, top: 20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis
                      type="number"
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      label={{ value: "Peso Generado (kg)", position: "insideBottom", offset: -15, fill: "#6b7280", fontSize: 12 }}
                    />
                    <YAxis
                      dataKey="sector"
                      type="category"
                      width={100}
                      tick={{ fill: "#4b5563", fontWeight: 500, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: any) => [`${value} kg`, "Peso"]}
                      cursor={{ fill: "#f3f4f6" }}
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                    <Bar dataKey="weight" fill="#10b981" radius={[0, 4, 4, 0]} barSize={36}>
                      <LabelList dataKey="weight" position="right" style={{ fill: "#4b5563", fontSize: 13, fontWeight: 600 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfica 4: Generación por Campus */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">Generación por Campus</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={metrics.by_campus} margin={{ top: 20, right: 20, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="campus"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      tickMargin={10}
                      label={{ value: "Sede / Campus", position: "insideBottom", offset: -15, fill: "#6b7280", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      label={{ value: "Peso Acumulado (kg)", angle: -90, position: "insideLeft", offset: -5, style: { textAnchor: "middle", fill: "#6b7280", fontSize: 12 } }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f3f4f6" }}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      formatter={(value: any) => [`${value} kg`, "Peso recolectado"]}
                    />
                    <Bar dataKey="weight" name="Peso" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfica 5: Nivel de Llenado Promedio por Sector */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">Nivel de Llenado Promedio por Sector</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={metrics.by_fill_level_sector} margin={{ top: 20, right: 20, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="sector"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      tickMargin={10}
                      label={{ value: "Sector", position: "insideBottom", offset: -15, fill: "#6b7280", fontSize: 12 }}
                    />
                    <YAxis
                      domain={[0, 5]}
                      ticks={[0, 1, 2, 3, 4, 5]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      label={{ value: "Nivel (0 - 5)", angle: -90, position: "insideLeft", offset: -5, style: { textAnchor: "middle", fill: "#6b7280", fontSize: 12 } }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f3f4f6" }}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      formatter={(value: any) => [`Nivel ${value} de 5`, "Llenado Promedio"]}
                    />
                    <Bar dataKey="average_fill" name="Llenado Promedio" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfica 6: Incidencias Operativas */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">Incidencias Operativas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={[
                      { name: "Destapado", count: metrics.incidents.uncovered },
                      { name: "Fauna", count: metrics.incidents.fauna },
                      { name: "Mal olor", count: metrics.incidents.odor },
                      { name: "Desbordamiento", count: metrics.incidents.overflow },
                    ]}
                    margin={{ top: 20, right: 20, left: 20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      tickMargin={10}
                      label={{ value: "Tipo de Incidencia", position: "insideBottom", offset: -15, fill: "#6b7280", fontSize: 12 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      label={{ value: "Cant. de Reportes", angle: -90, position: "insideLeft", offset: -5, style: { textAnchor: "middle", fill: "#6b7280", fontSize: 12 } }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f3f4f6" }}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      formatter={(value: any) => [value, "Número de reportes"]}
                    />
                    <Bar dataKey="count" name="Reportes" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfica 7: Distribución de Separación */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">Distribución de Separación</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={metrics.separationChartData} margin={{ left: 20, right: 20, top: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="level"
                      tick={{ fill: "#4b5563", fontWeight: 500, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      label={{ value: "Nivel de Separación", position: "insideBottom", offset: -15, fill: "#6b7280", fontSize: 12 }}
                    />
                    <YAxis
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      label={{ value: "Total de Registros", angle: -90, position: "insideLeft", offset: -5, style: { textAnchor: "middle", fill: "#6b7280", fontSize: 12 } }}
                    />
                    <Tooltip
                      formatter={(value: any) => [value, "Registros"]}
                      cursor={{ fill: "#f3f4f6" }}
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={44}>
                      {metrics.separationChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={getSeparationColor(entry.levelNumber)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfica 8: Evolución de Separación */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">Evolución de Separación</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={metrics.temporal_separation} margin={{ top: 20, right: 20, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      tickMargin={10}
                      label={{ value: "Fecha", position: "insideBottom", offset: -15, fill: "#6b7280", fontSize: 12 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      label={{ value: "Efectividad (%)", angle: -90, position: "insideLeft", offset: -5, style: { textAnchor: "middle", fill: "#6b7280", fontSize: 12 } }}
                    />
                    <Tooltip
                      cursor={{ stroke: "#9ca3af", strokeWidth: 1, strokeDasharray: "5 5" }}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      formatter={(value: any) => [`${value}%`, "Separación Correcta"]}
                    />
                    <Legend wrapperStyle={{ paddingTop: "10px" }} iconType="circle" />
                    <Line
                      type="monotone"
                      dataKey="correct_percentage"
                      name="Separación Correcta"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#06b6d4", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#06b6d4", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </div>
        </>
      )}
    </div>
  );
}