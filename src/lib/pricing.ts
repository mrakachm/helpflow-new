export type VehicleType =
  | "pied"
  | "velo"
  | "moto"
  | "voiture"
  | "camion";

export function calculatePrice(
  distanceMeters: number,
  vehicleType: VehicleType = "velo"
) {
  const pricePerKm = 0.20;

  let basePrice = 5;

  if (vehicleType === "voiture") {
    basePrice = 8;
  }

  if (vehicleType === "camion") {
    basePrice = 20;
  }

  const minimumPrice = basePrice;
  const distanceKm = distanceMeters / 1000;

  if (distanceKm <= 1) {
    return {
      distanceKm: 1,
      price: minimumPrice,
    };
  }

  const roundedKm = Math.ceil(distanceKm);
  const extraKm = roundedKm - 1;
  const finalPrice = basePrice + extraKm * pricePerKm;

  return {
    distanceKm: roundedKm,
    price: Math.max(
      minimumPrice,
      Number(finalPrice.toFixed(2))
    ),
  };
}