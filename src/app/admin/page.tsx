"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  city: string | null;
  vehicle_type: string | null;
  vehicle_details: string | null;
  intervention_radius: number | null;
  verification_status: string | null;
  identity_document_path: string | null;
  created_at: string | null;
};

export default function AdminPage() {
  const supabase = supabaseBrowser();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadProfiles() {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "livreur")
      .order("created_at", { ascending: false });

    if (!error) setProfiles((data || []) as Profile[]);
    setLoading(false);
  }

  async function updateStatus(id: string, status: "approved" | "pending" | "refused") {
    await supabase
      .from("profiles")
      .update({ verification_status: status })
      .eq("id", id);

    await loadProfiles();
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  const total = profiles.length;
  const approved = profiles.filter((p) => p.verification_status === "approved").length;
  const pending = profiles.filter((p) => !p.verification_status || p.verification_status === "pending").length;
  const refused = profiles.filter((p) => p.verification_status === "refused").length;

  const cities = profiles.reduce<Record<string, { total: number; approved: number; pending: number }>>(
    (acc, p) => {
      const city = p.city || "Ville inconnue";
      if (!acc[city]) acc[city] = { total: 0, approved: 0, pending: 0 };
      acc[city].total++;
      if (p.verification_status === "approved") acc[city].approved++;
      if (!p.verification_status || p.verification_status === "pending") acc[city].pending++;
      return acc;
    },
    {}
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-bold">Administration HelpFlow</h1>
          <p className="mt-2 text-slate-300">
            Validation des livreurs, documents, villes et disponibilité.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Stat title="Total livreurs" value={total} color="bg-blue-600" />
          <Stat title="Approuvés" value={approved} color="bg-green-600" />
          <Stat title="En attente" value={pending} color="bg-orange-500" />
          <Stat title="Refusés" value={refused} color="bg-red-600" />
        </div>

        <section className="mb-8 rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-bold">Villes</h2>

          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(cities).map(([city, stats]) => (
              <div key={city} className="rounded-2xl border border-slate-200 p-4">
                <h3 className="text-xl font-bold">{city}</h3>
                <p>Total livreurs : {stats.total}</p>
                <p className="font-semibold text-green-700">
                  Disponibles : {stats.approved}
                </p>
                <p className="font-semibold text-orange-600">
                  En attente : {stats.pending}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Liste des livreurs</h2>

            <button
              onClick={loadProfiles}
              className="rounded-xl bg-slate-950 px-4 py-2 font-semibold text-white"
            >
              Rafraîchir
            </button>
          </div>

          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-200">
                    <th className="p-3">Nom</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Téléphone</th>
                    <th className="p-3">Ville</th>
                    <th className="p-3">Véhicule</th>
                    <th className="p-3">Rayon</th>
                    <th className="p-3">Statut</th>
                    <th className="p-3">Document</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {profiles.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-3">{p.full_name || "-"}</td>
                      <td className="p-3">{p.email || "-"}</td>
                      <td className="p-3">{p.phone || "-"}</td>
                      <td className="p-3">{p.city || "-"}</td>
                      <td className="p-3">{p.vehicle_type || p.vehicle_details || "-"}</td>
                      <td className="p-3">
                        {p.intervention_radius ? `${p.intervention_radius} km` : "-"}
                      </td>
                      <td className="p-3">
                        <Status status={p.verification_status} />
                      </td>
                      <td className="p-3">
                        {p.identity_document_path ? (
                          <a
                            href={p.identity_document_path}
                            target="_blank"
                            className="font-semibold text-blue-600 underline"
                          >
                            Voir
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(p.id, "approved")}
                            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white"
                          >
                            Approuver
                          </button>

                          <button
                            onClick={() => updateStatus(p.id, "pending")}
                            className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white"
                          >
                            Attente
                          </button>

                          <button
                            onClick={() => updateStatus(p.id, "refused")}
                            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                          >
                            Refuser
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className={`${color} rounded-3xl p-6 text-white shadow`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-4xl font-bold">{value}</p>
    </div>
  );
}

function Status({ status }: { status: string | null }) {
  if (status === "approved") {
    return <span className="rounded-full bg-green-100 px-3 py-1 font-semibold text-green-700">Approuvé</span>;
  }

  if (status === "refused") {
    return <span className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-700">Refusé</span>;
  }

  return <span className="rounded-full bg-orange-100 px-3 py-1 font-semibold text-orange-700">En attente</span>;
}