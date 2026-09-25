"use client";

import { useEffect, useState } from "react";
import { FiSave } from "react-icons/fi";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    schoolName: "",
    address: "",
    phone: "",
    email: "",
    logoUrl: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/schoolSettings");
        if (res.ok) {
          const data = await res.json();
          setForm({
            schoolName: data.schoolName || "",
            address: data.address || "",
            phone: data.phone || "",
            email: data.email || "",
            logoUrl: data.logoUrl || "",
          });
        }
      } catch {
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/schoolSettings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save");
      setSuccess("Settings saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading...</div>;
  }

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all";

  return (
    <div className="min-h-screen p-6 md:p-12 text-gray-900">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            School settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the global school configuration.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm space-y-5"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="schoolName"
              className="text-sm font-medium text-gray-600"
            >
              School Name
            </label>
            <input
              id="schoolName"
              name="schoolName"
              value={form.schoolName}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="address"
              className="text-sm font-medium text-gray-600"
            >
              Address
            </label>
            <input
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="phone"
              className="text-sm font-medium text-gray-600"
            >
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-600"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="logoUrl"
              className="text-sm font-medium text-gray-600"
            >
              Logo URL
            </label>
            <input
              id="logoUrl"
              name="logoUrl"
              value={form.logoUrl}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-xl text-sm transition-all disabled:opacity-50"
          >
            <FiSave /> {saving ? "Saving..." : "Save settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
