import type { Query } from "../../../site/answers";
import { EstimatePage } from "../../../site/pages";

export default function Quote({ searchParams }: { searchParams: Promise<Query> }) {
  return <EstimatePage locale="fr" query={searchParams} />;
}
