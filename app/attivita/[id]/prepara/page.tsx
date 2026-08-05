import { PreparaClient } from "@/components/prepara/PreparaClient";
import { ATTIVITA_STATIC_PARAMS } from "@/lib/idsAttivita";

export function generateStaticParams() {
  return ATTIVITA_STATIC_PARAMS;
}

export default async function PreparaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PreparaClient attivitaId={id} />;
}
