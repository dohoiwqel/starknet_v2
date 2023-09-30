import { ethers } from "ethers"
import { Starkgate } from "../src/Starkgate/starkgate"
import { getEthGasPrice, getProvider, read, sleep, waitForGas } from "../utils/utils"
import { MyAccounts } from "../src/wallets/myAccounts"
import { Provider, constants } from "starknet"
import { logger } from "../logger/logger"
import { config } from "../cfg"
import path from 'path'


async function main() {

    const privates = await read(path.resolve(__dirname, '..', 'privates.txt'))
    const ethPrivates = await read(path.resolve(__dirname, '..', 'ethPrivates.txt'))
    
    const provider = getProvider()

    const starkgate = new Starkgate()
    const myAccounts = new MyAccounts(provider)
    const ethProvider = new ethers.JsonRpcProvider('https://rpc.ankr.com/eth')

    const gasPrice = await getEthGasPrice(ethProvider)
    const starknetFee = await starkgate.getStarknetFee()

    if(ethPrivates.length === 0) {
        throw logger.error(`Введено 0 приватных ключей от EVM`, undefined, 'Starkgate')
    }

    for(let [i, ethPrivate] of ethPrivates.entries()) {
        const wallet = new ethers.Wallet(ethPrivate, ethProvider)
        const {account, privateKey} = await myAccounts.getAccount(privates[i])
        
        await waitForGas(account, config.minGasPrice)

        const l2Address = account.address
        const value = ethers.parseEther(config.starkgate_amount) + starknetFee
        const amount = ethers.parseEther(config.starkgate_amount).toString()
        
        const starkgate = new Starkgate(wallet)
        await starkgate.bridge(l2Address, value.toString(), amount, gasPrice!)
        
        await sleep(config.sleep_account[0], config.sleep_account[1])
    }

    return
}

main()