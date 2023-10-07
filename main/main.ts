import { Account, HttpError } from "starknet";
import { Iconfig } from '../interfaces/iconfig';
import { MyAccounts } from '../src/wallets/myAccounts';
import { logger } from "../logger/logger";
import { Task, task_10kSwap, task_dmail, task_jediSwap, task_jediSwap_liq, task_mint_starkId, task_mySwap, task_okx_deposit, task_orbiter_to_evm, task_upgrade_implementation } from "../src/tasks";
import { config } from "../cfg";
import { getRandomElementFromArray, getRandomInt, read, sleep } from "../utils/utils";
import { refuelEth } from "../src/refuel";
import { waitForGas } from "../utils/utils";
import path from 'path'
import { screensaver } from "./screensaver";
import { ethers } from "ethers";

function getTasks(config: Iconfig) {
    let tasks = new Array<Task>
    let protocols = new Array<Task>

    if(config.jediSwap) protocols.push(task_jediSwap);
    if(config.l0kswap) protocols.push(task_10kSwap);
    if(config.mySwap) protocols.push(task_mySwap);
    if(config.dmail) protocols.push(task_dmail);
    if(config.mint_starkId) protocols.push(task_mint_starkId)

    const maxProtocolsCount = config.protocols[1] > protocols.length? protocols.length: config.protocols[1]
    const minProtocolsCount = config.protocols[0] > maxProtocolsCount? maxProtocolsCount: config.protocols[0]
    const protocolsCount = getRandomInt(minProtocolsCount, maxProtocolsCount)
    getRandomElementFromArray(protocols, protocolsCount, tasks)

    //Задачи не относятся к протоколам, поэтому их делаем всегда
    if(config.jediSwap_liq) tasks.push(task_jediSwap_liq);

    return tasks
}

function shuffleTask(tasks: Array<Task>) {
    const shuffledArr = tasks.slice()
    shuffledArr.sort(() => Math.random() - 0.5)

    //Добавляем элементы, которые должны идти обязательно на заданных местах
    if(config.upgrade) shuffledArr.unshift(task_upgrade_implementation);
    if(config.orbiter_to_evm) shuffledArr.push(task_orbiter_to_evm)
    // if(config.okx_deposit) shuffledArr.push(task_okx_deposit)

    return shuffledArr;
}

function showTasks(tasks: Array<Task>, accountAddress: string) {
    let names: string[] = []

    for(let task of tasks) {
        names.push(task.name)
    }

    logger.info(`Путь для кошелька ${accountAddress} [${names.join(" -> ")}]`)
}

async function runTask(task: Task, account: Account, config: Iconfig): Promise<void> {
    try {
        await task(account, config)
    } catch(e: any) {
        if(e instanceof HttpError) {
            console.log('СПИМ')
            await sleep(5, 10)
            return await runTask(task, account, config)
        }

        throw e
    }
}

async function startTasks(tasks: Array<Task>, account: Account, config: Iconfig) {
    
    for(let task of tasks) {
        try {
            await waitForGas(account, config.minGasPrice)
            await runTask(task, account, config)
            await sleep(config.sleep_protocols[0], config.sleep_protocols[1])
        } catch(e) {
            if(e !== undefined) {
                logger.error(e, account.address, task.name)
                console.log(e)
            }
        }
    }
}

async function main() {

    screensaver()

    const privates = await read(path.resolve(__dirname, '..', 'privates.txt'))
    const okxAddresses = await read(path.resolve(__dirname, '..', 'okxAccount.txt'))
    const ethPrivates = await read(path.resolve(__dirname, '..', 'ethPrivates.txt'))
    
    logger.info(`Обнаружен ${privates.length} аккаунтов`)

    for(let [i, privateKeyOrMnemonic] of privates.entries()) {
        const tasks = getTasks(config);
        try {
            const myAccounts = new MyAccounts()
            const {account, privateKey} = await myAccounts.getAccount(privateKeyOrMnemonic)

            //Проверяем количество eth на аккаунте
            await refuelEth(account, config.refuel_threshold, config.slippage)

            const shuffledTasks = shuffleTask(tasks)
            showTasks(shuffledTasks, account.address)

            if(shuffledTasks.includes(task_orbiter_to_evm)) {

                if(privates.length !== ethPrivates.length) {
                    throw logger.error('Количество кошельков Starknet должно быть равно количеству ETH аддрессов')
                }

                if(config.orbiter_amount === '0') {
                    logger.error(`Укажите значение orbiter_amount`)
                    return
                }

                const evmAddress = new ethers.Wallet(ethPrivates[i]).address

                if(!evmAddress) {
                    logger.error('Заполните evm аддресса в data.json')
                    return
                }

                config.orbiter_to_evm_address = evmAddress
            }

            if(shuffledTasks.includes(task_okx_deposit)) {

                if(privates.length !== okxAddresses.length) {
                    throw logger.error('Количество кошельков Starknet должно быть равно количеству субаккаунтов OKX')
                }

                const okx_subAcc = okxAddresses[i]

                if(!okx_subAcc) {
                    logger.error('Заполните OKX аддресса')
                    return
                }

                config.okx_deposit_address = okx_subAcc
            }

            await startTasks(shuffledTasks, account, config)

        } catch(e: any) {
            if(e !== undefined) {
                logger.error(e)
            }
        }
        await sleep(config.sleep_account[0], config.sleep_account[1])
    }
}

main()