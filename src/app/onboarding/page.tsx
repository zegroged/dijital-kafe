import { requireRestaurant, requireUser } from "@/lib/auth/session";
import type { PlanKey } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getImageEnhanceProvider } from "@/lib/services/nanobanana";
import { OnboardingWizard } from "@/components/onboarding/wizard";

// Kurulum sihirbazı: yeni işletme sahibini 3 adımda (şablon → ilk yemek →
// yayınla) menüsünü hazır hale getirmeye yönlendirir.
export default async function OnboardingPage() {
  const user = await requireUser();
  const restaurant = await requireRestaurant(user.id);
  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });
  const plan = (subscription?.plan ?? "free_trial") as PlanKey;
  const aiEnhanceEnabled = getImageEnhanceProvider().isConfigured();

  return (
    <main className="min-h-dvh bg-muted/30 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <OnboardingWizard
          businessName={restaurant.businessName}
          initialPublished={restaurant.menu?.isPublished ?? false}
          aiEnhanceEnabled={aiEnhanceEnabled}
          plan={plan}
        />
      </div>
    </main>
  );
}
