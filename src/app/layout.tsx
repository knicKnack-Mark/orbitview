
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_APP_NAME ?? "OrbitView"} | Space & Earth Monitor`,
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? "Space and Earth Monitor",
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
