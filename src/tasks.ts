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

export type Task = (account: Account, config: Iconfig) => Promise<void>  

export async function task_mySwap(account: Account, config: Iconfig) {

    const mySwap = new Myswap(account)
    const finder = new Finder(account)

    if(config.stableSwap) {
        //Поиск стейблкоина с максимальным балансом
        let {token, balance} = await finder.getHighestBalanceToken()
        const formatStableAmount = ethers.utils.parseUnits(config.stable_amount_to_swap.toString(), token.decimals).toBigInt()

        if(formatStableAmount > 0n && formatStableAmount < balance) {
            balance = ethers.utils.parseUnits(config.stable_amount_to_swap.toString(), token.decimals).toBigInt()
        }

        const slippage = makeDenominator(config.slippage)
        const tokenTo = mySwap.getTokenTo(token)
        await mySwap.swap(balance, token, tokenTo, slippage)
        return

    } else {
        let {eToken, eBalance} = await finder.getEth()
        const ethToRemain = "0.002"

        let ethToTrade = eBalance - BigInt(ethers.utils.parseEther(ethToRemain).toString())
        const tokenTo = mySwap.getTokenTo(eToken)
        const slippage = makeDenominator(config.slippage)

        const executionFee = await mySwap.getExecutionFee(ethToTrade, eToken, tokenTo, slippage)
        ethToTrade -= executionFee.suggestedMaxFee!

        await mySwap.swap(ethToTrade, eToken, tokenTo, slippage)
        return
    }
}

export async function task_10kSwap(account: Account, config: Iconfig) {

    const l0kSwap = new L0kswap(account)
    const finder = new Finder(account)

    if(config.stableSwap) {
        
        //Поиск стейблкоина с максимальным балансом
        let {token, balance} = await finder.getHighestBalanceToken()

        if(config.stable_amount_to_swap > 0) {
            balance = ethers.utils.parseUnits(config.stable_amount_to_swap.toString(), token.decimals).toBigInt()
            console.log(balance)
        }

        const slippage = makeDenominator(config.slippage)
        const tokenTo = l0kSwap.getTokenTo(token)
        await l0kSwap.swap(balance, token, tokenTo, slippage)
        return

    } else {
        let {eToken, eBalance} = await finder.getEth()
        const ethToRemain = "0.002"

        let ethToTrade = eBalance - BigInt(ethers.utils.parseEther(ethToRemain).toString())
        const tokenTo = l0kSwap.getTokenTo(eToken)
        const slippage = makeDenominator(config.slippage)

        const executionFee = await l0kSwap.getExecutionFee(ethToTrade, eToken, tokenTo, slippage)
        ethToTrade -= executionFee.suggestedMaxFee!

        await l0kSwap.swap(ethToTrade, eToken, tokenTo, slippage)
        return
    }
}

export async function task_jediSwap(account: Account, config: Iconfig) {

    const jediSwap = new Jediswap(account)
    const finder = new Finder(account)

    if(config.stableSwap) {
        
        //Поиск стейблкоина с максимальным балансом
        let {token, balance} = await finder.getHighestBalanceToken()

        if(config.stable_amount_to_swap > 0) {
            balance = ethers.utils.parseUnits(config.stable_amount_to_swap.toString(), token.decimals).toBigInt()
            console.log(balance)
        }

        const slippage = makeDenominator(config.slippage)
        const tokenTo = jediSwap.getTokenTo(token)
        await jediSwap.swap(balance, token, tokenTo, slippage)
        return

    } else {
        let {eToken, eBalance} = await finder.getEth()
        const ethToRemain = "0.002"

        let ethToTrade = eBalance - BigInt(ethers.utils.parseEther(ethToRemain).toString())
        const tokenTo = jediSwap.getTokenTo(eToken)
        const slippage = makeDenominator(config.slippage)

        const executionFee = await jediSwap.getExecutionFee(ethToTrade, eToken, tokenTo, slippage)
        ethToTrade -= executionFee.suggestedMaxFee!

        await jediSwap.swap(ethToTrade, eToken, tokenTo, slippage)
        return
    }
}

export async function task_jediSwap_liq(account: Account, config: Iconfig) {
    const jediSwap = new Jediswap(account)

    if(config.LIQ_FROM > config.LIQ_TO) {
        throw new Error("LIQ_TO должны быть больше чем LIQ_FROM")
    }

    const depositValue = getRandomNumber(config.LIQ_TO, config.LIQ_FROM) / 2
    await jediSwap.addLiquidity(depositValue, config.slippage)
}

export async function task_dmail(account: Account, config: Iconfig) {
    if(config.Dmail_mails_count < 0) {
        logger.error(`Выбран модуль dmail. Количество dmail_mails_count должно быть больше 0`)
    }

    const dmail = new Dmail(account)
    await dmail.sendMail(config.Dmail_mails_count)
}

