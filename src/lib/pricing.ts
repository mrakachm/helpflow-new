export function calculatePrice(distanceMeters: number) {
  const basePrice = 5
  const pricePerKm = 0.20
  const minimumPrice = 5

  const distanceKm = distanceMeters / 1000

  if (distanceKm <= 1) {
    return {
      distanceKm: 1,
      price: minimumPrice
    }
  }

  const roundedKm = Math.ceil(distanceKm)
  const extraKm = roundedKm - 1
  const finalPrice = basePrice + extraKm * pricePerKm

  return {
    distanceKm: roundedKm,
    price: Math.max(minimumPrice, Number(finalPrice.toFixed(2)))
  }
}