// import { Jediswap } from "./jediswap/jediswap";
// import { L0kswap } from "./10kSwap/l0kswap";
// import { Finder } from "./finder";
// import { Account } from "starknet";
// import { makeDenominator } from "../denominator";
// import { Iconfig } from "../../interfaces/iconfig";
// import { ethers } from "ethers";
// import { getEthPrice } from "./oracles/oracle";
// import { logger } from "../../logger/logger";
// import { Myswap } from "./myswap/myswap";
// import { l0_or_jediSWAP } from "./dex";

// export enum dexes {
//     jediswap = 'jediswap',
//     l0kswap = 'l0kswap',
//     myswap = 'myswap'
// }

// async function checkEthToRefuel(account: Account, dex: Jediswap | L0kswap | Myswap) {
//     console.log('checketh to refuel')
//     const finder = new Finder(account)
//     const {eToken, eBalance} = await finder.getEth()
//     const minimumEthValue = "0.001"
//     const formatMinimumEthValue = BigInt(ethers.utils.parseEther(minimumEthValue).toString())
//     const ethPrice = await getEthPrice()
//     const minimumEthValuePrice = Number(minimumEthValue) * Number(ethPrice) //цена 0.001e в долларах

//     console.log('тут')
//     //Если на балансе <= 0.001, то меняем часть стейблов в 0.0015 ETH
//     if(eBalance <= formatMinimumEthValue) {
//         console.log('внутри')
//         const {token, balance} = await finder.getHighestBalanceToken()
//         const formatBalance = Math.floor(Number(ethers.utils.formatUnits(balance, token.decimals)))

//         if(formatBalance < minimumEthValuePrice) {
//             throw logger.error(`На балансе недостаточно стейблкоинов для обмена на ETH`, account.address)
//             //ВЫВЕСТИ С БиРЖИ?????
//         }

//         logger.info(`Меняем часть стейблов на eth для Коммсиии`, account.address)
//         const slippage = makeDenominator(1)
//         const amountToSwap = BigInt(ethers.utils.parseUnits(minimumEthValuePrice.toFixed(2), token.decimals).toString())
//         await dex.swap(amountToSwap, token, eToken, slippage)
//     }
// }

// export async function dexSwap(chooseDex: dexes, account: Account, config: Iconfig) {
    
//     let dex: Jediswap | L0kswap | Myswap
//     if(chooseDex === dexes.jediswap) dex = new Jediswap(account);
//     if(chooseDex === dexes.l0kswap) dex = new L0kswap(account);
//     if(chooseDex === dexes.myswap) dex = new Myswap(account);
//     const finder = new Finder(account);

//     await checkEthToRefuel(account, new Jediswap(account))

//     if(dex! instanceof Myswap) {
//         if(config.stableSwap) {
//             //Поиск стейблкоина с максимальным балансом
//             let {token, balance} = await finder.getHighestBalanceToken()
//             const formatStableAmount = ethers.utils.parseUnits(config.stable_amount_to_swap.toString(), token.decimals).toBigInt()

//             if(formatStableAmount > 0n && formatStableAmount < balance) {
//                 balance = ethers.utils.parseUnits(config.stable_amount_to_swap.toString(), token.decimals).toBigInt()
//             }

//             const slippage = makeDenominator(config.slippage)
//             const tokenTo = dex!.getTokenTo(token)
//             await dex!.swap(balance, token, tokenTo, slippage)
//             return

//         } else {
//             let {eToken, eBalance} = await finder.getEth()
//             const ethToRemain = "0.002"

//             let ethToTrade = eBalance - BigInt(ethers.utils.parseEther(ethToRemain).toString())
//             const tokenTo = dex!.getTokenTo(eToken)
//             const slippage = makeDenominator(config.slippage)

//             const executionFee = await dex!.getExecutionFee(ethToTrade, eToken, tokenTo, slippage)
//             ethToTrade -= executionFee.suggestedMaxFee!

//             await dex!.swap(ethToTrade, eToken, tokenTo, slippage)
//             return
//         }
//     }

//     if(dex! instanceof l0_or_jediSWAP) {
//         if(config.stableSwap) {
            
//             //Поиск стейблкоина с максимальным балансом
//             let {token, balance} = await finder.getHighestBalanceToken()

//             if(config.stable_amount_to_swap > 0) {
//                 balance = ethers.utils.parseUnits(config.stable_amount_to_swap.toString(), token.decimals).toBigInt()
//                 console.log(balance)
//             }

//             const slippage = makeDenominator(config.slippage)
//             const tokenTo = dex!.getTokenTo(token)
//             await dex!.swap(balance, token, tokenTo, slippage)
//             return

//         } else {
//             let {eToken, eBalance} = await finder.getEth()
//             const ethToRemain = "0.002"

//             let ethToTrade = eBalance - BigInt(ethers.utils.parseEther(ethToRemain).toString())
//             const tokenTo = dex!.getTokenTo(eToken)
//             const slippage = makeDenominator(config.slippage)

//             const executionFee = await dex!.getExecutionFee(ethToTrade, eToken, tokenTo, slippage)
//             ethToTrade -= executionFee.suggestedMaxFee!

//             await dex!.swap(ethToTrade, eToken, tokenTo, slippage)
//             return
//         }
//     }
// }