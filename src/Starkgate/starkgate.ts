import { TransactionResponse, ethers } from "ethers";
import { Account, Contract } from "starknet";
import { Dex } from "../dex";
import { ABI } from './contractABI'
import { logger } from "../../logger/logger";
import { Iconfig } from "../../interfaces/iconfig";

export class Starkgate {

    private account: ethers.Wallet
    private taskName = 'Starkgate'
    private contractAddress = '0xae0Ee0A63A2cE6BaeEFFE56e7714FB4EFE48D419'
    
    constructor(account: ethers.Wallet) {
        this.account = account
    }

    async bridge(amount: string, l2Address: string, config: Iconfig) {

        if(config.starkgate_show_fee) {
            const gas = 125_000n
            const gasPrice = (await this.account.provider!.getFeeData()).gasPrice
            const total = ethers.formatEther(gas * gasPrice!) 
            logger.info(`Для бриджа нужно ${total}`,undefined, this.taskName)
            return
        }

        const contract = new ethers.Contract(this.contractAddress, ABI, this.account)
        amount = ethers.parseEther(amount).toString()

        const tx: TransactionResponse = await contract.deposit(amount, l2Address, {
            value: amount
        })

        logger.success(`Выполнен бридж. l1 tx: ${tx}`, this.account.address, this.taskName)
    }
}