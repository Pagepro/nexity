import { SectionsGallery } from "@/ui/styleguide/sections-gallery";
import { getSectionUsage } from "@/ui/styleguide/sections-gallery/usage";
import { StudioAuthGate } from "@/ui/styleguide/studio-auth-gate";

// Never force-dynamic: it would re-render the heavy gallery on every request.
export const revalidate = 300;

const SectionsGalleryPage = async () => {
  const usage = await getSectionUsage();

  return (
    <StudioAuthGate>
      <SectionsGallery usage={usage} />
    </StudioAuthGate>
  );
};

export default SectionsGalleryPage;
