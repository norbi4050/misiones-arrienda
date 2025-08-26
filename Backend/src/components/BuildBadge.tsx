'use client';
import { useEffect, useState } from 'react';

type Info = { commit?: string; branch?: string; url?: string; at?: string };

export default function BuildBadge() {
  const [v, setV] = useState<Info | null>(null);
  useEffect(() => { fetch('/api/version').then(r=>r.json()).then(setV).catch(()=>{}); }, []);
  if (!v?.commit) return null;
  return (
    <div style={{fontSize:'12px',opacity:.7,marginTop:'8px'}}>
      build {v.commit} · {v.branch} · {v.url}
    </div>
  );
}
