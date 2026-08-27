import { getOwnerCafe } from "@/actions/cafes";
import { OwnerSettings } from "@/components/owner-settings";

export default async function OwnerSettingsPage() {
  const cafe = await getOwnerCafe();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sozlamalar</h1>
      <OwnerSettings
        cafe={{
          name: cafe.name,
          slug: cafe.slug,
          description: cafe.description,
          address: cafe.address,
          locationUrl: cafe.locationUrl,
          workingHours: cafe.workingHours,
          contactPhone: cafe.contactPhone,
          instagramUrl: cafe.instagramUrl,
          telegramUrl: cafe.telegramUrl,
          deliveryFee: cafe.deliveryFee,
          minOrderTotal: cafe.minOrderTotal,
        }}
      />
    </div>
  );
}
