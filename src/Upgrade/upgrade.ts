import { Account, Contract } from "starknet";
import { ABI } from "./ABI";
import { Protocol } from "../protocol";
import { logger } from "../../logger/logger";


export class UpgradeImplementation extends Protocol {

    private async getVersion() {
        const contract = new Contract(ABI, this.account.address, this.account)
        const response: any = await contract.call("get_impl_version")
        return Buffer.from(response.res.toString(16), 'hex').toString('utf-8')
    }
        
    async upgrade(currentVersion: string) {
        const version = await this.getVersion()

        if(version === currentVersion) {
            logger.info('Аккаунт уже обновлен до актуальной версии', this.account.address, this.taskName)
            return
        }

        const contract = new Contract(ABI, this.account.address, this.account)
        const new_implementation = "0x5dec330eebf36c8672b60db4a718d44762d3ae6d1333e553197acb47ee5a062"

        const callData = [
            new_implementation
        ]

        try {
            const txReceipt = await this.sendTransaction(contract, 'upgrade', callData)
            const txResponse = await this.waitForTransaction(txReceipt.transaction_hash)
            logger.success(`Аккаунт обновлен tx: ${txResponse.transaction_hash}`, this.account.address, this.taskName)
            
        } catch(e) {
            throw logger.error(`Не удалось обновить аккаунт ${e}`, this.account.address, this.taskName)
        }
    }
}