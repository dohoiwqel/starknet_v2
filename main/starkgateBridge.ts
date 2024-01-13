import { ethers } from "ethers"
import { Starkgate } from "../src/Starkgate/starkgate"
import { getEthGasPrice, getProvider, read, resultIndicator, sleep, waitForGas } from "../src/utils/utils"
import { MyAccounts } from "../src/wallets/myAccounts"
import { logger } from "../src/logger/logger"
import { config } from "../cfg"
import path from 'path'
import { screensaver } from "./screensaver"

async function getExecutionFee(ethProvider: ethers.JsonRpcProvider) {
    const gasPrice = await getEthGasPrice(ethProvider)
    const gas = 125_000n
    const executionFee = gas * gasPrice!

    return executionFee
}

async function main() {

    screensaver()

    const privates = await read(path.resolve(__dirname, '..', 'privates.txt'))
    const ethPrivates = await read(path.resolve(__dirname, '..', 'ethPrivates.txt'))
    
    const provider = getProvider()

    const starkgate = new Starkgate()
    const myAccounts = new MyAccounts()
    const ethProvider = new ethers.JsonRpcProvider('https://rpc.ankr.com/eth')

    const gasPrice = await getEthGasPrice(ethProvider)
    const starknetFee = await starkgate.getStarknetFee()

    if(ethPrivates.length === 0) {
        throw logger.error(`Введено 0 приватных ключей от EVM`, undefined, 'Starkgate')
    }

    let counter = 1

    for(let [i, ethPrivate] of ethPrivates.entries()) {
        const wallet = new ethers.Wallet(ethPrivate, ethProvider)
        const {account, privateKey} = await myAccounts.get_account_without_checkDeploy(privates[i])
        
        await waitForGas(account, config.minGasPrice)

        const l2Address = account.address

        //Value для транзакции
        let value = ethers.parseEther(config.starkgate_amount) + starknetFee
        //Количество эфира, которое будет забриджено
        let amount = ethers.parseEther(config.starkgate_amount)

        if(config.starkgate_bridge_full_ETH) {
            const executionFee = await getExecutionFee(ethProvider)
            const ethBalance = await ethProvider.getBalance(wallet.address)

            value = ethBalance - executionFee  
            amount = ethBalance - executionFee - starknetFee
        }
        
        const starkgate = new Starkgate(wallet)
        await starkgate.bridge(l2Address, value.toString(), amount.toString(), gasPrice!)
        
        await sleep(config.sleep_account[0], config.sleep_account[1])

        resultIndicator(counter, privates.length)
        counter++
    }

    return
}

main()