import { ConduciEntry } from "@/components/conduci/ConduciEntry";
import { ATTIVITA_STATIC_PARAMS } from "@/lib/idsAttivita";

// Route statiche generate per l'export: una per ogni kit conosciuto.
export function generateStaticParams() {
  return ATTIVITA_STATIC_PARAMS;
}

export default function ConduciPage() {
  return <ConduciEntry />;
}
