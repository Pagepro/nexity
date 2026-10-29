// Node's type stripper resolves imports like plain Node (no tsconfig paths, no
// extension guessing); `resolve.mjs` adds those two for `pnpm test`.
import { register } from "node:module";

register("./resolve.mjs", import.meta.url);
