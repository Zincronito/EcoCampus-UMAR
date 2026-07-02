"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Download, Copy, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ContainerLabel from "./ContainerLabel";
import type { Container } from "@/types";

interface QRCodeCardProps {
  container: Container;
  category?: any;
  location?: any;
}

export default function QRCodeCard({
  container,
  category,
  location,
}: QRCodeCardProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setGeneratingPDF(true);
      toast.loading("Generando etiqueta...");

      // Obtener QR
      const qrSvg = qrRef.current?.querySelector("svg");
      if (!qrSvg) {
        toast.error("No se pudo obtener el QR");
        return;
      }

      // Convertir SVG a canvas
      const svgString = new XMLSerializer().serializeToString(qrSvg);
      const qrCanvas = document.createElement("canvas");
      const ctx = qrCanvas.getContext("2d");
      const img = new Image();

      const qrImageData = await new Promise<string>((resolve) => {
        img.onload = () => {
          qrCanvas.width = img.width;
          qrCanvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          resolve(qrCanvas.toDataURL("image/png"));
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgString);
      });

      // Crear PDF 4x6"
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [101.6, 152.4],
      });

      const pageWidth = 101.6;
      const pageHeight = 152.4;
      const margin = 10;
      let yPos = margin;

      // Header
      pdf.setFillColor(26, 26, 26);
      pdf.rect(0, 0, pageWidth, 14, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("EcoCampus", 8, 9);

      // Icono hoja (círculo verde)
      pdf.setFillColor(34, 197, 94);
      pdf.circle(pageWidth - 8, 7, 2, "F");

      yPos = 18;

      // QR centrado
      const qrSize = 35;
      const qrX = (pageWidth - qrSize) / 2;
      pdf.addImage(qrImageData, "PNG", qrX, yPos, qrSize, qrSize);
      yPos += qrSize + 6;

      // Container ID
      pdf.setTextColor(102, 102, 102);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text("CONTAINER ID", pageWidth / 2, yPos, { align: "center" });
      yPos += 4;

      pdf.setTextColor(26, 26, 26);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(`#${container.container_code}`, pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 8;

      // Info grid 2x2
      const colWidth = (pageWidth - 2 * margin - 4) / 2;
      const col1X = margin;
      const col2X = margin + colWidth + 4;
      const infoBoxHeight = 15;

      // Helper para dibujar caja de info
      const drawInfoBox = (
        x: number,
        y: number,
        label: string,
        value: string,
        subtext?: string
      ) => {
        // Fondo
        pdf.setFillColor(240, 245, 255);
        pdf.rect(x, y, colWidth, infoBoxHeight, "F");

        // Label
        pdf.setTextColor(102, 102, 102);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        pdf.text(label, x + 2, y + 4);

        // Value
        pdf.setTextColor(26, 26, 26);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        const splitValue = pdf.splitTextToSize(value, colWidth - 4);
        pdf.text(splitValue, x + 2, y + 8);

        // Subtext
        if (subtext) {
          pdf.setTextColor(102, 102, 102);
          pdf.setFontSize(6);
          pdf.setFont("helvetica", "normal");
          pdf.text(subtext, x + 2, y + 11.5);
        }
      };

      // Location
      drawInfoBox(
        col1X,
        yPos,
        "LOCATION",
        location?.name || "N/A",
        location?.sector
      );

      // Category
      drawInfoBox(col2X, yPos, "CATEGORY", category?.name || "N/A");

      yPos += infoBoxHeight + 2;

      // Tare Weight
      drawInfoBox(col1X, yPos, "TARE WEIGHT", `${container.tare_weight}kg`);

      // Volume
      drawInfoBox(col2X, yPos, "VOLUME", `${container.volume_liters}L`);

      // Footer
      pdf.setTextColor(153, 153, 153);
      pdf.setFontSize(6);
      pdf.setFont("helvetica", "italic");
      const today = new Date().toISOString().split("T")[0];
      pdf.text(
        `Generated: ${today} • Valid for EcoCampus Intranet`,
        pageWidth / 2,
        pageHeight - 4,
        { align: "center" }
      );

      pdf.save(`${container.container_code}.pdf`);
      toast.dismiss();
      toast.success("Etiqueta descargada");
    } catch (error) {
      toast.error("Error al generar etiqueta");
      console.error(error);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(container.container_code);
    toast.success(`Código copiado: ${container.container_code}`);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Vista Previa */}
      <ContainerLabel
        container={container}
        category={category}
        location={location}
      />

      {/* Botones */}
      <div className="flex gap-2 flex-col">
        <Button
          onClick={handleCopyCode}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copiar Código
        </Button>
        <Button
          onClick={handleDownloadPDF}
          disabled={generatingPDF}
          size="sm"
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {generatingPDF ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              PDF...
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4 mr-2" />
              Descargar PDF
            </>
          )}
        </Button>
      </div>

      {/* Hidden QR para extraer */}
      <div ref={qrRef} style={{ display: "none" }}>
        <QRCodeSVG
          value={container.container_code}
          size={120}
          level="H"
          includeMargin={true}
        />
      </div>
    </div>
  );
}