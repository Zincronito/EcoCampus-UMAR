"use client";

import { QRCodeSVG } from "qrcode.react";
import type { Container } from "@/types";

interface ContainerLabelProps {
  container: Container;
  category?: any;
  location?: any;
}

// SVG Icons profesionales minimalistas
const LocationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CategoryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const WeightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9h12M6 9l1.5 11a1 1 0 0 0 1 .9h9a1 1 0 0 0 1-.9L18 9M9 5h6M9 5l-1 4h8l-1-4" />
  </svg>
);

const VolumeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="1" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="6" y1="10" x2="18" y2="10" />
  </svg>
);

const LeafIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    <div
      style={{
        width: "101.6mm",
        height: "152.4mm",
        padding: "12mm",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        fontFamily: "Arial, sans-serif",
        border: "2px dashed #999",
        gap: "8px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "4px",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#1a1a1a" }}>
          EcoCampus
        </h1>
        <div style={{ color: "#22c55e", width: "24px", height: "24px" }}>
          <LeafIcon />
        </div>
      </div>

      {/* QR */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "8px",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
        }}
      >
        <QRCodeSVG
          value={container.container_code}
          size={120}
          level="H"
          includeMargin={true}
        />
      </div>

      {/* Container ID */}
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: "4px 0", fontSize: "11px", color: "#666", fontWeight: "500" }}>
          CONTAINER ID
        </p>
        <p
          style={{
            margin: "2px 0",
            fontSize: "20px",
            fontWeight: "bold",
            color: "#1a1a1a",
            letterSpacing: "1px",
          }}
        >
          #{container.container_code}
        </p>
      </div>

      {/* Info Grid 2x2 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        {/* Location */}
        <div
          style={{
            padding: "8px",
            backgroundColor: "#f0f5ff",
            borderRadius: "4px",
            display: "flex",
            gap: "8px",
          }}
        >
          <div style={{ color: "#3b82f6", flexShrink: 0 }}>
            <LocationIcon />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "0", fontSize: "9px", color: "#666", fontWeight: "500" }}>
              LOCATION
            </p>
            <p
              style={{
                margin: "2px 0 0 0",
                fontSize: "11px",
                color: "#1a1a1a",
                fontWeight: "600",
                wordBreak: "break-word",
              }}
            >
              {location?.name || "N/A"}
            </p>
            {location?.sector && (
              <p style={{ margin: "2px 0 0 0", fontSize: "8px", color: "#666" }}>
                {location.sector}
              </p>
            )}
          </div>
        </div>

        {/* Category */}
        <div
          style={{
            padding: "8px",
            backgroundColor: "#f0f5ff",
            borderRadius: "4px",
            display: "flex",
            gap: "8px",
          }}
        >
          <div style={{ color: "#3b82f6", flexShrink: 0 }}>
            <CategoryIcon />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "0", fontSize: "9px", color: "#666", fontWeight: "500" }}>
              CATEGORY
            </p>
            <p
              style={{
                margin: "2px 0 0 0",
                fontSize: "11px",
                color: "#1a1a1a",
                fontWeight: "600",
                wordBreak: "break-word",
              }}
            >
              {category?.name || "N/A"}
            </p>
          </div>
        </div>

        {/* Tare Weight */}
        <div
          style={{
            padding: "8px",
            backgroundColor: "#f0f5ff",
            borderRadius: "4px",
            display: "flex",
            gap: "8px",
          }}
        >
          <div style={{ color: "#3b82f6", flexShrink: 0 }}>
            <WeightIcon />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0", fontSize: "9px", color: "#666", fontWeight: "500" }}>
              TARE WEIGHT
            </p>
            <p
              style={{
                margin: "2px 0 0 0",
                fontSize: "11px",
                color: "#1a1a1a",
                fontWeight: "600",
              }}
            >
              {container.tare_weight}kg
            </p>
          </div>
        </div>

        {/* Volume */}
        <div
          style={{
            padding: "8px",
            backgroundColor: "#f0f5ff",
            borderRadius: "4px",
            display: "flex",
            gap: "8px",
          }}
        >
          <div style={{ color: "#3b82f6", flexShrink: 0 }}>
            <VolumeIcon />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0", fontSize: "9px", color: "#666", fontWeight: "500" }}>
              VOLUME
            </p>
            <p
              style={{
                margin: "2px 0 0 0",
                fontSize: "11px",
                color: "#1a1a1a",
                fontWeight: "600",
              }}
            >
              {container.volume_liters}L
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "auto" }}>
        <p
          style={{
            margin: "0",
            fontSize: "8px",
            color: "#999",
            textAlign: "center",
            lineHeight: "1.4",
          }}
        >
          Generated: {new Date().toISOString().split("T")[0]} • Valid for EcoCampus Intranet
        </p>
      </div>
    </div>
  );
}