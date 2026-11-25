import { defineMigration, set } from "sanity/migrate";

// Run from studio/ right after deploying the `form` schema and web code: until it runs, pages
// skip their old contact-form sections. `pnpm exec sanity migration run
// rename-contact-form-to-form` is a dry run; add `--no-dry-run` to write.
export default defineMigration({
  title: "Rename the contact-form section to form (contact type)",
  migrate: {
    object(node) {
      if (node._type !== "contact-form") return;

      return set({ ...node, _type: "form", formType: "contact" });
    },
  },
});
