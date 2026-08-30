"use client";

import PushNotifications from "@/components/PushNotifications";
import { useEffect, useMemo, useState, type TouchEvent } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import MissionRoutePreview from "@/components/MissionRoutePreview";
import Link from "next/link";

type Order = {
  id: string;
  sender_name?: string | null;
  sender_phone?: string | null;
  receiver_name?: string | null;
  receiver_phone?: string | null;
  pickup_address?: string | null;
  pickup_city?: string | null;
  pickup_floor?: string | null;
  pickup_has_elevator?: boolean | null;
  dropoff_address?: string | null;
  dropoff_city?: string | null;
  dropoff_floor?: string | null;
  dropoff_has_elevator?: boolean | null;
  recipient_email?: string | null;
  parcel_type?: string | null;
  parcel_note?: string | null;
  parcel_size?: string | null;
  is_important_parcel?: boolean | null;
  important_parcel_type?: string | null;
  required_vehicle?: string | null;
  vehicle_required?: string | null;
  service_zone?: string | null;
  zone_level?: string | null;
  parcel_photo_url?: string | null;
  bag_count?: number | null;
  price_cents?: number | null;
  courier_earnings_cents?: number | null;
  status?: string | null;
  payment_status?: string | null;
  courier_id?: string | null;
  absence_reason?: string | null;
  absence_declared_at?: string | null;
  next_delivery_at?: string | null;
  refusal_reason?: string | null;
  refusal_comment?: string | null;
  refusal_photo_url?: string | null;
  refused_at?: string | null;
  refused_by?: string | null;
  return_payment_status?: string | null;
  return_price_cents?: number | null;
  return_courier_earnings_cents?: number | null;
  return_started_at?: string | null;
  return_completed_at?: string | null;
  return_pin_code?: string | null;
  return_pin_verified_at?: string | null;
  delivery_obstacle_reason?: string | null;
  delivery_obstacle_comment?: string | null;
  delivery_obstacle_at?: string | null;
};

type CourierProfile = {
  id?: string;
  user_id?: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  vehicle_type?: string | null;
  vehicle_label?: string | null;
  city?: string | null;
  service_area?: string | null;
  rating_average?: number | null;
};

function formatEuro(cents?: number | null) {
  return `${((cents ?? 0) / 100).toFixed(2)} €`;
}

function cleanStatus(status?: string | null) {
  return String(status || "").trim().toUpperCase();
}

function cleanAddressDisplay(text?: string | null) {
  return String(text || "")
    .replace(/\b(RDC|DRC|rez-de-chaussée|rez de chaussée)\b/gi, "")
    .replace(/[,.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function elevatorLabel(value?: boolean | null) {
  if (value === true) return "Oui";
  if (value === false) return "Non";
  return "-";
}

function profileName(profile: CourierProfile | null) {
  if (!profile) return "Livreur";
  return (
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    "Livreur"
  );
}

export default function MissionsPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [courierProfile, setCourierProfile] = useState<CourierProfile | null>(null);
  const [available, setAvailable] = useState<Order[]>([]);
  const [myMissions, setMyMissions] = useState<Order[]>([]);
  const [historyMissions, setHistoryMissions] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [receiverCallStartedAt, setReceiverCallStartedAt] = useState<Record<string, number>>({});
  const [callSecondsLeft, setCallSecondsLeft] = useState<Record<string, number>>({});
  const [absenceReason, setAbsenceReason] = useState<Record<string, string>>({});
  const [nextDeliveryAt, setNextDeliveryAt] = useState<Record<string, string>>({});
  const [absenceOpen, setAbsenceOpen] = useState<Record<string, boolean>>({});
  const [nextDeliveryOpen, setNextDeliveryOpen] = useState<Record<string, boolean>>({});
  const [pinByOrder, setPinByOrder] = useState<Record<string, string>>({});
  const [refusalOpen, setRefusalOpen] = useState<Record<string, boolean>>({});
  const [refusalReason, setRefusalReason] = useState<Record<string, string>>({});
  const [refusalComment, setRefusalComment] = useState<Record<string, string>>({});
  const [refusalPhoto, setRefusalPhoto] = useState<Record<string, File | null>>({});
  const [refusalSubmitting, setRefusalSubmitting] = useState<Record<string, boolean>>({});
  const [returnCompleting, setReturnCompleting] = useState<Record<string, boolean>>({});
  const [pendingReturns, setPendingReturns] = useState<Order[]>([]);
  const [paidReturns, setPaidReturns] = useState<Order[]>([]);
  const [returnScheduleOpen, setReturnScheduleOpen] = useState<Record<string, boolean>>({});
  const [returnScheduleAt, setReturnScheduleAt] = useState<Record<string, string>>({});
  const [returnPinByOrder, setReturnPinByOrder] = useState<Record<string, string>>({});
  const [deliveryAcceptedOpen, setDeliveryAcceptedOpen] = useState<Record<string, boolean>>({});
  const [obstacleOpen, setObstacleOpen] = useState<Record<string, boolean>>({});
  const [obstacleReason, setObstacleReason] = useState<Record<string, string>>({});
  const [obstacleComment, setObstacleComment] = useState<Record<string, string>>({});
  const [obstacleSaving, setObstacleSaving] = useState<Record<string, boolean>>({});
  const [availableIndex, setAvailableIndex] = useState(0);
  const [availableTouchStartX, setAvailableTouchStartX] = useState<number | null>(null);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [locationPermission, setLocationPermission] = useState<
    "unknown" | "granted" | "denied"
  >("unknown");
  const [notificationPermission, setNotificationPermission] = useState<
    "unknown" | "granted" | "denied" | "unsupported"
  >("unknown");
  const [pushNotificationsKey, setPushNotificationsKey] = useState(0);

  async function loadCourierProfile(uid: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();

    if (!error && data) {
      setCourierProfile(data as CourierProfile);
      return;
    }

    setCourierProfile(null);
  }

  async function loadOrders(uid?: string | null, silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    setMsg(null);

    try {
      const currentUserId = uid || userId;

      const { data: availableData, error: availableError } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "PUBLISHED")
        .in("payment_status", ["PAID", "paid"])
        .is("courier_id", null)
        .order("created_at", { ascending: false });

      if (availableError) throw availableError;

      let myData: Order[] = [];
      let historyData: Order[] = [];
      let pendingReturnData: Order[] = [];
      let paidReturnData: Order[] = [];

      if (currentUserId) {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("courier_id", currentUserId)
          .in("status", ["ACCEPTED", "OUT_FOR_DELIVERY"])
          .order("created_at", { ascending: false });

        if (error) throw error;
        myData = (data as Order[]) || [];

        const { data: pendingData, error: pendingError } = await supabase
          .from("orders")
          .select("*")
          .eq("courier_id", currentUserId)
          .in("status", ["REFUSED_BY_RECIPIENT", "RETURN_PAYMENT_PENDING"])
          .order("updated_at", { ascending: false });

        if (pendingError) throw pendingError;
        pendingReturnData = (pendingData as Order[]) || [];

        const { data: paidData, error: paidError } = await supabase
          .from("orders")
          .select("*")
          .eq("courier_id", currentUserId)
          .in("status", ["RETURN_TO_SENDER", "RETURN_SCHEDULED"])
          .order("updated_at", { ascending: false });

        if (paidError) throw paidError;
        paidReturnData = (paidData as Order[]) || [];

        const { data: deliveredData, error: deliveredError } = await supabase
          .from("orders")
          .select("*")
          .eq("courier_id", currentUserId)
          .in("status", ["DELIVERED", "delivered", "LIVREE", "LIVRÉE"])
          .order("updated_at", { ascending: false })
          .limit(30);

        if (deliveredError) throw deliveredError;
        historyData = (deliveredData as Order[]) || [];
      }

      setAvailable(
        ((availableData as Order[]) || []).filter(
          (o) =>
            cleanStatus(o.status) === "PUBLISHED" &&
            cleanStatus(o.payment_status) === "PAID"
        )
      );

      setMyMissions(myData);
      setPendingReturns(pendingReturnData);
      setPaidReturns(paidReturnData);
      setHistoryMissions(historyData);
    } catch (error: any) {
      setMsg(error?.message || "Impossible de charger les missions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;

      setUserId(uid);

      if (uid) await loadCourierProfile(uid);
      await loadOrders(uid);
    }

    init();
  }, [supabase]);

  useEffect(() => {
    if (Object.keys(receiverCallStartedAt).length === 0) return;

    const updateCountdown = () => {
      const next: Record<string, number> = {};

      Object.entries(receiverCallStartedAt).forEach(([orderId, startedAt]) => {
        next[orderId] = Math.max(
          0,
          15 - Math.floor((Date.now() - startedAt) / 1000)
        );
      });

      setCallSecondsLeft(next);
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(timer);
  }, [receiverCallStartedAt]);

  useEffect(() => {
    setAvailableIndex((current) => {
      if (available.length === 0) return 0;
      return Math.min(current, available.length - 1);
    });
  }, [available.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onboardingSeen = window.localStorage.getItem(
      "helpflow_courier_permissions_seen"
    );

    if (!onboardingSeen) {
      setPermissionsOpen(true);
    }

    if ("Notification" in window) {
      setNotificationPermission(
        Notification.permission === "default"
          ? "unknown"
          : Notification.permission
      );
    } else {
      setNotificationPermission("unsupported");
    }

    if ("permissions" in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          setLocationPermission(
            result.state === "granted"
              ? "granted"
              : result.state === "denied"
                ? "denied"
                : "unknown"
          );
        })
        .catch(() => undefined);
    }
  }, []);

  function changeAvailableMission(direction: -1 | 1) {
    if (available.length <= 1) return;

    setAvailableIndex((current) => {
      const next = current + direction;
      if (next < 0) return available.length - 1;
      if (next >= available.length) return 0;
      return next;
    });
  }

  function handleAvailableTouchStart(event: TouchEvent<HTMLDivElement>) {
    setAvailableTouchStartX(event.touches[0]?.clientX ?? null);
  }

  function handleAvailableTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (availableTouchStartX === null) return;

    const endX = event.changedTouches[0]?.clientX ?? availableTouchStartX;
    const delta = endX - availableTouchStartX;

    if (Math.abs(delta) >= 55) {
      changeAvailableMission(delta < 0 ? 1 : -1);
    }

    setAvailableTouchStartX(null);
  }

  function requestLocationPermission() {
    if (!navigator.geolocation) {
      setMsg("La localisation n'est pas disponible sur cet appareil.");
      setLocationPermission("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationPermission("granted");
        setMsg("✅ Localisation autorisée pour les missions de proximité.");
      },
      (error) => {
        setLocationPermission("denied");
        setMsg(
          error.code === error.PERMISSION_DENIED
            ? "Localisation refusée. Tu pourras l'autoriser plus tard dans les réglages du téléphone."
            : "Impossible de récupérer la position pour le moment."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  async function requestNotificationPermission() {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      setMsg("Les notifications ne sont pas disponibles sur cet appareil.");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(
      permission === "default" ? "unknown" : permission
    );

    if (permission === "granted") {
      setPushNotificationsKey((current) => current + 1);
      setMsg("✅ Notifications autorisées.");
    } else if (permission === "denied") {
      setMsg(
        "Notifications refusées. Tu pourras les autoriser plus tard dans les réglages du navigateur ou du téléphone."
      );
    }
  }

  function closePermissionsPanel() {
    window.localStorage.setItem("helpflow_courier_permissions_seen", "1");
    setPermissionsOpen(false);
  }

  function callReceiver(order: Order) {
    if (!order.receiver_phone) {
      setMsg("Numéro du receveur non renseigné.");
      return;
    }

    const startedAt = Date.now();
    setReceiverCallStartedAt((current) => ({ ...current, [order.id]: startedAt }));
    setCallSecondsLeft((current) => ({ ...current, [order.id]: 15 }));
    window.location.href = `tel:${order.receiver_phone}`;
  }

  function canDeclareAbsent(orderId: string) {
    const startedAt = receiverCallStartedAt[orderId];
    return Boolean(startedAt && Date.now() - startedAt >= 15000);
  }

  async function recordDeliveryObstacle(order: Order) {
    if (!userId) {
      setMsg("Tu dois être connecté comme livreur.");
      return;
    }

    if (cleanStatus(order.status) !== "OUT_FOR_DELIVERY") {
      setMsg("Un obstacle ne peut être déclaré que pendant la livraison.");
      return;
    }

    const reason = (obstacleReason[order.id] || "").trim();
    const comment = (obstacleComment[order.id] || "").trim();

    if (!reason) {
      setMsg("Choisis le type d'obstacle.");
      return;
    }

    if (!comment) {
      setMsg("Ajoute une courte précision sur l'obstacle rencontré.");
      return;
    }

    setObstacleSaving((current) => ({
      ...current,
      [order.id]: true,
    }));

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("orders")
      .update({
        delivery_obstacle_reason: reason,
        delivery_obstacle_comment: comment,
        delivery_obstacle_at: now,
        updated_at: now,
      })
      .eq("id", order.id)
      .eq("courier_id", userId)
      .eq("status", "OUT_FOR_DELIVERY");

    setObstacleSaving((current) => ({
      ...current,
      [order.id]: false,
    }));

    if (error) {
      setMsg("Erreur enregistrement obstacle : " + error.message);
      return;
    }

    setMsg("✅ Obstacle enregistré. La mission reste ouverte.");
    setObstacleOpen((current) => ({
      ...current,
      [order.id]: false,
    }));
    setObstacleReason((current) => ({
      ...current,
      [order.id]: "",
    }));
    setObstacleComment((current) => ({
      ...current,
      [order.id]: "",
    }));

    await loadOrders(userId, true);
  }

  async function declareAbsent(order: Order) {
    if (!canDeclareAbsent(order.id)) {
      setMsg("Appelle d'abord le client et attends au moins 15 secondes.");
      return;
    }

    const reason = (absenceReason[order.id] || "").trim();
    if (!reason) {
      setMsg("Écris le motif de l'absence avant de confirmer.");
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({
        status: "ABSENT",
        absence_reason: reason,
        absence_declared_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("courier_id", userId);

    if (error) {
      setMsg("Erreur déclaration client absent : " + error.message);
      return;
    }

    setMsg("✅ Client déclaré absent. Le motif a été enregistré.");
    setAbsenceOpen((current) => ({ ...current, [order.id]: false }));
    await loadOrders(userId, true);
  }

  async function scheduleNextDelivery(order: Order) {
    if (!canDeclareAbsent(order.id)) {
      setMsg("Appelle d'abord le client et attends au moins 15 secondes.");
      return;
    }

    const dateValue = nextDeliveryAt[order.id];
    if (!dateValue) {
      setMsg("Choisis la date et l'heure de la prochain créneau.");
      return;
    }

    const nextDate = new Date(dateValue);
    if (Number.isNaN(nextDate.getTime()) || nextDate.getTime() <= Date.now()) {
      setMsg("Choisis une date et une heure futures.");
      return;
    }

    const reason = (absenceReason[order.id] || "").trim();

    const { error } = await supabase
      .from("orders")
      .update({
        status: "DISTRIBUTION_A_VENIR",
        next_delivery_at: nextDate.toISOString(),
        absence_reason: reason || null,
        absence_declared_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("courier_id", userId);

    if (error) {
      setMsg("Erreur programmation distribution : " + error.message);
      return;
    }

    setMsg("✅ Autre créneau enregistrée.");
    setNextDeliveryOpen((current) => ({ ...current, [order.id]: false }));
    await loadOrders(userId, true);
  }

  async function uploadRefusalPhoto(orderId: string, file: File) {
    if (!userId) throw new Error("Livreur non connecté.");

    if (!file.type.startsWith("image/")) {
      throw new Error("Le justificatif doit être une image.");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("La photo ne doit pas dépasser 5 Mo.");
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `refus/${userId}/${orderId}/${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("parcel-photos")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/jpeg",
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("parcel-photos").getPublicUrl(path);
    return data.publicUrl;
  }

  async function confirmRecipientRefusal(order: Order) {
    if (!userId) {
      setMsg("Tu dois être connecté comme livreur.");
      return;
    }

    if (cleanStatus(order.status) !== "OUT_FOR_DELIVERY") {
      setMsg("Le refus ne peut être enregistré qu'au moment de la livraison.");
      return;
    }

    const reason = (refusalReason[order.id] || "").trim();
    const comment = (refusalComment[order.id] || "").trim();
    const photo = refusalPhoto[order.id];

    if (!reason) {
      setMsg("Choisis le motif du refus.");
      return;
    }

    if (!comment) {
      setMsg("Écris une explication précise du refus.");
      return;
    }

    if (comment.length < 10) {
      setMsg("L'explication doit contenir au moins 10 caractères.");
      return;
    }

    if (!photo) {
      setMsg("Ajoute une photo justificative du colis.");
      return;
    }

    const confirmed = window.confirm(
      "Confirmer que le receveur refuse le colis ? La livraison ne sera pas validée et un retour payant devra être organisé."
    );

    if (!confirmed) return;

    setRefusalSubmitting((current) => ({ ...current, [order.id]: true }));
    setMsg(null);

    try {
      const photoUrl = await uploadRefusalPhoto(order.id, photo);
      const now = new Date().toISOString();
      const returnPriceCents = Math.max(300, Math.round((order.price_cents || 0) * 0.5));

      const { error } = await supabase
        .from("orders")
        .update({
          status: "RETURN_PAYMENT_PENDING",
          refusal_reason: reason,
          refusal_comment: comment,
          refusal_photo_url: photoUrl,
          refused_at: now,
          refused_by: userId,
          return_payment_status: "unpaid",
          return_price_cents: returnPriceCents,
          return_courier_earnings_cents: returnPriceCents,
          updated_at: now,
        })
        .eq("id", order.id)
        .eq("courier_id", userId)
        .eq("status", "OUT_FOR_DELIVERY");

      if (error) throw error;

      setRefusalOpen((current) => ({ ...current, [order.id]: false }));
      setRefusalReason((current) => ({ ...current, [order.id]: "" }));
      setRefusalComment((current) => ({ ...current, [order.id]: "" }));
      setRefusalPhoto((current) => ({ ...current, [order.id]: null }));
      setPinByOrder((current) => ({ ...current, [order.id]: "" }));
      setMsg(
        `✅ Refus enregistré. Première rémunération acquise. Retour calculé à ${formatEuro(returnPriceCents)}. Tu peux accepter une autre mission pendant l'attente.`
      );
      await loadOrders(userId, true);
    } catch (error: any) {
      setMsg(error?.message || "Impossible d'enregistrer le refus du colis.");
    } finally {
      setRefusalSubmitting((current) => ({ ...current, [order.id]: false }));
    }
  }

  async function startReturnToday(order: Order) {
    if (!userId) return;

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("orders")
      .update({
        status: "RETURN_TO_SENDER",
        return_started_at: now,
        updated_at: now,
      })
      .eq("id", order.id)
      .eq("courier_id", userId)
      .eq("return_payment_status", "paid");

    if (error) {
      setMsg("Erreur démarrage du retour : " + error.message);
      return;
    }

    setMsg("✅ Retour vers l'expéditeur démarré.");
    await loadOrders(userId, true);
  }

  async function scheduleReturn(order: Order) {
    if (!userId) return;

    const value = returnScheduleAt[order.id];

    if (!value) {
      setMsg("Choisis la date et l'heure prévues pour le retour.");
      return;
    }

    const scheduledDate = new Date(value);

    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
      setMsg("Choisis une date et une heure futures.");
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({
        status: "RETURN_SCHEDULED",
        next_delivery_at: scheduledDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("courier_id", userId)
      .eq("return_payment_status", "paid");

    if (error) {
      setMsg("Erreur programmation du retour : " + error.message);
      return;
    }

    setReturnScheduleOpen((current) => ({ ...current, [order.id]: false }));
    setMsg("✅ Retour programmé.");
    await loadOrders(userId, true);
  }

  async function completeReturnToSender(order: Order) {
    if (!userId) return;

    if (!["RETURN_TO_SENDER", "RETURN_SCHEDULED"].includes(cleanStatus(order.status))) {
      setMsg("Le retour doit d'abord être payé et autorisé.");
      return;
    }

    const enteredPin = (returnPinByOrder[order.id] || "").trim();

    if (!/^\d{4}$/.test(enteredPin)) {
      setMsg("Entre le Code PIN retour à 4 chiffres donné par l'expéditeur.");
      return;
    }

    setReturnCompleting((current) => ({ ...current, [order.id]: true }));

    try {
      const {
  data: sessionData,
} = await supabase.auth.getSession();

const accessToken =
  sessionData.session?.access_token;

if (!accessToken) {
  throw new Error(
    "Session livreur introuvable."
  );
}

const response =
  await fetch(
    "/api/verify-return-pin",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        orderId: order.id,
        pin: enteredPin,
      }),
    }
  );
       
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.error || "Code PIN retour incorrect.");
      }

      setReturnPinByOrder((current) => ({
        ...current,
        [order.id]: "",
      }));

      setMsg("✅ Colis remis à l'expéditeur. Retour terminé et confirmé par Code PIN.");
      await loadOrders(userId, true);
    } catch (error: any) {
      setMsg(error?.message || "Impossible de confirmer le retour.");
    } finally {
      setReturnCompleting((current) => ({
        ...current,
        [order.id]: false,
      }));
    }
  }

  async function acceptMission(orderId: string) {
    if (!userId) {
      setMsg("Tu dois être connecté comme livreur.");
      return;
    }

    if (myMissions.length > 0) {
      setMsg("Tu dois terminer ta mission actuelle avant d'en accepter une autre.");
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({
        courier_id: userId,
        status: "ACCEPTED",
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("status", "PUBLISHED")
      .is("courier_id", null);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("✅ Mission acceptée.");
    await loadOrders(userId, true);

    setTimeout(() => {
      document.getElementById("mes-missions")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 300);
  }

  async function startDelivery(orderId: string) {
    const { error } = await supabase
      .from("orders")
      .update({
        status: "OUT_FOR_DELIVERY",
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("courier_id", userId);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("✅ Livraison démarrée.");
    await loadOrders(userId, true);
  }

  async function validateDelivery(order: Order) {
  const enteredOtp = (pinByOrder[order.id] || "").trim();

  if (!enteredOtp || enteredOtp.length !== 4) {
    setMsg("Entre le Code PIN à 4 chiffres.");
    return;
  }

  const res = await fetch("/api/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: order.id, otp: enteredOtp }),
  });

  const result = await res.json().catch(() => ({}));

  if (!res.ok) {
    setMsg(result?.error || "Code PIN incorrect.");
    return;
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: "delivered",
      delivered_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (error) {
    setMsg("Erreur validation livraison : " + error.message);
    return;
  }

  setMsg("✅ Livraison terminée.");
setPinByOrder((current) => ({
  ...current,
  [order.id]: "",
}));

  await loadOrders(userId, true);
}

  async function cancelMission(orderId: string) {
    const { error } = await supabase
      .from("orders")
      .update({
        courier_id: null,
        accepted_at: null,
        started_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("courier_id", userId);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Mission annulée.");
    await loadOrders(userId, true);
  }

  function callPhone(phone?: string | null) {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  }

  function OrderCard({
    order,
    type,
  }: {
    order: Order;
    type: "available" | "mine" | "history";
  }) {
    const status = cleanStatus(order.status);
    const vehicleRequired =
      order.vehicle_required || order.required_vehicle || "Non précisé";
    const isImportantParcel = order.is_important_parcel === true;
    const hideImportantDetails = type === "available" && isImportantParcel;

    return (
      <div
        key={order.id}
        className={`overflow-hidden rounded-3xl border shadow-sm ${
          type === "mine"
            ? "border-green-300 bg-green-50 ring-2 ring-green-200"
            : type === "history"
              ? "border-gray-200 bg-white opacity-95"
              : "border-gray-200 bg-white"
        }`}
      >
        {type === "mine" ? (
          <div className="bg-green-600 px-4 py-3 text-center font-bold text-white">
            ✅ Ma mission en cours
          </div>
        ) : null}

        {type === "history" ? (
          <div className="bg-gray-800 px-4 py-3 text-center font-bold text-white">
            📦 Livraison terminée
          </div>
        ) : null}

        {order.parcel_photo_url && !hideImportantDetails ? (
          <img
            src={order.parcel_photo_url}
            alt="Photo du colis"
            className="h-48 w-full object-cover"
          />
        ) : null}

        <div className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Mission recommandée</p>
              <div className="text-yellow-400">★★★★★</div>
            </div>

            <div className="rounded-full bg-green-50 px-3 py-2 font-bold text-green-700">
              Montant du livreur : {formatEuro(order.courier_earnings_cents)}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl bg-gray-50 p-3">
              <p className="text-xs font-semibold uppercase text-gray-500">Retrait</p>

              <p className="font-semibold">
                {cleanAddressDisplay(order.pickup_address) || "-"} {order.pickup_city || ""}
              </p>

              {type !== "available" ? (
                <>
                  <p className="text-sm text-gray-600">
                    Expéditeur : {order.sender_name || "-"}
                  </p>

                  <p className="text-sm text-gray-600">
                    Étage retrait : {order.pickup_floor || "-"}
                  </p>

                  <p className="text-sm text-gray-600">
                    Ascenseur retrait : {elevatorLabel(order.pickup_has_elevator)}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Les coordonnées détaillées de l'expéditeur sont visibles après acceptation.
                </p>
              )}

              {type === "mine" && order.sender_phone ? (
                <button
                  type="button"
                  onClick={() => callPhone(order.sender_phone)}
                  className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium"
                >
                  Appeler expéditeur
                </button>
              ) : null}
            </div>

            <div className="rounded-2xl bg-gray-50 p-3">
              <p className="text-xs font-semibold uppercase text-gray-500">Livraison</p>

              <p className="font-semibold">
                {cleanAddressDisplay(order.dropoff_address) || "-"} {order.dropoff_city || ""}
              </p>

              {type !== "available" ? (
                <>
                  <p className="text-sm text-gray-600">
                    Receveur : {order.receiver_name || "-"}
                  </p>

                  <p className="text-sm text-gray-600">
                    Étage livraison : {order.dropoff_floor || "-"}
                  </p>

                  <p className="text-sm text-gray-600">
                    Ascenseur livraison : {elevatorLabel(order.dropoff_has_elevator)}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Les coordonnées détaillées du receveur sont visibles après acceptation.
                </p>
              )}

              {type === "mine" && order.receiver_phone ? (
                <button
                  type="button"
                  onClick={() => callReceiver(order)}
                  className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium"
                >
                  Appeler receveur
                </button>
              ) : null}

              {type === "mine" && order.recipient_email ? (
                <p className="mt-2 text-xs text-gray-500">
                  Email du receveur : {order.recipient_email}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-gray-500">Sacs</p>
              <p className="font-semibold">{order.bag_count ?? "-"}</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-gray-500">Type colis</p>
              {hideImportantDetails ? (
                <div>
                  <p className="font-bold text-amber-800">🔒 Colis important</p>
                  <p className="mt-1 text-xs leading-5 text-gray-600">
                    Le contenu détaillé devient visible après l’acceptation de la mission.
                  </p>
                </div>
              ) : isImportantParcel ? (
                <div>
                  <p className="font-bold text-amber-800">🔓 Colis important</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {order.important_parcel_type || order.parcel_type || "-"}
                  </p>
                </div>
              ) : (
                <p className="font-semibold">{order.parcel_type || "-"}</p>
              )}
            </div>

            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-gray-500">Taille colis</p>
              <p className="font-semibold">{order.parcel_size || "-"}</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-gray-500">Véhicule requis</p>
              <p className="font-semibold">{vehicleRequired}</p>
            </div>
          </div>

          {order.parcel_note && !hideImportantDetails ? (
            <div className="rounded-2xl bg-yellow-50 p-3 text-sm text-yellow-900">
              {order.parcel_note}
            </div>
          ) : null}

          {order.service_zone || order.zone_level ? (
            <div className="rounded-2xl bg-blue-50 p-3 text-sm text-blue-900">
              Zone : {order.service_zone || "-"} / {order.zone_level || "-"}
            </div>
          ) : null}

          <MissionRoutePreview
            pickupAddress={cleanAddressDisplay(order.pickup_address)}
            pickupCity={order.pickup_city}
            dropoffAddress={cleanAddressDisplay(order.dropoff_address)}
            dropoffCity={order.dropoff_city}
          />

          {type === "available" ? (
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-blue-700">Distance</p>
                <p className="mt-1 font-bold text-slate-900">À activer</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-blue-700">Temps estimé</p>
                <p className="mt-1 font-bold text-slate-900">À activer</p>
              </div>
              <p className="col-span-2 text-xs leading-5 text-blue-800">
                L'emplacement est prêt. La distance et la durée réelles seront affichées dès l'activation du calcul d'itinéraire.
              </p>
            </div>
          ) : null}

          {type === "available" && isImportantParcel ? (
            <details className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <summary className="cursor-pointer list-none font-bold text-amber-950">
                <span className="flex items-center justify-between gap-3">
                  <span>🪪 Sécurité du retrait</span>
                  <span className="text-sm font-medium text-amber-700">Voir ▾</span>
                </span>
              </summary>
              <div className="mt-3 space-y-2 text-sm leading-6 text-amber-950">
                <p>
                  Cette mission contient un <strong>colis important</strong>.
                  Le détail du contenu reste confidentiel jusqu’à l’acceptation.
                </p>
                <p>
                  Au retrait, l’expéditeur peut vous demander de présenter une pièce
                  d’identité afin de vérifier que vous correspondez bien au profil
                  livreur HelpFlow.
                </p>
                <p className="font-semibold">
                  Présentez uniquement votre pièce d’identité à l’expéditeur.
                  Aucune photo ni copie du document ne doit être réalisée.
                </p>
              </div>
            </details>
          ) : null}

          {type === "mine" && isImportantParcel ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              <p className="font-bold">🪪 Retrait sécurisé — colis important</p>
              <p className="mt-1">
                L’expéditeur peut vérifier que votre identité correspond au profil
                HelpFlow avant de vous remettre le colis.
              </p>
              <p className="mt-1 font-semibold">
                Le détail du colis est maintenant visible :{" "}
                {order.important_parcel_type || order.parcel_type || "-"}.
              </p>
            </div>
          ) : null}

          {type === "available" && (
            <button
              type="button"
              disabled={myMissions.length > 0}
              onClick={() => acceptMission(order.id)}
              className={`w-full rounded-2xl px-4 py-3 font-semibold text-white ${
                myMissions.length > 0
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-blue-600"
              }`}
            >
              {myMissions.length > 0
                ? "Mission en cours"
                : "Accepter cette mission"}
            </button>
          )}

          {type === "mine" && status === "ACCEPTED" && (
            <button
              type="button"
              onClick={() => startDelivery(order.id)}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white"
            >
              Démarrer la livraison
            </button>
          )}

          {type === "mine" && status === "OUT_FOR_DELIVERY" && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">Remise du colis</p>
                <p className="mt-1 text-sm text-slate-600">
                  Choisis uniquement la situation correspondant à la remise.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDeliveryAcceptedOpen((current) => ({
                    ...current,
                    [order.id]: !current[order.id],
                  }))
                }
                className="w-full rounded-xl bg-green-600 px-4 py-4 text-lg font-black text-white shadow-sm"
              >
                ACCEPTÉ
              </button>

              <button
                type="button"
                onClick={() =>
                  setRefusalOpen((current) => ({
                    ...current,
                    [order.id]: !current[order.id],
                  }))
                }
                className="w-full rounded-xl bg-emerald-800 px-4 py-3 font-bold text-white"
              >
                REFUSÉ
              </button>

              <button
                type="button"
                disabled={!canDeclareAbsent(order.id)}
                onClick={() =>
                  setAbsenceOpen((current) => ({
                    ...current,
                    [order.id]: !current[order.id],
                  }))
                }
                className="w-full rounded-xl bg-orange-500 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
              >
                ABSENT
              </button>

              <button
                type="button"
                onClick={() =>
                  setObstacleOpen((current) => ({
                    ...current,
                    [order.id]: !current[order.id],
                  }))
                }
                className="w-full rounded-xl bg-red-700 px-4 py-3 font-bold text-white"
              >
                PROBLÈME / OBSTACLE
              </button>

              <button
                type="button"
                disabled={!canDeclareAbsent(order.id)}
                onClick={() =>
                  setNextDeliveryOpen((current) => ({
                    ...current,
                    [order.id]: !current[order.id],
                  }))
                }
                className="w-full rounded-xl bg-blue-700 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
              >
                AUTRE CRÉNEAU
              </button>

              {!receiverCallStartedAt[order.id] ? (
                <p className="text-center text-xs text-slate-500">
                  Pour « Absent » ou « Autre créneau », appelle d'abord le receveur puis attends 15 secondes.
                </p>
              ) : (callSecondsLeft[order.id] ?? 0) > 0 ? (
                <p className="text-center text-xs font-semibold text-orange-700">
                  Encore {callSecondsLeft[order.id]} seconde(s) avant « Absent » ou « Autre créneau ».
                </p>
              ) : null}

              {obstacleOpen[order.id] && (
                <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-red-950">
                      Type de problème *
                    </label>
                    <select
                      value={obstacleReason[order.id] || ""}
                      onChange={(e) =>
                        setObstacleReason((current) => ({
                          ...current,
                          [order.id]: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-red-200 bg-white px-4 py-3"
                    >
                      <option value="">Sélectionner</option>
                      <option value="MAUVAISE_ADRESSE">Mauvaise adresse</option>
                      <option value="ADRESSE_INTROUVABLE">Adresse introuvable</option>
                      <option value="DESTINATAIRE_INCONNU">
                        Destinataire inconnu à l'adresse
                      </option>
                      <option value="ACCES_IMPOSSIBLE">
                        Accès impossible / porte ou code
                      </option>
                      <option value="AUTRE">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-red-950">
                      Précision du livreur *
                    </label>
                    <textarea
                      value={obstacleComment[order.id] || ""}
                      maxLength={500}
                      onChange={(e) =>
                        setObstacleComment((current) => ({
                          ...current,
                          [order.id]: e.target.value,
                        }))
                      }
                      placeholder="Ex. numéro inexistant, rue introuvable, nom absent, portail inaccessible..."
                      className="min-h-24 w-full rounded-xl border border-red-200 bg-white px-4 py-3"
                    />
                    <p className="mt-1 text-right text-xs text-slate-500">
                      {(obstacleComment[order.id] || "").length}/500
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={Boolean(obstacleSaving[order.id])}
                    onClick={() => recordDeliveryObstacle(order)}
                    className="w-full rounded-xl bg-red-800 px-4 py-3 font-bold text-white disabled:bg-gray-400"
                  >
                    {obstacleSaving[order.id]
                      ? "Enregistrement..."
                      : "Enregistrer le problème"}
                  </button>

                  <p className="text-xs text-red-800">
                    Le problème est enregistré mais la mission reste ouverte si la situation peut être résolue.
                  </p>
                </div>
              )}
            </div>
          )}

          {type === "mine" && status === "OUT_FOR_DELIVERY" && deliveryAcceptedOpen[order.id] && (
            <div className="space-y-3 rounded-2xl border border-green-200 bg-green-50 p-4">
              <div>
                <p className="font-bold text-green-900">Confirmation par Code PIN</p>
                <p className="mt-1 text-sm text-green-800">
                  Demande au receveur le Code PIN à 4 chiffres reçu pour confirmer la remise.
                </p>
              </div>
              <input
  id={`otp-${order.id}`}
  type="text"
  inputMode="numeric"
  autoComplete="one-time-code"
  maxLength={4}
  value={pinByOrder[order.id] || ""}
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);

    setPinByOrder((current) => ({
      ...current,
      [order.id]: value,
    }));
  }}
  placeholder="Code PIN à 4 chiffres"
  className="w-full rounded-2xl border bg-white px-4 py-3 text-lg text-gray-900 tracking-widest"
/>

              <button
                type="button"
                onClick={() => validateDelivery(order)}
                className="w-full rounded-2xl bg-green-600 px-4 py-3 font-semibold text-white"
              >
                Valider la livraison
              </button>
            </div>
          )}

          {type === "mine" && status === "OUT_FOR_DELIVERY" && refusalOpen[order.id] && (
            <div id={`refusal-${order.id}`} className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div>
                <p className="font-bold text-red-900">Colis refusé par le receveur ?</p>
                <p className="mt-1 text-sm text-red-800">
                  À utiliser uniquement si le receveur refuse réellement le colis au moment de la remise.
                  Le motif, le commentaire et la photo sont obligatoires.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setRefusalOpen((current) => ({
                    ...current,
                    [order.id]: false,
                  }))
                }
                className="w-full rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700"
              >
                Fermer le formulaire de refus
              </button>

              <div className="space-y-3 rounded-2xl border border-red-200 bg-white p-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-800">
                      Motif du refus *
                    </label>
                    <select
                      value={refusalReason[order.id] || ""}
                      onChange={(e) =>
                        setRefusalReason((current) => ({
                          ...current,
                          [order.id]: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-red-200 bg-white px-4 py-3"
                    >
                      <option value="">Sélectionner un motif</option>
                      <option value="COLIS_CASSE">Colis ou objet cassé</option>
                      <option value="COLIS_ENDOMMAGE">Colis endommagé</option>
                      <option value="COLIS_NON_CONFORME">Colis non conforme</option>
                      <option value="COLIS_INCOMPLET">Colis incomplet</option>
                      <option value="MAUVAIS_COLIS">Mauvais colis</option>
                      <option value="EMBALLAGE_OUVERT">Emballage ouvert ou détérioré</option>
                      <option value="AUTRE">Autre motif</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-800">
                      Commentaire du livreur *
                    </label>
                    <textarea
                      value={refusalComment[order.id] || ""}
                      onChange={(e) =>
                        setRefusalComment((current) => ({
                          ...current,
                          [order.id]: e.target.value,
                        }))
                      }
                      maxLength={1000}
                      placeholder="Décris précisément ce que le receveur a constaté et pourquoi il refuse le colis..."
                      className="min-h-28 w-full rounded-xl border border-red-200 bg-white px-4 py-3"
                    />
                    <p className="mt-1 text-right text-xs text-gray-500">
                      {(refusalComment[order.id] || "").length}/1000
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-800">
                      Photo justificative *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) =>
                        setRefusalPhoto((current) => ({
                          ...current,
                          [order.id]: e.target.files?.[0] || null,
                        }))
                      }
                      className="w-full rounded-xl border border-red-200 bg-white px-3 py-3 text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Image obligatoire, 5 Mo maximum. Ne photographie pas de document d'identité.
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                    Le retour sera calculé automatiquement à 50 % du prix initial : {formatEuro(
                      Math.max(300, Math.round((order.price_cents || 0) * 0.5))
                    )}. Il devra être payé par l'expéditeur avant le retour.
                  </div>

                  <button
                    type="button"
                    disabled={Boolean(refusalSubmitting[order.id])}
                    onClick={() => confirmRecipientRefusal(order)}
                    className="w-full rounded-xl bg-red-700 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {refusalSubmitting[order.id]
                      ? "Enregistrement du refus..."
                      : "Confirmer le refus et préparer le retour"}
                  </button>
                </div>
            </div>
          )}

          {type === "mine" &&
            status === "OUT_FOR_DELIVERY" &&
            (absenceOpen[order.id] || nextDeliveryOpen[order.id]) && (
            <div id={`absence-${order.id}`} className="space-y-3 rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <p className="font-bold text-orange-900">Absence / autre créneau</p>

              {!receiverCallStartedAt[order.id] ? (
                <p className="text-sm text-orange-800">
                  Appelle d'abord le receveur. Les actions « Client absent » et
                  « Autre créneau » seront disponibles après 15 secondes.
                </p>
              ) : (callSecondsLeft[order.id] ?? 0) > 0 ? (
                <p className="text-sm font-semibold text-orange-800">
                  Attends encore {callSecondsLeft[order.id]} seconde(s) avant de déclarer le client absent.
                </p>
              ) : (
                <p className="text-sm font-semibold text-green-700">
                  Délai de 15 secondes respecté. Tu peux maintenant choisir une action.
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  setAbsenceOpen((current) => ({ ...current, [order.id]: false }));
                  setNextDeliveryOpen((current) => ({ ...current, [order.id]: false }));
                }}
                className="w-full rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-800"
              >
                Fermer
              </button>

              {(absenceOpen[order.id] || nextDeliveryOpen[order.id]) && (
                <textarea
                  value={absenceReason[order.id] || ""}
                  onChange={(e) =>
                    setAbsenceReason((current) => ({
                      ...current,
                      [order.id]: e.target.value,
                    }))
                  }
                  placeholder="Motif : téléphone éteint, aucune réponse, boîte vocale, message laissé..."
                  className="min-h-24 w-full rounded-xl border border-orange-200 bg-white px-4 py-3"
                />
              )}

              {absenceOpen[order.id] && (
                <button
                  type="button"
                  onClick={() => declareAbsent(order)}
                  className="w-full rounded-xl bg-orange-700 px-4 py-3 font-bold text-white"
                >
                  Confirmer client absent
                </button>
              )}

              {nextDeliveryOpen[order.id] && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Nouvelle date et heure
                  </label>
                  <input
                    type="datetime-local"
                    value={nextDeliveryAt[order.id] || ""}
                    onChange={(e) =>
                      setNextDeliveryAt((current) => ({
                        ...current,
                        [order.id]: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3"
                  />

                  <button
                    type="button"
                    onClick={() => scheduleNextDelivery(order)}
                    className="w-full rounded-xl bg-blue-700 px-4 py-3 font-bold text-white"
                  >
                    Enregistrer la autre créneau
                  </button>
                </div>
              )}
            </div>
          )}

          {type === "mine" && ["ACCEPTED", "OUT_FOR_DELIVERY"].includes(status) && (
            <button
              type="button"
              onClick={() => cancelMission(order.id)}
              className="w-full rounded-2xl px-4 py-3 font-medium text-red-600"
            >
              Annuler la mission
            </button>
          )}
        </div>
      </div>
    );
  }

  function ReturnCard({ order, paid }: { order: Order; paid: boolean }) {
    const status = cleanStatus(order.status);

    return (
      <div
        key={order.id}
        className={`space-y-4 rounded-3xl border p-5 shadow-sm ${
          paid ? "border-blue-300 bg-blue-50" : "border-amber-300 bg-amber-50"
        }`}
      >
        <div>
          <h3 className="text-xl font-bold">
            {paid ? "🔄 Retour payé à effectuer" : "📦 Colis sous ma garde"}
          </h3>
          <p className={paid ? "text-blue-800" : "text-amber-800"}>
            {paid
              ? "Le retour peut être fait aujourd'hui ou sur un autre créneau."
              : "Retour en attente du paiement de l'expéditeur. Cette commande ne bloque pas les nouvelles missions."}
          </p>
        </div>

        <div className="grid gap-2 rounded-2xl bg-white p-4 text-sm">
          <p><b>Expéditeur :</b> {order.sender_name || "-"}</p>
          <p>
            <b>Adresse de retour :</b>{" "}
            {cleanAddressDisplay(order.pickup_address) || "-"} {order.pickup_city || ""}
          </p>
          <p><b>Motif :</b> {order.refusal_reason || "-"}</p>
          <p><b>Commentaire :</b> {order.refusal_comment || "-"}</p>
          <p>
            <b>Première rémunération :</b>{" "}
            {formatEuro(order.courier_earnings_cents)} — acquise
          </p>
          <p>
            <b>Rémunération du retour :</b>{" "}
            {formatEuro(order.return_courier_earnings_cents || order.return_price_cents)}
          </p>
          {order.refusal_photo_url ? (
            <a
              href={order.refusal_photo_url}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-blue-700 underline"
            >
              Voir la photo du refus
            </a>
          ) : null}
        </div>

        {!paid ? (
          <div className="rounded-xl bg-white p-3 text-sm font-semibold text-amber-800">
            Paiement du retour en attente : {formatEuro(order.return_price_cents)}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => startReturnToday(order)}
                className="rounded-xl bg-green-700 px-4 py-3 font-bold text-white"
              >
                Retour aujourd'hui
              </button>

              <button
                type="button"
                onClick={() =>
                  setReturnScheduleOpen((current) => ({
                    ...current,
                    [order.id]: !current[order.id],
                  }))
                }
                className="rounded-xl bg-blue-700 px-4 py-3 font-bold text-white"
              >
                Autre créneau
              </button>
            </div>

            {returnScheduleOpen[order.id] ? (
              <div className="space-y-2 rounded-2xl bg-white p-4">
                <label className="block text-sm font-semibold">
                  Date et heure prévues pour le retour
                </label>
                <input
                  type="datetime-local"
                  value={returnScheduleAt[order.id] || ""}
                  onChange={(e) =>
                    setReturnScheduleAt((current) => ({
                      ...current,
                      [order.id]: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border px-4 py-3"
                />
                <button
                  type="button"
                  onClick={() => scheduleReturn(order)}
                  className="w-full rounded-xl bg-blue-800 px-4 py-3 font-bold text-white"
                >
                  Enregistrer l’autre créneau
                </button>
              </div>
            ) : null}

            {status === "RETURN_SCHEDULED" && order.next_delivery_at ? (
              <div className="rounded-xl bg-white p-3 text-sm text-blue-800">
                Retour prévu le {new Date(order.next_delivery_at).toLocaleString("fr-FR")}
              </div>
            ) : null}

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div>
                <p className="font-bold text-slate-900">
                  Confirmation par Code PIN retour
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Demande à l'expéditeur le Code PIN retour reçu après le paiement.
                </p>
              </div>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                value={returnPinByOrder[order.id] || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4);

                  setReturnPinByOrder((current) => ({
                    ...current,
                    [order.id]: value,
                  }));
                }}
                placeholder="Code PIN retour à 4 chiffres"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-xl font-bold tracking-[0.35em] text-slate-900"
              />

              <button
                type="button"
                disabled={
                  Boolean(returnCompleting[order.id]) ||
                  (returnPinByOrder[order.id] || "").length !== 4
                }
                onClick={() => completeReturnToSender(order)}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {returnCompleting[order.id]
                  ? "Vérification..."
                  : "Valider le retour avec le Code PIN"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
  <main className="min-h-screen bg-gray-50 p-4">
    <PushNotifications key={pushNotificationsKey} />

    <div className="mx-auto max-w-3xl space-y-6">
          Chargement des missions...
        </div>
      </main>
    );
  }

  const rating = courierProfile?.rating_average || 5;

  const vehicle =
    [
      courierProfile?.vehicle_type?.split("|").filter(Boolean).join(" · "),
      courierProfile?.vehicle_label,
    ]
      .filter(Boolean)
      .join(" · ") || "Véhicule non renseigné";

      

  return (
    
    <main className="min-h-screen bg-gray-50 p-4 pb-24 sm:pb-4">
      {permissionsOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
              📍
            </div>
            <h2 className="mt-4 text-center text-2xl font-black text-slate-900">
              Préparer HelpFlow pour tes missions
            </h2>
            <p className="mt-2 text-center text-sm leading-6 text-slate-600">
              La position sert à proposer des missions de proximité. Les notifications servent à t'informer des nouvelles missions et des changements importants.
            </p>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={requestLocationPermission}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-left"
              >
                <span>
                  <span className="block font-bold text-slate-900">Localisation</span>
                  <span className="text-sm text-slate-500">
                    {locationPermission === "granted"
                      ? "Autorisée"
                      : locationPermission === "denied"
                        ? "Refusée"
                        : "À autoriser"}
                  </span>
                </span>
                <span className="text-xl">
                  {locationPermission === "granted" ? "✅" : "📍"}
                </span>
              </button>

              <button
                type="button"
                onClick={requestNotificationPermission}
                disabled={notificationPermission === "unsupported"}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-left disabled:opacity-50"
              >
                <span>
                  <span className="block font-bold text-slate-900">Notifications</span>
                  <span className="text-sm text-slate-500">
                    {notificationPermission === "granted"
                      ? "Autorisées"
                      : notificationPermission === "denied"
                        ? "Refusées"
                        : notificationPermission === "unsupported"
                          ? "Non disponibles"
                          : "À autoriser"}
                  </span>
                </span>
                <span className="text-xl">
                  {notificationPermission === "granted" ? "✅" : "🔔"}
                </span>
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
              HelpFlow ne demande pas ici l'autorisation de suivre ton activité sur d'autres applications ou sites. Une telle demande ne sera ajoutée que si elle devient réellement nécessaire.
            </div>

            <button
              type="button"
              onClick={closePermissionsPanel}
              className="mt-5 w-full rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white"
            >
              Continuer
            </button>
          </div>
        </div>
      ) : null}

    <button
  type="button"
  onClick={() => {
    const pause = localStorage.getItem("pause_livreur");
    localStorage.setItem(
      "pause_livreur",
      pause === "1" ? "0" : "1"
    );
    window.location.reload();
  }}
  className="flex items-center gap-3 rounded-full bg-white px-4 py-2 font-bold shadow"
>
  <span>
    {typeof window !== "undefined" &&
    localStorage.getItem("pause_livreur") === "1"
      ? "Pause"
      : "En ligne"}
  </span>

  <span
    className={`flex h-7 w-14 items-center rounded-full p-1 ${
      typeof window !== "undefined" &&
      localStorage.getItem("pause_livreur") === "1"
        ? "bg-orange-400 justify-end"
        : "bg-green-500 justify-start"
    }`}
  >
    <span className="h-5 w-5 rounded-full bg-white shadow" />
  </span>
</button>
      <button
        type="button"
        onClick={() => setPermissionsOpen(true)}
        className="mt-2 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
      >
        ⚙️ Autorisations
      </button>
      <nav className="mx-auto mb-4 hidden max-w-3xl grid-cols-2 gap-2 sm:grid sm:grid-cols-4">
  <Link
    href="/livreur/missions"
    className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white"
  >
    Missions
  </Link>

  <Link
    href="/livreur/historique"
    className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold text-gray-800 shadow-sm"
  >
    Historique
  </Link>

  <Link
    href="/livreur/portefeuille"
    className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold text-gray-800 shadow-sm"
  >
    Portefeuille
  </Link>

  <Link
   href="/aide"
    className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold text-gray-800 shadow-sm"
  >
    Aide
  </Link>
</nav>
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-3xl bg-blue-600 p-6 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-100">
                HelpFlow Livreur
              </p>

              <h1 className="mt-2 text-4xl font-bold">
                Missions disponibles
              </h1>

              <p className="mt-3 text-blue-100">
                Choisissez une mission claire, payée et prête à être prise.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadOrders(userId, true)}
              disabled={refreshing}
              className="rounded-2xl bg-white px-4 py-3 font-semibold text-blue-700"
            >
              {refreshing ? "..." : "Rafraîchir"}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/15 p-4">
              <p className="text-4xl font-bold">{available.length}</p>
              <p className="text-blue-100">missions disponibles</p>
            </div>

            <div className="rounded-2xl bg-white/15 p-4">
              <p className="text-4xl font-bold">{myMissions.length}</p>
              <p className="text-blue-100">missions en cours</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white p-4 text-gray-900">
            <div className="flex items-center gap-4">
              {courierProfile?.avatar_url ? (
                <img
                  src={courierProfile.avatar_url}
                  alt="Photo du livreur"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
                  👤
                </div>
              )}

              <div className="flex-1">
                <p className="font-semibold">{profileName(courierProfile)}</p>
                <p className="text-sm text-gray-600">{vehicle}</p>

                <p className="text-sm text-gray-600">
                  Zone : {courierProfile?.city || "Non renseignée"}
                </p>

                {courierProfile?.phone ? (
                  <button
                    type="button"
                    onClick={() => callPhone(courierProfile.phone)}
                    className="mt-2 text-sm font-semibold text-blue-600 underline"
                  >
                    {courierProfile.phone}
                  </button>
                ) : (
                  <p className="mt-2 text-sm text-red-500">
                    Téléphone livreur non renseigné
                  </p>
                )}

                <Link
                  href="/profile/edit"
                  className="mt-3 inline-block rounded-xl bg-blue-600 px-4 py-2 text-white"
                >
                  Modifier mon profil
                </Link>
              </div>

              <div className="text-right">
                <div className="text-yellow-400">★★★★★</div>
                <p className="text-sm text-gray-500">Note {rating}/5</p>
              </div>
            </div>
          </div>
        </section>

        {msg && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {msg}
          </div>
        )}

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Missions disponibles</h2>
            <p className="text-gray-500">
              Les étoiles indiquent les missions simples à prendre.
            </p>
            {myMissions.length > 0 ? (
              <p className="mt-2 rounded-2xl bg-yellow-50 p-3 text-sm font-semibold text-yellow-800">
                Tu as déjà une livraison normale en cours. Termine-la avant d'en accepter une autre. Les retours en attente ne te bloquent pas.
              </p>
            ) : null}
          </div>

          {available.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-center text-gray-600">
              <p className="font-semibold">Aucune mission disponible</p>
              <p className="text-sm">
                Revenez dans quelques minutes ou rafraîchissez la page.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm">
                <button
                  type="button"
                  onClick={() => changeAvailableMission(-1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-xl font-bold text-slate-700"
                  aria-label="Mission précédente"
                >
                  ‹
                </button>

                <div className="text-center">
                  <p className="font-bold text-slate-900">Livraisons disponibles</p>
                  <p className="text-sm text-slate-500">
                    {availableIndex + 1} / {available.length}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => changeAvailableMission(1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-xl font-bold text-slate-700"
                  aria-label="Mission suivante"
                >
                  ›
                </button>
              </div>

              <div
                onTouchStart={handleAvailableTouchStart}
                onTouchEnd={handleAvailableTouchEnd}
                className="touch-pan-y"
              >
                {OrderCard({
                  order: available[availableIndex],
                  type: "available",
                })}
              </div>

              {available.length > 1 ? (
                <p className="text-center text-xs text-slate-500">
                  Balaye la mission vers la gauche ou la droite pour voir les autres propositions.
                </p>
              ) : null}
            </div>
          )}
        </section>

        <section id="mes-missions" className="space-y-4 scroll-mt-6">
          <div className="rounded-3xl border border-green-200 bg-green-50 p-4">
            <h2 className="text-2xl font-bold text-green-800">
              Ma mission en cours
            </h2>
            <p className="text-sm text-green-700">
              Une seule mission peut être prise à la fois.
            </p>
          </div>

          {myMissions.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-center text-gray-600">
              Aucune mission en cours
            </div>
          ) : (
            <div className="space-y-4">
              {myMissions.map((order) =>
                OrderCard({ order, type: "mine" })
              )}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-2xl font-bold text-amber-900">
              Colis en attente de retour
            </h2>
            <p className="text-sm text-amber-800">
              Ces colis restent visibles, mais ils ne bloquent pas les nouvelles missions.
            </p>
          </div>

          {pendingReturns.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-center text-gray-600">
              Aucun retour en attente de paiement
            </div>
          ) : (
            <div className="space-y-4">
              {pendingReturns.map((order) => ReturnCard({ order, paid: false }))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4">
            <h2 className="text-2xl font-bold text-blue-900">
              Retours payés à effectuer
            </h2>
            <p className="text-sm text-blue-800">
              Retourne le colis aujourd'hui ou utilise « Autre créneau ».
            </p>
          </div>

          {paidReturns.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-center text-gray-600">
              Aucun retour payé à effectuer
            </div>
          ) : (
            <div className="space-y-4">
              {paidReturns.map((order) => ReturnCard({ order, paid: true }))}
            </div>
          )}
        </section>


      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          <Link
            href="/livreur/missions"
            className="rounded-xl bg-blue-50 px-1 py-2 text-center text-xs font-bold text-blue-700"
          >
            <span className="block text-lg">🔎</span>
            Missions
          </Link>
          <Link
            href="/livreur/historique"
            className="rounded-xl px-1 py-2 text-center text-xs font-semibold text-slate-600"
          >
            <span className="block text-lg">📦</span>
            Livraisons
          </Link>
          <Link
            href="/livreur/portefeuille"
            className="rounded-xl px-1 py-2 text-center text-xs font-semibold text-slate-600"
          >
            <span className="block text-lg">€</span>
            Cagnotte
          </Link>
          <Link
            href="/aide"
            className="rounded-xl px-1 py-2 text-center text-xs font-semibold text-slate-600"
          >
            <span className="block text-lg">💬</span>
            Aide
          </Link>
          <Link
            href="/profile"
            className="rounded-xl px-1 py-2 text-center text-xs font-semibold text-slate-600"
          >
            <span className="block text-lg">👤</span>
            Profil
          </Link>
        </div>
      </nav>
    </main>
  );
}