"use client";

import { QRCodeSVG } from "qrcode.react";
import type { Container } from "@/types";

interface ContainerLabelProps {
  container: Container;
  category?: any;
  location?: any;
}

// --- ICONOS SVG ---
const LocationIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CategoryIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const WeightIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9h12M6 9l1.5 11a1 1 0 0 0 1 .9h9a1 1 0 0 0 1-.9L18 9M9 5h6M9 5l-1 4h8l-1-4" />
  </svg>
);

const VolumeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="1" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="6" y1="10" x2="18" y2="10" />
  </svg>
);

const LeafIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
    <path d="M12 7v10M7 12h10" />
  </svg>
);

export default function ContainerLabel({
  container,
  category,
  location,
}: ContainerLabelProps) {
  return (
    <div className="flex justify-center w-full select-none antialiased">
      <div
        className="bg-white flex flex-col relative overflow-hidden font-sans"
        style={{
          width: "384px",
          minWidth: "384px",
          height: "576px",
          minHeight: "576px",
          maxHeight: "576px",
          padding: "20px",
          border: "1px dashed #e5e7eb",
          boxSizing: "border-box"
        }}
      >

        {/* Barra superior con color de la categoría */}
        <div
          className="absolute top-0 left-0 w-full h-3"
          style={{ backgroundColor: category?.color || "#22c55e" }}
        />

        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b-2 border-gray-100 mt-2">
          {/* Aplicamos font-mono aquí para que sea igual al ID */}
          <h1 className="m-0 text-3xl font-black tracking-tight text-gray-900 font-mono">
            EcoCampus
          </h1>
          <div style={{ color: category?.color || "#22c55e" }}>
            <LeafIcon />
          </div>
        </div>

        {/* Cuerpo Principal */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="p-3 bg-white rounded-3xl shadow-sm border border-gray-100 mb-3">
            <QRCodeSVG
              value={container.container_code}
              size={170}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="text-center">
            <p className="m-0 text-[10px] text-gray-400 font-extrabold tracking-widest uppercase mb-1">
              ID CONTENEDOR
            </p>
            <p className="m-0 text-4xl font-black text-gray-900 tracking-tight font-mono">
              #{container.container_code}
            </p>
          </div>
        </div>

        {/* Cuadrícula de Información */}
        <div className="grid grid-cols-2 gap-3 mb-2 shrink-0">

          {/* Ubicación */}
          <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-100/80 flex items-start gap-2">
            <div className="text-blue-600 mt-0.5 shrink-0">
              <LocationIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="m-0 text-[10px] text-blue-500/80 font-extrabold uppercase tracking-wider mb-0.5">
                Ubicación
              </p>
              <p className="m-0 text-sm leading-tight text-gray-900 font-black tracking-tight break-words line-clamp-2">
                {location?.name || "No Asignada"}
              </p>
              {location?.sector && (
                <p className="m-0 text-[10px] leading-tight text-gray-500 font-medium break-words line-clamp-1 mt-0.5">
                  {location.sector}
                </p>
              )}
            </div>
          </div>

          {/* Categoría */}
          <div
            className="p-3 rounded-2xl border flex items-start gap-2"
            style={{
              backgroundColor: `${category?.color || "#22c55e"}15`,  // 15 = ~10% opacity
              borderColor: `${category?.color || "#22c55e"}40`      // 40 = ~25% opacity
            }}
          >
            <div style={{ color: category?.color || "#22c55e" }} className="mt-0.5 shrink-0">
              <CategoryIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="m-0 text-[10px] font-extrabold uppercase tracking-wider mb-0.5"
                style={{ color: `${category?.color || "#22c55e"}CC` }}
              >
                Categoría
              </p>
              <p className="m-0 text-sm leading-tight text-gray-900 font-black tracking-tight break-words line-clamp-2">
                {category?.name || "General"}
              </p>
            </div>
          </div>

          {/* Peso Tara */}
          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200/80 flex items-start gap-2">
            <div className="text-gray-500 mt-0.5 shrink-0">
              <WeightIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="m-0 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-0.5">
                Peso Tara
              </p>
              <p className="m-0 text-sm text-gray-900 font-black tracking-tight">
                {container.tare_weight} kg
              </p>
            </div>
          </div>

          {/* Volumen */}
          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200/80 flex items-start gap-2">
            <div className="text-gray-500 mt-0.5 shrink-0">
              <VolumeIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="m-0 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-0.5">
                Volumen
              </p>
              <p className="m-0 text-sm text-gray-900 font-black tracking-tight">
                {container.volume_cubic_meters} m³
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-gray-100 text-center shrink-0">
          <p className="m-0 text-[9px] text-gray-400 font-bold tracking-widest uppercase">
            Generado: {new Date().toISOString().split("T")[0]} • Intranet EcoCampus
          </p>
        </div>

      </div>
    </div>
  );
}