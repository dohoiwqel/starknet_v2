import { Account } from "starknet";
import { Myswap } from "./dex/myswap/myswap";
import { Finder } from "./finder";
import { ethers } from "ethers";
import { Iconfig } from "../interfaces/iconfig";
import { makeDenominator } from "./denominator";
import { L0kswap } from "./dex/10kSwap/l0kswap";
import { Jediswap } from "./dex/jediswap/jediswap";
import { logger } from "../logger/logger";
import { Dmail } from "./dmail/dmail";
import { getRandomNumber } from "./randomNumber";
import { Starkgate } from "./Starkgate/starkgate";
import { UpgradeImplementation } from "./Upgrade/upgrade";
import { getRandomInt } from "../utils/utils";

export type Task = (account: Account, config: Iconfig) => Promise<void>  

export async function task_mySwap(account: Account, config: Iconfig) {

    const mySwap = new Myswap(account, "mySwap")
    const finder = new Finder(account)

    if(config.stableSwap) {
        //Поиск стейблкоина с максимальным балансом
        let {token, balance} = await finder.getHighestBalanceToken()
        const formatStableAmount = ethers.parseUnits(config.stable_amount_to_swap.toString(), token.decimals)

        if(formatStableAmount > 0n && formatStableAmount < balance) {
            balance = ethers.parseUnits(config.stable_amount_to_swap.toString(), token.decimals)
        }

        const slippage = makeDenominator(config.slippage)
        const tokenTo = mySwap.getTokenTo(token)
        await mySwap.swap(balance, token, tokenTo, slippage)
        return

    } else {
        let {eToken, eBalance} = await finder.getEth()
        const ethToRemain = "0.002"

        let ethToTrade = eBalance - BigInt(ethers.parseEther(ethToRemain).toString())
        const tokenTo = mySwap.getTokenTo(eToken)
        const slippage = makeDenominator(config.slippage)

        if(ethToTrade < 0n) {
            await mySwap.refuelETH(config.slippage)
            return
        }

        const executionFee = await mySwap.getExecutionFee(ethToTrade, eToken, tokenTo, slippage)
        ethToTrade -= executionFee.suggestedMaxFee!

        if(ethToTrade < 0n) {
            await mySwap.refuelETH(config.slippage)
            return
        }

        await mySwap.swap(ethToTrade, eToken, tokenTo, slippage)
        return
    }
}

export async function task_10kSwap(account: Account, config: Iconfig) {

    const l0kSwap = new L0kswap(account, "10kSwap")
    const finder = new Finder(account)

    if(config.stableSwap) {
        
        //Поиск стейблкоина с максимальным балансом
        let {token, balance} = await finder.getHighestBalanceToken()

        if(config.stableSwap_full_balance === false) {
            const stableAmount = getRandomInt(config.stable_amount_to_swap[0], config.stable_amount_to_swap[1])
            balance = ethers.parseUnits(stableAmount.toString(), token.decimals)
        }

        const slippage = makeDenominator(config.slippage)
        const tokenTo = l0kSwap.getTokenTo(token)
        await l0kSwap.swap(balance, token, tokenTo, slippage)
        return

    } else {
        let {eToken, eBalance} = await finder.getEth()
        const ethToRemain = "0.002"

        let ethToTrade = eBalance - BigInt(ethers.parseEther(ethToRemain).toString())
        const tokenTo = l0kSwap.getTokenTo(eToken)
        const slippage = makeDenominator(config.slippage)

        if(ethToTrade < 0n) {
            await l0kSwap.refuelETH(config.slippage)
            return
        }

        const executionFee = await l0kSwap.getExecutionFee(ethToTrade, eToken, tokenTo, slippage)
        ethToTrade -= executionFee.suggestedMaxFee!

        if(ethToTrade < 0n) {
            await l0kSwap.refuelETH(config.slippage)
            return
        }
        
        await l0kSwap.swap(ethToTrade, eToken, tokenTo, slippage)
        return
    }
}

export async function task_jediSwap(account: Account, config: Iconfig) {

    const jediSwap = new Jediswap(account, "jediSwap")
    const finder = new Finder(account)

    if(config.stableSwap) {
        
        //Поиск стейблкоина с максимальным балансом
        let {token, balance} = await finder.getHighestBalanceToken()

        if(config.stableSwap_full_balance === false) {
            const stableAmount = getRandomInt(config.stable_amount_to_swap[0], config.stable_amount_to_swap[1])
            balance = ethers.parseUnits(stableAmount.toString(), token.decimals)
        }

        const slippage = makeDenominator(config.slippage)
        const tokenTo = jediSwap.getTokenTo(token)
        await jediSwap.swap(balance, token, tokenTo, slippage)
        return

    } else {
        let {eToken, eBalance} = await finder.getEth()
        const ethToRemain = "0.002"

        let ethToTrade = eBalance - BigInt(ethers.parseEther(ethToRemain).toString())
        const tokenTo = jediSwap.getTokenTo(eToken)
        const slippage = makeDenominator(config.slippage)

        if(ethToTrade < 0n) {
            await jediSwap.refuelETH(config.slippage)
            return
        }

        const executionFee = await jediSwap.getExecutionFee(ethToTrade, eToken, tokenTo, slippage)
        ethToTrade -= executionFee.suggestedMaxFee!

        if(ethToTrade < 0n) {
            await jediSwap.refuelETH(config.slippage)
            return
        }

        await jediSwap.swap(ethToTrade, eToken, tokenTo, slippage)
        return
    }
}

export async function task_jediSwap_liq(account: Account, config: Iconfig) {
    const jediSwap = new Jediswap(account, "jediSwap_liq")

    const LIQ_FROM = config.jediSwap_liq_amount[0]
    const LIQ_TO = config.jediSwap_liq_amount[1]

    if(LIQ_FROM > LIQ_TO) {
        throw new Error("LIQ_TO должны быть больше чем LIQ_FROM")
    }

    const depositValue = getRandomNumber(LIQ_TO, LIQ_FROM) / 2
    await jediSwap.addLiquidity(depositValue, config.slippage)
}

export async function task_dmail(account: Account, config: Iconfig) {
    if(config.Dmail_mails_count[1] <= 0) {
        logger.error(`Выбран модуль dmail. Количество dmail_mails_count должно быть больше 0`)
    }

    const randomMailsNumber = getRandomInt(config.Dmail_mails_count[0], config.Dmail_mails_count[1])

    const dmail = new Dmail(account, "Dmail")
    await dmail.sendMail(randomMailsNumber)
}

export async function task_starkgate(account: ethers.Wallet, l2Address: string, value: string, amount: string, gasPrice: bigint) {
    const starkgate = new Starkgate(account)
    await starkgate.bridge(l2Address, value, amount, gasPrice)
}

export async function task_upgrade_implementation(account: Account) {
    const upgrade = new UpgradeImplementation(account, "Upgrade")
    const currentVersion = "000.000.011"
    await upgrade.upgrade(currentVersion)
}