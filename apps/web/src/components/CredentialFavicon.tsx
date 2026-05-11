import { useEffect, useMemo, useState } from 'react';
import {
  duckDuckGoFaviconUrl,
  resolveFaviconUrl,
  resolveHostnameForFavicon,
} from '@/lib/favicon';

type Props = {
  iconUrl?: string | null;
  url?: string | null;
  alias: string;
  size?: number;
  className?: string;
};

/**
 * Favicon for a credential. Uses stored iconUrl, else Google favicons from URL domain.
 * `referrerPolicy="no-referrer"` avoids some hotlink blocks; on error tries DuckDuckGo; then initial letter.
 */
export function CredentialFavicon({
  iconUrl,
  url,
  alias,
  size = 40,
  className = '',
}: Props) {
  const initial = (alias.trim().slice(0, 1) || '?').toUpperCase();
  const host = resolveHostnameForFavicon(url);

  const chain = useMemo(() => {
    const out: string[] = [];
    const direct = iconUrl?.trim();
    if (direct) {
      out.push(direct);
    }
    const g = resolveFaviconUrl(url);
    if (g && !out.includes(g)) {
      out.push(g);
    }
    if (host) {
      const ddg = duckDuckGoFaviconUrl(host);
      if (!out.includes(ddg)) {
        out.push(ddg);
      }
    }
    return out;
  }, [iconUrl, url, host]);

  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setIndex(0);
    setFailed(false);
  }, [iconUrl, url]);

  const src = chain[index];

  if (!src || failed) {
    return (
      <div
        className={`cred-favicon cred-favicon-fallback ${className}`.trim()}
        style={{ width: size, height: size, fontSize: size * 0.42 }}
        aria-hidden>
        {initial}
      </div>
    );
  }

  return (
    <img
      key={src}
      src={src}
      alt=""
      width={size}
      height={size}
      className={`cred-favicon ${className}`.trim()}
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
      onError={() => {
        if (index + 1 < chain.length) {
          setIndex((i) => i + 1);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
