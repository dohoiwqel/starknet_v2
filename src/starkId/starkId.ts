import { Contract } from "starknet";
import { Dex } from "../dex";
import { ABI } from "./ABI";
import { logger } from "../logger/logger";


export class StarkId extends Dex {
    
    async mint() {
        const contractAddress = "0x05dbdedc203e92749e2e746e2d40a768d966bd243df04a6b712e222bc040a9af"
        const nftId = Math.floor(1e12 * Math.random())
        const contract = new Contract(ABI, contractAddress, this.account)

        const callData = [
            nftId
        ]

        try {
            const txResponse = await this.sendTransaction(contract, 'mint', callData)
            logger.success(`Сминтили StarknetId tx: ${txResponse}`, this.account.address, this.taskName)
        } catch(e) {
            throw logger.error(`Не удалось сминтить StarknetId ${e}`, this.account.address, this.taskName)
        } 
    }
    
}