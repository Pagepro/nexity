import { Styleguide } from "@/ui/styleguide";
import { parseDesignTokens } from "@/ui/styleguide/parse-design-tokens";
import { StudioAuthGate } from "@/ui/styleguide/studio-auth-gate";

// The Studio gate is client-side only: the static shell still prerenders.
export const dynamic = "force-static";

const StyleguidePage = () => {
  const tokens = parseDesignTokens();

  return (
    <StudioAuthGate>
      <Styleguide tokens={tokens} />
    </StudioAuthGate>
  );
};

export default StyleguidePage;
