import { Account } from "starknet";
import { Myswap } from "./dex/myswap/myswap";
import { Finder } from "./finder";
import { ethers } from "ethers";
import { makeDenominator } from "./denominator";
import { L0kswap } from "./dex/10kSwap/l0kswap";
import { Jediswap } from "./dex/jediswap/jediswap";
import { logger } from "./logger/logger";
import { Dmail } from "./dmail/dmail";
import { getRandomNumber } from "./randomNumber";
import { UpgradeImplementation } from "./Upgrade/upgrade";
import { getRandomInt } from "./utils/utils";
import { Orbiter } from "./orbiter/orbiter";
import { Iconfig } from "./interfaces/iconfig";
import { OKX } from "./okx/okx_protocol";
import { StarkId } from "./starkId/starkId";
import { Avnu } from "./dex/avnu/avnu";

export type Task = (account: Account, config: Iconfig) => Promise<void>

export async function task_mySwap(account: Account, config: Iconfig): Promise<void> {

    const mySwap = new Myswap(account, "mySwap")
    const finder = new Finder(account)
    let stableSwap = config.stableSwap

    let {token, balance} = await finder.getHighestBalanceToken()
    
    if(token.ticker === 'ETH') {
        stableSwap = false
    }

    if(stableSwap) {

        if(config.stableSwap_full_balance === false) {
            const stableAmount = getRandomInt(config.stable_amount_to_swap[0], config.stable_amount_to_swap[1])
            const formatStableAmount = ethers.parseUnits(stableAmount.toString(), token.decimals)
            
            if(formatStableAmount > balance) {
                logger.info(`Выбрано больше стейблов чем есть на  аккаунте. Обмениваем весь доступный баланс`, account.address, mySwap.taskName)
            } else {
                balance = formatStableAmount
            }
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
            return await task_mySwap(account, config)
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

export async function task_10kSwap(account: Account, config: Iconfig): Promise<void> {

    const l0kSwap = new L0kswap(account, "10kSwap")
    const finder = new Finder(account)
    let stableSwap = config.stableSwap

    let {token, balance} = await finder.getHighestBalanceToken()
    
    if(token.ticker === 'ETH') {
        stableSwap = false
    }

    if(stableSwap) {
        
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
            return await task_10kSwap(account, config)
        }

        const executionFee = await l0kSwap.getExecutionFee(ethToTrade, eToken, tokenTo, slippage)
        ethToTrade -= executionFee.suggestedMaxFee!


        if(ethToTrade < 0n) {
            await l0kSwap.refuelETH(config.slippage)
            return
        }
        
        
        if(ethToTrade < 0n) {
            await l0kSwap.refuelETH(config.slippage)
            return await task_10kSwap(account, config)
        }
        
        await l0kSwap.swap(ethToTrade, eToken, tokenTo, slippage)
        return
    }
}

export async function task_jediSwap(account: Account, config: Iconfig): Promise<void> {

    const jediSwap = new Jediswap(account, "jediSwap")
    const finder = new Finder(account)
    let stableSwap = config.stableSwap

    let {token, balance} = await finder.getHighestBalanceToken()
    
    if(token.ticker === 'ETH') {
        stableSwap = false
    }

    if(stableSwap) {
        
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
            return await task_jediSwap(account, config)
        }

        const executionFee = await jediSwap.getExecutionFee(ethToTrade, eToken, tokenTo, slippage)
        ethToTrade -= executionFee.suggestedMaxFee!

        if(ethToTrade < 0n) {
            await jediSwap.refuelETH(config.slippage)
            return await task_jediSwap(account, config)
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

    let depositValue = Number((getRandomNumber(LIQ_TO, LIQ_FROM) / 2).toFixed(6))

    await jediSwap.addLiquidity(depositValue, config.slippage)

    if(config.jediswap_liq_withdraw) {
        await jediSwap.withdrawFromPool()
    }
}

export async function task_dmail(account: Account, config: Iconfig) {
    if(config.Dmail_mails_count[1] <= 0) {
        logger.error(`Выбран модуль dmail. Количество dmail_mails_count должно быть больше 0`)
    }

    const randomMailsNumber = getRandomInt(config.Dmail_mails_count[0], config.Dmail_mails_count[1])

    const dmail = new Dmail(account, "Dmail")
    await dmail.sendMail(randomMailsNumber)
}

export async function task_upgrade_implementation(account: Account) {
    const upgrade = new UpgradeImplementation(account, "Upgrade")
    const currentVersion = "000.000.011"
    await upgrade.upgrade(currentVersion)
}

export async function task_orbiter_to_evm(account: Account, config: Iconfig) {

    if(!config.orbiter_to_evm_address) {
        throw logger.error('Не указан EVM аддресс', account.address)
    }

    const orbiter = new Orbiter(account, 'orbiterToEvm')
    let orbiterAmount = ethers.parseEther(config.orbiter_amount)

    if(config.orbiter_bridge_full_ETH) {
        orbiterAmount = 0n
    }

    await orbiter.bridge(orbiterAmount, config.orbiter_to_network, config.orbiter_to_evm_address)
}

export async function task_okx_deposit(account: Account, config: Iconfig) {
    const okx = new OKX(account, config.okx_apiKey, config.okx_passPhrase, config.okx_secretKey)

    if(!config.okx_deposit_address) {
        throw logger.error('Не указан OKX аддресс', account.address)
    }

    await okx.deposit(config.okx_deposit_address)
}

export async function task_mint_starkId(account: Account, config: Iconfig) {
    const starkId = new StarkId(account, `mint_starkId`)
    await starkId.mint()
}

export async function task_avnu(account: Account, config: Iconfig): Promise<void> {

    const avnu = new Avnu(account, "Avnu")
    const finder = new Finder(account)
    let stableSwap = config.stableSwap
    const slippage = config.slippage >= 1? 1: config.slippage //Для авну слиппейдж должен быть <= 1 

    let {token, balance} = await finder.getHighestBalanceToken()
    
    if(token.ticker === 'ETH') {
        stableSwap = false
    }   

    if(stableSwap) {
        
        if(config.stableSwap_full_balance === false) {
            const stableAmount = getRandomInt(config.stable_amount_to_swap[0], config.stable_amount_to_swap[1])
            balance = ethers.parseUnits(stableAmount.toString(), token.decimals)
        }

        const tokenTo = avnu.getTokenTo(token)
        await avnu.swap(balance, token, tokenTo, slippage)
        return

    } else {
        let {eToken, eBalance} = await finder.getEth()
        const ethToRemain = "0.002"

        let ethToTrade = eBalance - BigInt(ethers.parseEther(ethToRemain).toString())
        const tokenTo = avnu.getTokenTo(eToken)

        if(ethToTrade < 0n) {
            await avnu.refuelETH(config.slippage)
            return await task_avnu(account, config)
        }

        const executionFee = await avnu.getExecutionFee(ethToTrade, eToken, tokenTo)
        ethToTrade -= executionFee.suggestedMaxFee!

        if(ethToTrade < 0n) {
            await avnu.refuelETH(config.slippage)
            return await task_avnu(account, config)
        }
        
        await avnu.swap(ethToTrade, eToken, tokenTo, slippage)
        return
    }     
}