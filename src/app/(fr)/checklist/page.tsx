import { RegistrationChecklist } from "../../../site/checklist";
import { SiteFrame } from "../../../site/frame";

export const metadata = { title: "Checklist de création à distance | Max Bara" };

export default function ChecklistPage() {
  return <SiteFrame locale="fr" alternateHref="/en/checklist"><RegistrationChecklist locale="fr" /></SiteFrame>;
}
