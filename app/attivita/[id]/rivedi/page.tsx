import { RivediEntry } from "@/components/rivedi/RivediEntry";
import { ATTIVITA_STATIC_PARAMS } from "@/lib/idsAttivita";

export function generateStaticParams() {
  return ATTIVITA_STATIC_PARAMS;
}

export default async function RivediPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RivediEntry id={id} />;
}
