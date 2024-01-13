import { ethers } from "ethers"
import { Account } from "starknet"
import { logger } from "./logger/logger"
import { makeDenominator } from "./denominator"
import { Jediswap } from "./dex/jediswap/jediswap"
import { Finder } from "./finder"
import { getEthPrice } from "./dex/oracles/oracle"

export async function refuelEth(account: Account, refuelThreshold: string, slippage: number) {
    
    const formatRefuelThreshold = ethers.parseEther(refuelThreshold)

    const finder = new Finder(account)
    const {eToken, eBalance} = await finder.getEth()

    if(eBalance < formatRefuelThreshold) {
        const {token, balance} = await finder.getHighestBalanceToken()

        const ethPrice = BigInt(await getEthPrice())
        const needToSwapEth = formatRefuelThreshold - eBalance
        const needToSwapUSD = BigInt(ethers.formatUnits(needToSwapEth * ethPrice, 12).split('.')[0])

        if(needToSwapEth > balance) {
            throw logger.error('Недостаточно токенов для пополнения ETH', account.address)
        
        } else {
            const jediSwap = new Jediswap(account, "eth_refuel")
            await jediSwap.swap(needToSwapUSD, token, eToken, makeDenominator(slippage))
        }
    }
}