import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Configura la fuente Inter (esta es la que le dará el toque pro)
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", 
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EcoCampus UMAR - Admin Portal",
  description: "Sistema de gestion de residuos universitarios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      // Dejamos tus variables de Geist intactas por si las usas, pero sumamos Inter
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full overflow-hidden antialiased`}
    >
      {/* AQUÍ ESTÁ EL CAMBIO: Agregamos ${inter.className} para aplicar la fuente a toda la app */}
      <body className={`${inter.className} h-full overflow-hidden flex flex-col bg-background`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}