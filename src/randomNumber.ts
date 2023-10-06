export function getRandomNumber(max: number, min: number) {
    return Number((Math.random() * (max - min) + min).toFixed(6))
}