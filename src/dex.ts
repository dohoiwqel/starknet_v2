import { denomNumber } from "./denominator"
import { getEthPrice } from "./dex/oracles/oracle"
import { ethers } from "ethers"
import { Token } from "./tokens/tokens"
import { Protocol } from "./protocol"

export class Dex extends Protocol{

    getTokenTo(tokenFrom: Token) {
        const tokens = this.tokens.getIterator()
        return tokenFrom.contractAddress === tokens[0].contractAddress? tokens[1]: tokens[0]
    }
}

export class l0_or_jediSWAP extends Dex {
    async calculateAmountOut(amountIn: bigint, tokenFrom: Token, tokenTo: Token, slippage: denomNumber): Promise<bigint> {

        //Если обмениваем в ETH
        if(tokenTo.ticker === 'ETH') {
            const ethPrice = await getEthPrice()
            const formatAmountIn = Number(ethers.formatUnits(amountIn, tokenFrom.decimals))
            const amountOut = ethers.parseUnits((formatAmountIn / ethPrice).toFixed(tokenTo.decimals).toString(), tokenTo.decimals)
            const percent = (amountOut * BigInt(slippage.nominator)) / BigInt(100 * slippage.denominator)
            const result = amountOut - percent
            return result
        }

        //Если обмениваем ETH
        if(tokenFrom.ticker === 'ETH') {
            const ethPrice = await getEthPrice()
            const usdAmount = amountIn * BigInt(ethPrice)
            const formatUSDAmount = BigInt(ethers.formatUnits(usdAmount, tokenFrom.decimals - tokenTo.decimals).split('.')[0])
            const percent = (formatUSDAmount * BigInt(slippage.nominator)) / BigInt(100 * slippage.denominator)
            const result = formatUSDAmount - percent
            return result
        }

        const percent = (amountIn /100n) * BigInt(slippage.nominator) / BigInt(slippage.denominator)
        const result = amountIn - percent
        return result
        // if(tokenFrom.decimals === tokenTo.decimals) return result
        // if(tokenFrom.decimals < tokenTo.decimals) return result * BigInt(10**(tokenTo.decimals - tokenFrom.decimals))
        // return result / BigInt(10**(tokenFrom.decimals - tokenTo.decimals))
    }
}