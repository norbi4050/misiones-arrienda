"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(`Error: ${error.message}`);
    
    setMsg("¡Login exitoso! Redirigiendo...");
    router.push("/dashboard");
  }

  return (
    <form onSubmit={onSubmit} style={{display:"grid", gap:12, maxWidth:360}}>
      <h1>Iniciar sesión</h1>
      <input type="email" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} required />
      <input type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} required />
      <button type="submit">Entrar</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
