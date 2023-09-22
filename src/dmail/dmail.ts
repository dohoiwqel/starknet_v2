import { Account, Contract, HttpError, Provider, SequencerProvider, TransactionStatus, constants, ec, number, transaction, uint256 } from "starknet";
import { encoder } from "./encoder";
import { ABI } from './ABI'
import { logger } from "../../logger/logger";
import { Protocol } from "../protocol";

export class Dmail extends Protocol {

    private generateRandomWord(length: number) {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        let randomWord = '';
      
        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * alphabet.length);
          randomWord += alphabet[randomIndex];
        }
      
        return randomWord;
    }

    private getRandomInteger(data: number[]) {
        const [min, max] = data
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    async sendMail(count: number) {
        const contractAddress = '0x0454f0bd015e730e5adbb4f080b075fdbf55654ff41ee336203aa2e1ac4d4309'
        const contract = new Contract(ABI, contractAddress, this.account)        
    
        logger.info(`Отправляем ${count} писем`, this.account.address, this.taskName)

        for(let i=0; i<count; i++) {

            const mailLength = this.getRandomInteger([5, 10])
            const textLength = this.getRandomInteger([10, 20])
    
            const email = encoder(`${this.generateRandomWord(mailLength)}@gmail.com`)
            const text = encoder(`${this.generateRandomWord(textLength)}`)

            const callData = [
                email,
                text
            ]

            try {
                const receipt = await this.sendTransaction(contract, "transaction", callData)
                logger.success(`Отправлено письмо ${receipt.transaction_hash}`, this.account.address, this.taskName)
            } catch(e: any) {
                throw e
                // logger.error(`Не удалось отправить письмо ${e}`, this.account.address, this.taskName)
            }
        }

}
}