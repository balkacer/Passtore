import { spawnSync } from 'node:child_process';

/** Intenta copiar texto al portapapeles del sistema (sin dependencias). */
export function copyToClipboard(text: string): boolean {
  try {
    if (process.platform === 'win32') {
      const r = spawnSync('clip', [], {
        input: Buffer.from(text, 'utf16le'),
        windowsHide: true,
      });
      return r.status === 0;
    }
    if (process.platform === 'darwin') {
      const r = spawnSync('pbcopy', [], {
        input: text,
        encoding: 'utf8',
        windowsHide: true,
      });
      return r.status === 0;
    }
    try {
      const r = spawnSync(
        'xclip',
        ['-selection', 'clipboard'],
        { input: text, encoding: 'utf8', windowsHide: true },
      );
      if (r.status === 0) return true;
    } catch {
      /* fall through */
    }
    const r = spawnSync('wl-copy', [], {
      input: text,
      encoding: 'utf8',
      windowsHide: true,
    });
    return r.status === 0;
  } catch {
    return false;
  }
}
