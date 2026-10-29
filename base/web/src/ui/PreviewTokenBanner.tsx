import { VscWarning } from "react-icons/vsc";

const PreviewTokenBanner = () => (
  <div
    role="alert"
    className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-center text-14 font-medium text-destructive-foreground"
  >
    <VscWarning className="size-4 shrink-0" aria-hidden />
    <span>
      Sanity preview token is invalid or expired — live preview updates are disabled.
      Please contact the tech team to check this.
    </span>
  </div>
);

export default PreviewTokenBanner;
