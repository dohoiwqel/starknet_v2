import { ethers } from "ethers"
import { config } from "../cfg"
import { logger } from "../logger/logger"
import { Starkgate } from "../src/Starkgate/starkgate"
import { getEthGasPrice } from "../utils/utils"

async function main() {
    const starkgate = new Starkgate()
    const starknetFee = await starkgate.getStarknetFee()
    const ethProvider = new ethers.JsonRpcProvider('https://rpc.ankr.com/eth')
    
    const gasPrice = await getEthGasPrice(ethProvider)
    const gas = 125_000n
    const executionFee = gas * gasPrice!
    const value = ethers.parseEther(config.starkgate_amount)

    const total = ethers.formatEther((executionFee + value + starknetFee).toString().split('.')[0]) 
    logger.info(`Для бриджа ${config.starkgate_amount} ETH нужно минимум ${total} ETH`, undefined, 'Strakgate')
    
    return
}

main()