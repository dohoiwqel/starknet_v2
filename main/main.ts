import { Account, HttpError, Provider, constants } from "starknet";
import { Iconfig } from '../interfaces/iconfig';
import { MyAccounts } from '../wallets/myAccounts';
import { logger } from "../logger/logger";
import { Task, task_10kSwap, task_dmail, task_jediSwap, task_jediSwap_liq, task_mySwap, task_orbiter_to_evm, task_upgrade_implementation } from "../src/tasks";
import { config } from "../cfg";
import { getRandomElementFromArray, getRandomInt, read, sleep } from "../utils/utils";
import { refuelEth } from "../utils/refuel";
import { waitForGas } from "../utils/utils";
import path from 'path'
import { create_data } from "../accountManager/accountManager";

function getTasks(config: Iconfig) {
    let tasks = new Array<Task>
    let protocols = new Array<Task>

    if(config.jediSwap) protocols.push(task_jediSwap);
    if(config.l0kswap) protocols.push(task_10kSwap);
    if(config.mySwap) protocols.push(task_mySwap);
    if(config.dmail) protocols.push(task_dmail);

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
    const privates = await read(path.resolve(__dirname, '..', 'privates.txt'))
    let dataJson = await create_data()

    if(!dataJson) {
        return
    }
    
    logger.success('Данные успешно загружены')

    const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } })

    logger.info(`Обнаружен ${privates.length} аккаунтов`)

    for(let [i, privateKeyOrMnemonic] of privates.entries()) {
        const tasks = getTasks(config);
        try {
            const myAccounts = new MyAccounts(provider)
            const {account, privateKey} = await myAccounts.getAccount(privateKeyOrMnemonic)
            await myAccounts.checkDeploy(account, privateKey)

            //Проверяем количество eth на аккаунте
            await refuelEth(account, config.refuel_threshold, config.slippage)

            const shuffledTasks = shuffleTask(tasks)
            showTasks(shuffledTasks, account.address)

            if(shuffledTasks.includes(task_orbiter_to_evm)) {
                const evmAddress = dataJson[account.address].ethAcoount

                if(!evmAddress) {
                    logger.error('Заполните evm аддресса в data.json')
                    return
                }

                config.orbiter_to_evm_address = evmAddress
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