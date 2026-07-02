import { promises as fs } from 'fs';
import path from 'path';

// Site version, e.g. "V01.001". Stored in the VERSION file at the repo root;
// push.bat bumps the minor part on every push. Shown in the footer of every page.
let cached: string | null = null;

export async function getVersion(): Promise<string> {
  if (cached) return cached;
  try {
    const v = (await fs.readFile(path.join(process.cwd(), 'VERSION'), 'utf8')).trim();
    if (process.env.NODE_ENV === 'production') cached = v;
    return v;
  } catch {
    return '';
  }
}
