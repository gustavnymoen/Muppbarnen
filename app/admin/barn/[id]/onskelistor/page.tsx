import { Suspense } from "react";
import { FoldGroup } from "@/app/components/Fold";
import { listWishlists } from "@/lib/family";
import { OCCASIONS } from "@/lib/form-input";
import { KidPage } from "../KidPage";
import { ArchiveSection, WishlistSection } from "../WishlistSection";

// Bara barnets önskelistor, "Födelsedag" och "Jul" (MUPP-010-R5), och under dem arkivet (MUPP-031-R5)
export default function WishlistsPage({ params }: PageProps<"/admin/barn/[id]/onskelistor">) {
  return (
    <Suspense fallback={null}>
      <KidPage
        params={params}
        content={async (child) => {
          const lists = await listWishlists(child);
          return (
            <FoldGroup>
              <div className="space-y-4">
                {OCCASIONS.map((occasion) => (
                  <WishlistSection key={occasion} child={child} occasion={occasion} items={lists[occasion]} />
                ))}
                <ArchiveSection groups={lists.archive} />
              </div>
            </FoldGroup>
          );
        }}
      />
    </Suspense>
  );
}
