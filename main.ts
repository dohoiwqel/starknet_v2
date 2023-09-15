import { Account, HttpError, Provider, SequencerProvider, constants, stark } from "starknet";
import { Iconfig } from './interfaces/iconfig';
import { ethers } from 'ethers';
import { MyAccounts } from './wallets/myAccounts';
import { logger } from "./logger/logger";
import { Task, task_10kSwap, task_dmail, task_jediSwap, task_jediSwap_liq, task_mySwap, task_starkgate, task_upgrade_implementation } from "./src/tasks";
import { Starkgate } from "./src/Starkgate/starkgate";
import { config } from "./cfg";
import { getRandomElementFromArray, getRandomInt, read, sleep } from "./utils/utils";

async function waitForGas(account: Account) {
    let gasPrice: number
    while(true) {
        const block = await account.getBlock("latest")
        gasPrice = Math.round(Number(ethers.formatUnits(block.gas_price!, "gwei")))
        if(gasPrice > config.minGasPrice) {
            console.log(`Ждем пока газ опустится до ${config.minGasPrice}. Текущий газ ${gasPrice} Gwei`)
            await new Promise(resolve => {setTimeout(() => resolve(' '), 10_000)})
        } else {
            break
        }
    }

    // console.log(`Текущий газ ${gasPrice!} Gwei начинаем работу с аккаунтом ${account.address}`)
    return
}

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

    if(config.jediSwap_liq) tasks.push(task_jediSwap_liq);
    if(config.upgrade) tasks.push(task_upgrade_implementation);

    return tasks
}

function shuffleTask(tasks: Array<Task>) {
    const shuffledArr = tasks.slice()
    shuffledArr.sort(() => Math.random() - 0.5)
    return shuffledArr;
}

function showTasks(tasks: Array<Task>, accountAddress: string) {
    let names: string[] = []

    for(let task of tasks) {
        names.push(task.name)
    }

    logger.info(`Путь для кошелька ${accountAddress} [${names.join(" -> ")}]`)
}

async function batchCreate(config: Iconfig) {
    logger.info(`Создаем ${config.batch_create_number} аккаунтов старкнет`)
    const myAccounts = new MyAccounts()
    myAccounts.batchCreate(config.batch_create_number)
    return
}

async function runTask(task: Task, account: Account, config: Iconfig): Promise<void> {
    try {
        await task(account, config)
    } catch(e: any) {
        console.log(e)
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
            await waitForGas(account)
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
    const privates = await read('privates.txt')

    const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } })

    if(config.batch_create) {
        await batchCreate(config)
        return
    }

    if(config.starkgate_show_fee) {
        const starkgate = new Starkgate()
        const starknetFee = await starkgate.getStarknetFee()
        const ethProvider = new ethers.JsonRpcProvider('https://rpc.ankr.com/eth')
        const gasPrice = (await ethProvider.getFeeData()).gasPrice

        const gas = 125_000n
        const executionFee = gas * gasPrice!
        const value = ethers.parseEther(config.starkgate_amount)

        const total = ethers.formatEther((executionFee + value + starknetFee).toString().split('.')[0]) 
        logger.info(`Для бриджа нужно минимум ${total}`, undefined, 'Strakgate')
    }

    if(config.starkgate) {
        const starkgate = new Starkgate()
        const myAccounts = new MyAccounts(provider)
        const ethProvider = new ethers.JsonRpcProvider('https://rpc.ankr.com/eth')
        const ethPrivates = await read('ethPrivates.txt')

        const gasPrice = (await ethProvider.getFeeData()).gasPrice
        const starknetFee = await starkgate.getStarknetFee()

        if(ethPrivates.length === 0) {
            throw logger.error(`Введено 0 приватных ключей от EVM`, undefined, 'Starkgate')
        }

        for(let [i, ethPrivate] of ethPrivates.entries()) {
            const wallet = new ethers.Wallet(ethPrivate, ethProvider)
            const {account, privateKey} = await myAccounts.getAccount(privates[i])
            
            await waitForGas(account)

            const l2Address = account.address
            const value = ethers.parseEther(config.starkgate_amount) + starknetFee
            const amount = ethers.parseEther(config.starkgate_amount).toString()
            await task_starkgate(wallet, l2Address, value.toString(), amount, gasPrice!)
            await sleep(config.sleep_account[0], config.sleep_account[1])
        }

        return
    }

    logger.info(`Обнаружен ${privates.length} аккаунтов`)


    for(let [i, privateKeyORmnemonic] of privates.entries()) {
        const tasks = getTasks(config);
        (async () => {
            try {
                const myAccounts = new MyAccounts(provider)
                const {account, privateKey} = await myAccounts.getAccount(privateKeyORmnemonic)
                await myAccounts.checkDeploy(account, privateKey)

                const shuffledTasks = shuffleTask(tasks)
                showTasks(shuffledTasks, account.address)

                await startTasks(shuffledTasks, account, config)

            } catch(e: any) {
                logger.error(e)
            }
        })()
        await sleep(config.sleep_account[0], config.sleep_account[1])
    }
}

main()