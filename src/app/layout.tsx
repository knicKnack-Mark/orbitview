
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OrbitView | Space & Earth Monitor",
  description:
    "Explore an interactive 3D Earth, track the International Space Station, and discover the latest spaceflight news.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
