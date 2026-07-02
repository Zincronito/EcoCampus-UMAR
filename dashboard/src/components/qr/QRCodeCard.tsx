"use client";

import { useRef, useState } from "react";
import jsPDF from "jspdf";
// Importamos toPng en lugar de html2canvas
import { toPng } from "html-to-image"; 
import { Button } from "@/components/ui/button";
import { Copy, FileDown, Loader2 } from "lucide-react";
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
  const labelRef = useRef<HTMLDivElement>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    if (!labelRef.current) return;

    try {
      setGeneratingPDF(true);
      toast.loading("Generando etiqueta...");

      // 1. Usamos html-to-image en lugar de html2canvas
      // pixelRatio actúa como el 'scale', mejorando la nitidez
      const imgData = await toPng(labelRef.current, {
        pixelRatio: 8, 
        backgroundColor: "#ffffff",
        style: {
          // Aseguramos que no haya problemas de renderizado con bordes redondeados
          transform: "scale(1)", 
          transformOrigin: "top left"
        }
      });

      // 2. Configuramos el PDF (4x6 pulgadas = 101.6 x 152.4 mm)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [101.6, 152.4],
      });

      // 3. Insertamos la imagen (toPng ya nos da el dataURL directo)
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${container.container_code}.pdf`);

      toast.dismiss();
      toast.success("Etiqueta descargada");
    } catch (error) {
      toast.dismiss();
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
      {/* Contenedor Visual */}
      <div ref={labelRef} className="bg-white rounded-lg overflow-hidden">
        <ContainerLabel
          container={container}
          category={category}
          location={location}
        />
      </div>

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
              Generando PDF...
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4 mr-2" />
              Descargar PDF
            </>
          )}
        </Button>
      </div>
    </div>
  );
}