import { ethers } from "ethers"
import { Account } from "starknet"
import { logger } from "../logger/logger"
import { makeDenominator } from "../src/denominator"
import { Jediswap } from "../src/dex/jediswap/jediswap"
import { Finder } from "../src/finder"
import { getEthPrice } from "../src/dex/oracles/oracle"

export async function refuelEth(account: Account, refuelThreshold: string, slippage: number) {
    
    const formatRefuelThreshold = ethers.parseEther(refuelThreshold)

    const finder = new Finder(account)
    const {eToken, eBalance} = await finder.getEth()

    if(eBalance < formatRefuelThreshold) {
        const {token, balance} = await finder.getHighestBalanceToken()

        const ethPrice = BigInt(await getEthPrice())
        const needToSwapEth = formatRefuelThreshold - eBalance
        const needToSwapUSD = BigInt(ethers.formatUnits(needToSwapEth * ethPrice, 12).split('.')[0])

        if(needToSwapUSD > balance) {
            throw logger.error('Недостаточно токенов для пополнения ETH', account.address)
        } else {

            const jediSwap = new Jediswap(account, "eth_refuel")
            await jediSwap.swap(needToSwapUSD, token, eToken, makeDenominator(slippage))
        }
    }
}