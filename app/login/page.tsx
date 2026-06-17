"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";

export default function LoginPage() {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  async function handleSubmit(fullPin: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: fullPin }),
      });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Incorrect PIN");
        setPin(["", "", "", ""]);
        setTimeout(() => inputs.current[0]?.focus(), 50);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleInput(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const updated = [...pin];
    updated[index] = value;
    setPin(updated);
    setError("");
    if (value && index < 3) inputs.current[index + 1]?.focus();
    if (value && index === 3) {
      const full = [...updated].join("");
      if (full.length === 4) handleSubmit(full);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "rgb(9,9,11)" }}
    >
      <div className="w-full max-w-[300px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-12">
          <div
            className="w-16 h-16 rounded-[22px] flex items-center justify-center mb-6"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              boxShadow: "0 20px 40px -8px rgba(109,40,217,0.45)",
            }}
          >
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-[22px] font-semibold text-white tracking-tight">LifeOS</h1>
          <p className="text-[13px] mt-1.5" style={{ color: "rgb(100,100,115)" }}>
            Enter your PIN
          </p>
        </div>

        {/* PIN boxes */}
        <div className="flex justify-center gap-4 mb-6">
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              className="w-14 h-14 text-center text-[18px] font-semibold text-white caret-transparent rounded-2xl transition-all duration-150 focus:outline-none"
              style={{
                background: "rgb(22,22,26)",
                border: error
                  ? "2px solid rgba(248,113,113,0.5)"
                  : digit
                    ? "2px solid rgba(139,92,246,0.6)"
                    : "2px solid rgba(255,255,255,0.08)",
                boxShadow: digit ? "0 0 0 4px rgba(139,92,246,0.08)" : "none",
              }}
            />
          ))}
        </div>

        {/* Feedback */}
        {error && (
          <p className="text-center text-[13px] text-red-400 animate-fade-in mb-4">{error}</p>
        )}
        {loading && (
          <div className="flex justify-center">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "rgba(139,92,246,0.4)", borderTopColor: "rgb(139,92,246)" }}
            />
          </div>
        )}

        <p
          className="text-center text-[11px] mt-14"
          style={{ color: "rgb(55,55,68)" }}
        >
          lifeos.vishrudh.tech
        </p>
      </div>
    </div>
  );
}
