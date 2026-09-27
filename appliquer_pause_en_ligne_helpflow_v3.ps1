$ErrorActionPreference = "Stop"

$path = "src/app/livreur/missions/page.tsx"

if (-not (Test-Path $path)) {
  throw "Fichier introuvable : $path"
}

$backup = "$path.backup-avant-statut-reel"
Copy-Item $path $backup -Force

$content = Get-Content $path -Raw -Encoding UTF8
$original = $content

function Replace-Exact {
  param(
    [string]$Name,
    [string]$Old,
    [string]$New
  )

  if (-not $script:content.Contains($Old)) {
    throw "Bloc introuvable : $Name. Aucun changement n'a ete enregistre. Sauvegarde : $backup"
  }

  $script:content = $script:content.Replace($Old, $New)
}

# 1. Ajouter les champs Supabase au type du profil livreur
Replace-Exact "CourierProfile" @'
  service_area?: string | null;
  rating_average?: number | null;
};
'@ @'
  service_area?: string | null;
  rating_average?: number | null;
  courier_availability?: string | null;
  courier_availability_updated_at?: string | null;
};
'@

# 2. Ajouter les états React En ligne / Pause
Replace-Exact "Etats React" @'
  const [pushNotificationsKey, setPushNotificationsKey] = useState(0);
  const [returnClock, setReturnClock] = useState(() => Date.now());
'@ @'
  const [pushNotificationsKey, setPushNotificationsKey] = useState(0);
  const [returnClock, setReturnClock] = useState(() => Date.now());
  const [courierAvailability, setCourierAvailability] = useState<"ONLINE" | "PAUSED">("ONLINE");
  const [courierAvailabilitySaving, setCourierAvailabilitySaving] = useState(false);
'@

# 3. Lire le vrai statut depuis Supabase à l'ouverture
Replace-Exact "Chargement profil" @'
    if (!error && data) {
      setCourierProfile(data as CourierProfile);
      return;
    }

    setCourierProfile(null);
  }

  async function loadOrders(uid?: string | null, silent = false) {
'@ @'
    if (!error && data) {
      const profile = data as CourierProfile;
      setCourierProfile(profile);
      setCourierAvailability(
        cleanStatus(profile.courier_availability) === "PAUSED" ? "PAUSED" : "ONLINE"
      );
      return;
    }

    setCourierProfile(null);
  }

  async function toggleCourierAvailability() {
    if (!userId || courierAvailabilitySaving) return;

    const nextAvailability =
      courierAvailability === "ONLINE" ? "PAUSED" : "ONLINE";

    setCourierAvailabilitySaving(true);
    setMsg(null);

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("profiles")
      .update({
        courier_availability: nextAvailability,
        courier_availability_updated_at: now,
      })
      .eq("id", userId);

    if (error) {
      setMsg("Impossible de modifier ton statut livreur : " + error.message);
      setCourierAvailabilitySaving(false);
      return;
    }

    setCourierAvailability(nextAvailability);
    setCourierProfile((current) =>
      current
        ? {
            ...current,
            courier_availability: nextAvailability,
            courier_availability_updated_at: now,
          }
        : current
    );

    setMsg(
      nextAvailability === "ONLINE"
        ? "✅ Tu es en ligne. Tu peux accepter de nouvelles missions."
        : "⏸️ Tu es en pause. Tes missions déjà prises restent actives."
    );

    setCourierAvailabilitySaving(false);
  }

  async function loadOrders(uid?: string | null, silent = false) {
'@

# 4. Empêcher réellement une nouvelle acceptation pendant la pause
Replace-Exact "Accept mission" @'
  async function acceptMission(orderId: string) {
    if (!userId) {
      setMsg("Tu dois être connecté comme livreur.");
      return;
    }

    if (myMissions.length > 0) {
      setMsg("Tu dois terminer ta mission normale actuelle avant d'en accepter une autre.");
      return;
    }
'@ @'
  async function acceptMission(orderId: string) {
    if (!userId) {
      setMsg("Tu dois être connecté comme livreur.");
      return;
    }

    if (courierAvailability !== "ONLINE") {
      setMsg("Tu es en pause. Passe en ligne pour accepter une nouvelle mission.");
      return;
    }

    if (myMissions.length > 0) {
      setMsg("Tu dois terminer ta mission normale actuelle avant d'en accepter une autre.");
      return;
    }
'@

# 5. Remplacer le bouton localStorage par le bouton Supabase
Replace-Exact "Bouton En ligne Pause" @'
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
'@ @'
    <button
      type="button"
      onClick={toggleCourierAvailability}
      disabled={!userId || courierAvailabilitySaving}
      className="flex items-center gap-3 rounded-full bg-white px-4 py-2 font-bold shadow disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span>
        {courierAvailabilitySaving
          ? "Mise à jour..."
          : courierAvailability === "PAUSED"
            ? "Pause"
            : "En ligne"}
      </span>

      <span
        className={`flex h-7 w-14 items-center rounded-full p-1 transition-all ${
          courierAvailability === "PAUSED"
            ? "justify-end bg-orange-400"
            : "justify-start bg-green-500"
        }`}
      >
        <span className="h-5 w-5 rounded-full bg-white shadow" />
      </span>
    </button>
'@

# 6. Désactiver visuellement le bouton d'acceptation en Pause
Replace-Exact "Bouton Accepter mission" @'
          {type === "available" && (
            <button
              type="button"
              disabled={myMissions.length > 0 || hasOverdueReturn}
              onClick={() => acceptMission(order.id)}
              className={`w-full rounded-2xl px-4 py-3 font-semibold text-white ${
                myMissions.length > 0 || hasOverdueReturn
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-blue-600"
              }`}
            >
              {hasOverdueReturn
                ? "Retour en retard"
                : myMissions.length > 0
                  ? "Mission en cours"
                  : "Accepter cette mission"}
            </button>
          )}
'@ @'
          {type === "available" && (
            <button
              type="button"
              disabled={
                courierAvailability !== "ONLINE" ||
                myMissions.length > 0 ||
                hasOverdueReturn
              }
              onClick={() => acceptMission(order.id)}
              className={`w-full rounded-2xl px-4 py-3 font-semibold text-white ${
                courierAvailability !== "ONLINE" ||
                myMissions.length > 0 ||
                hasOverdueReturn
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-blue-600"
              }`}
            >
              {courierAvailability === "PAUSED"
                ? "En pause"
                : hasOverdueReturn
                  ? "Retour en retard"
                  : myMissions.length > 0
                    ? "Mission en cours"
                    : "Accepter cette mission"}
            </button>
          )}
'@

# 7. Afficher clairement l'état Pause dans la liste des missions
Replace-Exact "Message Pause" @'
            <p className="text-gray-500">
              Les étoiles indiquent les missions simples à prendre.
            </p>
            {myMissions.length > 0 ? (
'@ @'
            <p className="text-gray-500">
              Les étoiles indiquent les missions simples à prendre.
            </p>

            {courierAvailability === "PAUSED" ? (
              <p className="mt-2 rounded-2xl bg-orange-50 p-3 text-sm font-semibold text-orange-800">
                Tu es en pause. Tu ne peux pas accepter de nouvelle mission, mais tes missions déjà prises restent actives.
              </p>
            ) : null}

            {myMissions.length > 0 ? (
'@

if ($content -eq $original) {
  throw "Aucun changement n'a ete effectue."
}

Set-Content $path $content -Encoding UTF8

Write-Host ""
Write-Host "OK - Statut livreur En ligne / Pause relie a Supabase." -ForegroundColor Green
Write-Host "OK - En Pause, aucune nouvelle mission ne peut etre acceptee." -ForegroundColor Green
Write-Host "OK - Les missions deja prises restent actives." -ForegroundColor Green
Write-Host "Sauvegarde : $backup" -ForegroundColor Yellow
Write-Host ""
Write-Host "Prochaine commande : npm run build" -ForegroundColor Cyan
