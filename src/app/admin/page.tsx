"use client";

import { useEffect, useMemo, useState } from "react";
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

type CityStats = {
  total: number;
  approved: number;
  pending: number;
  refused: number;
};

export default function AdminPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");

  async function loadProfiles() {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setProfiles((data || []) as Profile[]);
    setLoading(false);
  }

  async function updateStatus(
    id: string,
    status: "approved" | "pending" | "refused"
  ) {
    await supabase
      .from("profiles")
      .update({ verification_status: status })
      .eq("id", id);

    await loadProfiles();
  }

  useEffect(() => {
    loadProfiles();
  }, [supabase]);

  const couriers = profiles.filter((p) => p.role === "livreur");
  const users = profiles.filter((p) => p.role !== "livreur");

  const filteredCouriers = filterProfiles(couriers, search, cityFilter);
  const filteredUsers = filterProfiles(users, search, cityFilter);

  const allCities = Array.from(
    new Set(profiles.map((p) => p.city || "Ville inconnue"))
  ).sort();

  const courierCities = groupByCity(couriers);
  const userCities = groupByCity(users);

  const approved = couriers.filter((p) => p.verification_status === "approved").length;
  const pending = couriers.filter(
    (p) => !p.verification_status || p.verification_status === "pending"
  ).length;
  const refused = couriers.filter((p) => p.verification_status === "refused").length;

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <h1 className="text-3xl font-bold">Administration HelpFlow</h1>
          <p className="mt-2 text-slate-300">
            Gestion des livreurs, utilisateurs, villes, documents et validations.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-5">
          <Stat title="Livreurs" value={couriers.length} color="bg-blue-600" />
          <Stat title="Approuvés" value={approved} color="bg-green-600" />
          <Stat title="En attente" value={pending} color="bg-orange-500" />
          <Stat title="Refusés" value={refused} color="bg-red-600" />
          <Stat title="Utilisateurs" value={users.length} color="bg-slate-800" />
        </div>

        <section className="mb-8 rounded-3xl bg-white p-6 shadow">
          <div className="grid gap-4 md:grid-cols-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher nom, email, téléphone, ville..."
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3"
            >
              <option value="all">Toutes les villes</option>
              {allCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <button
              onClick={loadProfiles}
              className="rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white"
            >
              Rafraîchir
            </button>
          </div>
        </section>

        <section className="mb-8 rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-bold">Livreurs par ville</h2>

          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(courierCities).map(([city, stats]) => (
              <CityCard key={city} city={city} stats={stats} type="livreur" />
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-3xl bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-bold">Utilisateurs par ville</h2>

          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(userCities).map(([city, stats]) => (
              <CityCard key={city} city={city} stats={stats} type="utilisateur" />
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-3xl bg-white p-6 shadow">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-bold">Liste des livreurs</h2>

            <button
              onClick={() => exportCSV(filteredCouriers, "livreurs-helpflow.csv")}
              className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white"
            >
              Exporter livreurs CSV
            </button>
          </div>

          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] border-collapse text-left">
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
                    <th className="p-3">Inscription</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCouriers.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-3">{p.full_name || "-"}</td>
                      <td className="p-3">{p.email || "-"}</td>
                      <td className="p-3">{p.phone || "-"}</td>
                      <td className="p-3">{p.city || "Ville inconnue"}</td>
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
                      <td className="p-3">{formatDate(p.created_at)}</td>
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

              {filteredCouriers.length === 0 && (
                <p className="p-4 text-slate-500">Aucun livreur trouvé.</p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-bold">Liste des utilisateurs</h2>

            <button
              onClick={() => exportCSV(filteredUsers, "utilisateurs-helpflow.csv")}
              className="rounded-xl bg-slate-800 px-4 py-2 font-semibold text-white"
            >
              Exporter utilisateurs CSV
            </button>
          </div>

          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-200">
                    <th className="p-3">Nom</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Téléphone</th>
                    <th className="p-3">Ville</th>
                    <th className="p-3">Inscription</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-3">{p.full_name || "-"}</td>
                      <td className="p-3">{p.email || "-"}</td>
                      <td className="p-3">{p.phone || "-"}</td>
                      <td className="p-3">{p.city || "Ville inconnue"}</td>
                      <td className="p-3">{formatDate(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <p className="p-4 text-slate-500">Aucun utilisateur trouvé.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function filterProfiles(profiles: Profile[], search: string, cityFilter: string) {
  const s = search.toLowerCase().trim();

  return profiles.filter((p) => {
    const city = p.city || "Ville inconnue";

    const matchCity = cityFilter === "all" || city === cityFilter;

    const matchSearch =
      !s ||
      `${p.full_name || ""} ${p.email || ""} ${p.phone || ""} ${p.city || ""}`
        .toLowerCase()
        .includes(s);

    return matchCity && matchSearch;
  });
}

function groupByCity(profiles: Profile[]) {
  return profiles.reduce<Record<string, CityStats>>((acc, p) => {
    const city = p.city || "Ville inconnue";

    if (!acc[city]) {
      acc[city] = { total: 0, approved: 0, pending: 0, refused: 0 };
    }

    acc[city].total++;

    if (p.verification_status === "approved") acc[city].approved++;
    else if (p.verification_status === "refused") acc[city].refused++;
    else acc[city].pending++;

    return acc;
  }, {});
}

function exportCSV(profiles: Profile[], filename: string) {
  const rows = [
    ["Nom", "Email", "Téléphone", "Ville", "Rôle", "Statut", "Inscription"],
    ...profiles.map((p) => [
      p.full_name || "",
      p.email || "",
      p.phone || "",
      p.city || "",
      p.role || "",
      p.verification_status || "",
      formatDate(p.created_at),
    ]),
  ];

  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(";")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function formatDate(date: string | null) {
  if (!date) return "-";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function Stat({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`${color} rounded-3xl p-6 text-white shadow`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-4xl font-bold">{value}</p>
    </div>
  );
}

function CityCard({
  city,
  stats,
  type,
}: {
  city: string;
  stats: CityStats;
  type: "livreur" | "utilisateur";
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <h3 className="text-xl font-bold">{city}</h3>
      <p>Total {type}s : {stats.total}</p>

      {type === "livreur" && (
        <>
          <p className="font-semibold text-green-700">
            Approuvés : {stats.approved}
          </p>
          <p className="font-semibold text-orange-600">
            En attente : {stats.pending}
          </p>
          <p className="font-semibold text-red-600">
            Refusés : {stats.refused}
          </p>
        </>
      )}
    </div>
  );
}

function Status({ status }: { status: string | null }) {
  if (status === "approved") {
    return (
      <span className="rounded-full bg-green-100 px-3 py-1 font-semibold text-green-700">
        Approuvé
      </span>
    );
  }

  if (status === "refused") {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-700">
        Refusé
      </span>
    );
  }

  return (
    <span className="rounded-full bg-orange-100 px-3 py-1 font-semibold text-orange-700">
      En attente
    </span>
  );
}