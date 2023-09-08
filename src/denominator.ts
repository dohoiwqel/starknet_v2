export type denomNumber = {nominator: number, denominator: number}

export function makeDenominator(num: number, denominator?: number): denomNumber {
    denominator = denominator? denominator: 1000
    const nominator = Math.floor(denominator * num)
    return {nominator: nominator, denominator: denominator}
}