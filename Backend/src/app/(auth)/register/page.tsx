"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return setMsg(`Error: ${error.message}`);
    // Si Confirm Email está ON, el user queda "unconfirmed" hasta verificar el mail
    setMsg("¡Listo! Revisá tu email para confirmar la cuenta.");
  }

  return (
    <form onSubmit={onSubmit} style={{display:"grid", gap:12, maxWidth:360}}>
      <h1>Crear cuenta</h1>
      <input type="email" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} required />
      <input type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} required />
      <button type="submit">Registrarme</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
