import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "e-cafe.uz",
    short_name: "e-cafe",
    description: "Kafelar uchun QR-buyurtma va POS platformasi",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#d6551c",
    icons: [],
  };
}
