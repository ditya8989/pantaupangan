import { DashboardView } from "@/components/dashboard-view";
import { PageTransition } from "@/components/page-transition";
import { RememberRegion } from "@/components/remember-region";
import { NATIONAL } from "@/lib/reference";

export default function HomePage() {
  return (
    <>
      <RememberRegion />
      <PageTransition>
        <DashboardView region={NATIONAL} />
      </PageTransition>
    </>
  );
}
