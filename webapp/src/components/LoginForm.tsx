"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  alertErrorClass,
  alertInfoClass,
  buttonPrimaryClass,
  inputClass,
  labelClass,
} from "@/components/ui/classes";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      router.push("/chat");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className={alertInfoClass}>
        Demo account: <strong>admin</strong> / <strong>admin123</strong>
      </div>

      <div>
        <label htmlFor="username" className={labelClass}>
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className={inputClass}
          autoComplete="username"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
          autoComplete="current-password"
          required
        />
      </div>

      {error ? <p className={alertErrorClass}>{error}</p> : null}

      <button type="submit" disabled={loading} className={`${buttonPrimaryClass} w-full`}>
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
