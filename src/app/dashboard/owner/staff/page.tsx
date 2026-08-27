import { listOwnerStaff } from "@/actions/staff";
import { OwnerStaffManager } from "@/components/owner-staff-manager";

export default async function OwnerStaffPage() {
  const staff = await listOwnerStaff();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Xodimlar</h1>
      <OwnerStaffManager initialStaff={staff} />
    </div>
  );
}
