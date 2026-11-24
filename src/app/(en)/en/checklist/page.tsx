import { RegistrationChecklist } from "../../../../site/checklist";
import { SiteFrame } from "../../../../site/frame";

export const metadata = { title: "Company registration checklist | Max Bara" };

export default function ChecklistPage() {
  return <SiteFrame locale="en" alternateHref="/checklist"><RegistrationChecklist locale="en" /></SiteFrame>;
}
