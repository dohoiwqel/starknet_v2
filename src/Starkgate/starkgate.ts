import { TransactionResponse, ethers } from "ethers";
import { Account, Contract } from "starknet";
import { Dex } from "../dex";
import { ABI } from './contractABI'
import { logger } from "../../logger/logger";

export class Starkgate {

    private account: ethers.Wallet
    private taskName = 'Starkgate'
    private contractAddress = '0xae0Ee0A63A2cE6BaeEFFE56e7714FB4EFE48D419'
    
    constructor(account: ethers.Wallet) {
        this.account = account
    }

    async bridge(amount: string, l2Address: string) {
        const contract = new ethers.Contract(this.contractAddress, ABI, this.account)
        amount = ethers.parseEther(amount).toString()

        const tx: TransactionResponse = await contract.deposit(amount, l2Address, {
            value: amount
        })

        logger.success(`Выполнен бридж. l1 tx: ${tx}`)
    }
}