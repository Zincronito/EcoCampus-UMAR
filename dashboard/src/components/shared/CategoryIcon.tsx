"use client";

import {
  // Reciclaje y residuos
  Recycle,
  Trash2,
  ShoppingBag,
  Package,
  // Orgánicos
  Leaf,
  Apple,
  Sprout,
  TreePine,
  // Líquidos / Húmedos
  Droplet,
  Wine,
  Coffee,
  Waves,
  // Papel / Cartón
  Newspaper,
  BookOpen,
  Archive,
  FileText,
  // Peligrosos / Especiales
  FlaskConical,
  Battery,
  Zap,
  AlertOctagon,
  // Vidrio / Metal
  Gem,
  Lightbulb,
  // Tecnológicos
  Laptop,
  Smartphone,
  // Médicos
  Cross,
  Pill,
} from "lucide-react";

const ICON_MAP = {
  // Reciclaje y residuos
  recycle: Recycle,
  trash: Trash2,
  bag: ShoppingBag,
  package: Package,
  // Orgánicos
  leaf: Leaf,
  apple: Apple,
  sprout: Sprout,
  tree: TreePine,
  // Líquidos / Húmedos
  droplet: Droplet,
  bottle: Wine,
  coffee: Coffee,
  waves: Waves,
  // Papel / Cartón
  newspaper: Newspaper,
  book: BookOpen,
  archive: Archive,
  file: FileText,
  // Peligrosos / Especiales
  flask: FlaskConical,
  battery: Battery,
  zap: Zap,
  alert: AlertOctagon,
  // Vidrio / Metal
  gem: Gem,
  bulb: Lightbulb,
  // Tecnológicos
  laptop: Laptop,
  phone: Smartphone,
  // Médicos
  cross: Cross,
  pill: Pill,
};

interface CategoryIconProps {
  icon: string | null | undefined;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export default function CategoryIcon({
  icon,
  size = 28,
  color = "#6b7280",
  strokeWidth = 2,
  className,
}: CategoryIconProps) {
  const IconComponent = (icon && ICON_MAP[icon as keyof typeof ICON_MAP]) || Leaf;

  return (
    <IconComponent
      width={size}
      height={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
    />
  );
}