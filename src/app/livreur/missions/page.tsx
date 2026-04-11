"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

type Order = {
  id: string;
  pickup_address: string | null;
  dropoff_address: string | null;
  price_cents: number | null;
  status: OrderStatus;
  courier_id: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function euros(cents: number | null) {
  if (cents == null) return "-";
  return (cents / 100).toFixed(2) + " €";
}

export default function MissionsPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [available, setAvailable] = useState<Order[]>([]);
  const [myMissions, setMyMissions] = useState<Order[]>([]);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpLoadingId, setOtpLoadingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  async function requireAuth() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("AUTH GET USER ERROR =>", error);
        router.push("/login");
        return null;
      }

      if (!user) {
        router.push("/login");
        return null;
      }

      setUserId(user.id);
      return user.id;
    } catch (err) {
      console.error("REQUIRE AUTH ERROR =>", err);
      router.push("/login");
      return null;
    }
  }

  async function loadOrders(uid: string, silent = false) {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError(null);

    try {
      const { data: availableData, error: availableError } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "PENDING")
        .is("courier_id", null)
        .order("created_at", { ascending: false });

      if (availableError) {
        console.error("LOAD AVAILABLE ORDERS ERROR =>", availableError);
        setError("Erreur chargement des missions disponibles.");
      }

      const { data: myData, error: myError } = await supabase
        .from("orders")
        .select("*")
        .eq("courier_id", uid)
        .in("status", ["ACCEPTED", "OUT_FOR_DELIVERY"])
        .order("created_at", { ascending: false });

      if (myError) {
        console.error("LOAD MY ORDERS ERROR =>", myError);
        setError("Erreur chargement de tes missions.");
      }

      setAvailable((availableData as Order[]) || []);
      setMyMissions((myData as Order[]) || []);
    } catch (err) {
      console.error("LOAD ORDERS UNCAUGHT ERROR =>", err);
      setError("Erreur serveur lors du chargement des commandes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function refreshOrders() {
    if (!userId) return;
    await loadOrders(userId, true);
  }

  async function takeMission(orderId: string) {
    if (!userId) {
      setError("Tu dois être connecté.");
      return;
    }

    setError(null);
    setActionLoadingId(orderId);

    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("orders")
        .update({
          status: "ACCEPTED",
          courier_id: userId,
          updated_at: now,
        })
        .eq("id", orderId)
        .eq("status", "PENDING")
        .is("courier_id", null);

      if (error) {
        console.error("TAKE MISSION ERROR =>", error);
        setError("Impossible de prendre la mission.");
        return;
      }

      await loadOrders(userId, true);
    } catch (err) {
      console.error("TAKE MISSION UNCAUGHT ERROR =>", err);
      setError("Erreur serveur lors de la prise de mission.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function startDelivery(orderId: string) {
    if (!userId) {
      setError("Tu dois être connecté.");
      return;
    }

    setError(null);
    setActionLoadingId(orderId);

    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("orders")
        .update({
          status: "OUT_FOR_DELIVERY",
          updated_at: now,
        })
        .eq("id", orderId)
        .eq("courier_id", userId)
        .eq("status", "ACCEPTED");

      if (error) {
        console.error("START DELIVERY ERROR =>", error);
        setError("Impossible de démarrer la livraison.");
        return;
      }

      await loadOrders(userId, true);
    } catch (err) {
      console.error("START DELIVERY UNCAUGHT ERROR =>", err);
      setError("Erreur serveur lors du démarrage de la livraison.");
    } finally {
      setActionLoadingId(null);
    }
  }

  function updateOtpInput(orderId: string, value: string) {
    const cleaned = value.replace(/\D/g, "").slice(0, 6);

    setOtpInputs((prev) => ({
      ...prev,
      [orderId]: cleaned,
    }));
  }

  async function validateOtpAndDeliver(orderId: string) {
    if (!userId) {
      setError("Tu dois être connecté.");
      return;
    }

    const inputOtp = (otpInputs[orderId] || "").trim();

    if (!inputOtp) {
      setError("Entre le code OTP du client.");
      return;
    }

    setError(null);
    setOtpLoadingId(orderId);

    try {
      console.log("VERIFY FINAL FRONT =>", {
  orderId,
  otp: inputOtp,
  mission: myMissions.find((m) => m.id === orderId),
});
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          otp: inputOtp,
        }),
      });

      const result = await res.json();

      console.log("VERIFY OTP RESPONSE =>", {
  status: res.status,
  result,
});

      if (!res.ok) {
        setError(result?.error || "Impossible de valider le code OTP.");
        return;
      }

      setOtpInputs((prev) => ({
        ...prev,
        [orderId]: "",
      }));

      await loadOrders(userId, true);
    } catch (err) {
      console.error("VALIDATE OTP ERROR =>", err);
      setError("Erreur réseau pendant la vérification OTP.");
    } finally {
      setOtpLoadingId(null);
    }
  }

  async function cancelMission(orderId: string) {
    if (!userId) {
      setError("Tu dois être connecté.");
      return;
    }

    setError(null);
    setActionLoadingId(orderId);

    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("orders")
        .update({
          status: "PENDING",
          courier_id: null,
          updated_at: now,
        })
        .eq("id", orderId)
        .eq("courier_id", userId)
        .in("status", ["ACCEPTED", "OUT_FOR_DELIVERY"]);

      if (error) {
        console.error("CANCEL MISSION ERROR =>", error);
        setError("Impossible d'annuler la mission.");
        return;
      }

      await loadOrders(userId, true);
    } catch (err) {
      console.error("CANCEL MISSION UNCAUGHT ERROR =>", err);
      setError("Erreur serveur lors de l'annulation de la mission.");
    } finally {
      setActionLoadingId(null);
    }
  }

  useEffect(() => {
    (async () => {
      const uid = await requireAuth();
      if (!uid) return;
      await loadOrders(uid);
    })();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Espace livreur</h1>

        <button
          type="button"
          className="px-3 py-2 rounded bg-black text-white text-sm"
          onClick={refreshOrders}
          disabled={refreshing || loading}
        >
          {refreshing ? "Rafraîchissement..." : "Rafraîchir"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded text-sm">
          {error}
        </div>
      )}

      {loading && <p>Chargement...</p>}

      {!loading && (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Missions disponibles</h2>

            {available.length === 0 && <p>Aucune mission disponible.</p>}

            {available.map((order) => (
              <div
                key={order.id}
                className="border p-4 rounded space-y-3"
              >
                <div>
                  <p className="font-semibold">
                    {order.pickup_address || "Adresse de retrait inconnue"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Livraison vers : {order.dropoff_address || "-"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Prix : {euros(order.price_cents)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Statut : {order.status}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => takeMission(order.id)}
                  disabled={actionLoadingId === order.id}
                  className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
                >
                  {actionLoadingId === order.id
                    ? "Prise..."
                    : "Prendre mission"}
                </button>
              </div>
            ))}
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Mes missions</h2>

            {myMissions.length === 0 && <p>Aucune mission en cours.</p>}

            {myMissions.map((order) => (
              <div
                key={order.id}
                className="border p-4 rounded space-y-3"
              >
                <div>
                  <p className="font-semibold">
                    {order.pickup_address || "Adresse de retrait inconnue"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Livraison vers : {order.dropoff_address || "-"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Prix : {euros(order.price_cents)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Statut : {order.status}
                  </p>
                </div>

                {order.status === "ACCEPTED" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startDelivery(order.id)}
                      disabled={actionLoadingId === order.id}
                      className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
                    >
                      {actionLoadingId === order.id
                        ? "Démarrage..."
                        : "Démarrer livraison"}
                    </button>

                    <button
                      type="button"
                      onClick={() => cancelMission(order.id)}
                      disabled={actionLoadingId === order.id}
                      className="px-3 py-2 rounded border text-sm"
                    >
                      Annuler mission
                    </button>
                  </div>
                )}

                {order.status === "OUT_FOR_DELIVERY" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Code OTP"
                        value={otpInputs[order.id] || ""}
                        onChange={(e) =>
                          updateOtpInput(order.id, e.target.value)
                        }
                        className="border px-2 py-1 rounded w-32"
                      />

                      <button
                        type="button"
                        onClick={() => validateOtpAndDeliver(order.id)}
                        disabled={otpLoadingId === order.id}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        {otpLoadingId === order.id
                          ? "Validation..."
                          : "Valider OTP"}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => cancelMission(order.id)}
                      disabled={actionLoadingId === order.id}
                      className="text-sm text-red-600"
                    >
                      Annuler mission
                    </button>
                  </div>
                )}
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}