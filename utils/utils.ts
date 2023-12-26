import readline from 'readline'
import * as fs from 'fs'
import { Account, Provider, RpcProvider, constants } from 'starknet';
import { JsonRpcApiProvider, ethers } from 'ethers';
import { config } from '../cfg';
import colors from 'colors';

export function sleep(sleep_min: number, sleep_max: number) {
    const seconds = getRandomInt(sleep_min, sleep_max) 
    return new Promise(resolve => setTimeout(() => resolve(''), seconds*1000))
}

export function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max) + 1;
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

export async function read(fileName: string): Promise<string[]> {
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

export function getRandomElementFromArray(fromArray: any[], n: number, mutableArray: any[]): string[] {
    const selectedIndices: number[] = [];

    if(fromArray.length === 0) {
        return mutableArray
    }
  
    while (mutableArray.length < n) {
        const randomIndex = Math.floor(Math.random() * fromArray.length);
        // Проверка, что строка с таким индексом еще не была выбрана
        if (!selectedIndices.includes(randomIndex)) {
            selectedIndices.push(randomIndex);
            mutableArray.push(fromArray[randomIndex]);
        }
    }
  
    return mutableArray;
}

export async function waitForGas(account: Account, minGasPrice: number) {
    let gasPrice: number
    const provider = new Provider({rpc: {nodeUrl: "https://starknet-mainnet.public.blastapi.io/rpc/v0.5" }})

    while(true) {
        const block = await provider.getBlock("latest")
        gasPrice = Math.round(Number(ethers.formatUnits(block.gas_price!, "gwei")))
        if(gasPrice > minGasPrice) {
            console.log(`Ждем пока газ опустится до ${minGasPrice}. Текущий газ ${gasPrice} Gwei`)
            await new Promise(resolve => {setTimeout(() => resolve(' '), 10_000)})
        } else {
            break
        }
    }

    // console.log(`Текущий газ ${gasPrice!} Gwei начинаем работу с аккаунтом ${account.address}`)
    return
}

export async function getEthGasPrice(ethProvider: JsonRpcApiProvider) {
    let gasPrice = (await ethProvider.getFeeData()).gasPrice
    gasPrice! += ethers.parseUnits("2", 'gwei')
    return gasPrice
}

export function getRandomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export function getProvider() {
    let provider: Provider
    
    if(config.rpc_url) {
        provider = new Provider({rpc: {nodeUrl: config.rpc_url} })
    } else {
        provider = new Provider({rpc: {nodeUrl: "https://starknet-mainnet.public.blastapi.io/rpc/v0.5" }});
    }

    return provider
}

export function printCenteredText(text: string, colors?: any) {
    const terminalWidth = process.stdout.columns; // Получаем ширину консоли
    const padding = Math.floor((terminalWidth - text.length) / 2); // Вычисляем количество пробелов для выравнивания текста по центру
    const centeredText = ' '.repeat(padding) + text; // Добавляем пробелы перед текстом
    colors?console.log(colors(centeredText)): console.log(centeredText); // Выводим текст в консоль
}

export function resultIndicator(counter: number, allNumber: number) {
    printCenteredText(colors.blue('-----------------------------------'))
    printCenteredText(colors.blue(`|              Done: ${counter}/${allNumber}            |`))
    printCenteredText(colors.blue('-----------------------------------'))
}