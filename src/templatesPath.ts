import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

// Compiled output lives in dist/, templates/ ships alongside it at the package root.
export const TEMPLATES_DIR = join(here, "..", "templates");
