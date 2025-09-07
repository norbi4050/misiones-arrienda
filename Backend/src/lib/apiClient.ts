export async function fetchUserProfile() {
  const res = await fetch("/api/users/profile", { method: "GET", credentials: "include" });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Not authenticated");
    if (res.status === 404) throw new Error("Profile not found");
    try {
      const err = await res.json();
      throw new Error(err?.error || `Profile fetch failed: ${res.status}`);
    } catch {
      throw new Error(`Profile fetch failed: ${res.status}`);
    }
  }
  return res.json(); // { profile: ... }
}
