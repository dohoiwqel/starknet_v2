import { Account, Contract, Provider, SequencerProvider, constants, ec, transaction, uint256, ProviderInterface, stark } from "starknet";
import readline from 'readline'
import * as fs from 'fs'
import path from 'path'
import { Iconfig } from './interfaces/iconfig';
import { BigNumber, ethers } from 'ethers';
import { MyAccounts } from './wallets/myAccounts';
import { logger } from "./logger/logger";
import { Task, task_10kSwap, task_dmail, task_jediSwap, task_jediSwap_liq, task_mySwap } from "./src/tasks";

async function waitForGas(provider: SequencerProvider | Provider, config: Iconfig, account: Account) {
    let gasPrice: number
    while(true) {
        const block = await provider.getBlock("latest")
        const gasInWei = BigNumber.from(block.gas_price).toString()
        gasPrice = Math.round(Number(ethers.utils.formatUnits(gasInWei, "gwei")))
        if(gasPrice > config.minGasPrice) {
            console.log(`Ждем пока газ опустится до ${config.minGasPrice}. Текущий газ ${gasPrice} Gwei`)
            await new Promise(resolve => {setTimeout(() => resolve(' '), 10_000)})
        } else {
            break
        }
    }

    console.log(`Текущий газ ${gasPrice!} Gwei начинаем работу с аккаунтом ${account.address}`)
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

    logger.info(`Путь для кошелька ${accountAddress} [${names.join(" -> ")}]\n`)
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
            await task(account, config)
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

    logger.info(`Обнаружен ${privates.length} аккаунтов`)

    const tasks = getTasks(config)

    for(let [i, privateKeyORmnemonic] of privates.entries()) {
        (async () => {
            try {
                const myAccounts = new MyAccounts(provider)
                const {account, privateKey} = await myAccounts.getAccount(privateKeyORmnemonic)
                await myAccounts.checkDeploy(account, privateKey)

                await waitForGas(provider, config, account)
                
                const shuffledTasks = shuffleTask(tasks)
                showTasks(shuffledTasks, account.address)

                await startTasks(shuffledTasks, account, config)

            } catch(e: any) {
                logger.error(e)
            }
        })()
    }
}

main()