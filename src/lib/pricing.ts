export function calculatePrice(distanceMeters: number) {
  const basePrice = 4.99
  const pricePerKm = 0.20

  const distanceKm = distanceMeters / 1000

  if (distanceKm <= 1) {
    return {
      distanceKm: 1,
      price: basePrice
    }
  }

  const roundedKm = Math.ceil(distanceKm)

  const extraKm = roundedKm - 1
  const finalPrice = basePrice + (extraKm * pricePerKm)

  return {
    distanceKm: roundedKm,
    price: Number(finalPrice.toFixed(2))
  }
}