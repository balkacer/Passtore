import { useEffect } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { parseTempAuthDeepLink } from '@/lib/parseTempAuthDeepLink';

type Props = {
  navigate: NavigateFunction;
};

/**
 * Solo activo dentro del WebView de Tauri (`@tauri-apps/plugin-deep-link`).
 * En navegador normal el import falla y se ignora.
 */
export function TauriDeepLinkBridge({ navigate }: Props) {
  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;

    void (async () => {
      try {
        const { getCurrent, onOpenUrl } = await import(
          '@tauri-apps/plugin-deep-link'
        );

        const handle = (urls: string[]) => {
          for (const raw of urls) {
            const parsed = parseTempAuthDeepLink(raw);
            if (!parsed) continue;
            if (parsed.kind === 'pairing') {
              const q = new URLSearchParams({
                sid: parsed.sessionId,
                code: parsed.pairingCode,
              });
              navigate(`/temp-auth/pair?${q.toString()}`, { replace: true });
              return;
            }
            navigate(
              `/temp-auth/delivery?requestId=${encodeURIComponent(parsed.requestId)}`,
              { replace: true },
            );
            return;
          }
        };

        const initial = await getCurrent();
        if (!cancelled && initial?.length) {
          handle(initial);
        }

        unlisten = await onOpenUrl((urls) => {
          if (!cancelled && urls?.length) handle(urls);
        });
      } catch {
        /* no es entorno Tauri */
      }
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [navigate]);

  return null;
}
