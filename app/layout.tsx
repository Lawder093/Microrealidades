import type { Metadata } from "next";
import "./globals.css";
import { EcosystemProvider } from "@/components/ecosystem-provider";
import { MicrohubAuthProvider } from "@/components/microhub-auth-provider";
export const metadata: Metadata = {
  title: "Microrealidades — Psicología, Tecnología y Comunalidad",
  description: "Laboratorio de herramientas, contenidos y experiencias para comprender y transformar la vida cotidiana.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body><MicrohubAuthProvider><EcosystemProvider>{children}</EcosystemProvider></MicrohubAuthProvider></body></html>;
}
