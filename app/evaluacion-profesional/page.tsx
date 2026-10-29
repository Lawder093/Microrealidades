import { redirect } from "next/navigation";

export const metadata = {
  title: "Evaluación Profesional — Microrealidades",
  description: "Instrumento de trabajo en revisión para el perfil de puesto de terapeuta.",
};

export default function ProfessionalEvaluationPage() {
  redirect("/evaluaciones-psicometricas");
}
