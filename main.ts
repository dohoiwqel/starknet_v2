import { Account, Provider, SequencerProvider, constants, stark } from "starknet";
import readline from 'readline'
import * as fs from 'fs'
import path from 'path'
import { Iconfig } from './interfaces/iconfig';
import { ethers } from 'ethers';
import { MyAccounts } from './wallets/myAccounts';
import { logger } from "./logger/logger";
import { Task, task_10kSwap, task_dmail, task_jediSwap, task_jediSwap_liq, task_mySwap, task_starkgate, task_upgrade_implementation } from "./src/tasks";
import { Starkgate } from "./src/starkgate/starkgate";

async function waitForGas(account: Account, config: Iconfig) {
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

async function read(fileName: string): Promise<string[]> {
    const array: string[] = []
    const readInterface = readline.createInterface({
        input: fs.createReadStream(fileName),
        crlfDelay: Infinity,
    })
    for await (const line of readInterface) {
        array.push(line)
    }
    return array
}

function getTasks(config: Iconfig) {
    let tasks = new Array<Task>
    
    if(config.jediSwap) tasks.push(task_jediSwap);
    if(config.jediSwap_liq) tasks.push(task_jediSwap_liq);
    if(config.l0kswap) tasks.push(task_10kSwap);
    if(config.mySwap) tasks.push(task_mySwap);
    if(config.dmail) tasks.push(task_dmail);
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

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function sleep(config: Iconfig) {
    const seconds = getRandomInt(config.sleep_min, config.sleep_max) 
    // console.log(`Спим ${seconds} секунд`)
    return new Promise(resolve => setTimeout(() => resolve(''), seconds*1000))
}

async function batchCreate(config: Iconfig) {
    logger.info(`Создаем ${config.batch_create_number} аккаунтов старкнет`)
    const myAccounts = new MyAccounts()
    myAccounts.batchCreate(config.batch_create_number)
    return
}

async function startTasks(tasks: Array<Task>, account: Account, config: Iconfig) {
    
    for(let task of tasks) {
        try {
            await waitForGas(account, config)
            await task(account, config)
            await sleep(config)
        } catch(e) {
            logger.error(e, account.address, task.name)
        }
    }

}

async function main() {
    const config: Iconfig = JSON.parse(fs.readFileSync(path.join(__dirname, "./config.json"), {encoding: "utf8", flag: "r",}))
    const privates = await read('privates.txt')

    const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } })

    if(config.batch_create) {
        await batchCreate(config)
        return
    }

    if(config.starkgate) {
        const starkgate = new Starkgate()
        const myAccounts = new MyAccounts(provider)
        const ethProvider = new ethers.JsonRpcProvider('https://rpc.ankr.com/eth')
        const ethPrivates = await read('ethPrivates.txt')

        const gasPrice = (await ethProvider.getFeeData()).gasPrice
        const starknetFee = await starkgate.getStarknetFee()

        if(config.starkgate_show_fee) {
            const gas = 125_000n
            const executionFee = gas * gasPrice!
            const value = ethers.parseEther(config.starkgate_amount)

            const total = ethers.formatEther((executionFee + value + starknetFee).toString().split('.')[0]) 
            logger.info(`Для бриджа нужно минимум ${total}`, undefined, 'Strakgate')
            return
        }

        if(ethPrivates.length === 0) {
            throw logger.error(`Введено 0 приватных ключей от EVM`, undefined, 'Starkgate')
        }

        for(let [i, ethPrivate] of ethPrivates.entries()) {
            const wallet = new ethers.Wallet(ethPrivate, ethProvider)
            const {account, privateKey} = await myAccounts.getAccount(privates[i])
            
            await waitForGas(account, config)

            const l2Address = account.address
            const value = ethers.parseEther(config.starkgate_amount) + starknetFee
            const amount = ethers.parseEther(config.starkgate_amount).toString()
            await task_starkgate(wallet, l2Address, value.toString(), amount, gasPrice!)
            await sleep(config)
        }

        return
    }

    logger.info(`Обнаружен ${privates.length} аккаунтов`)

    const tasks = getTasks(config)

    for(let [i, privateKeyORmnemonic] of privates.entries()) {
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
        await sleep(config)
    }
}

main()