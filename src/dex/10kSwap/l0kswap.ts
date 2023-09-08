import { Contract, uint256 } from "starknet";
import { contractABI } from './contractABI';
import { denomNumber } from '../../denominator';
import { Dex, l0_or_jediSWAP } from '../dex';
import { logger } from "../../../logger/logger";
import { Token } from "../../tokens/tokens";

export class L0kswap extends l0_or_jediSWAP {

    private contractAddress: string = "0x07a6f98c03379b9513ca84cca1373ff452a7462a3b61598f0af5bb27ad7f76d1"
    private ABI: any[] = contractABI
    private taskName = '10kSwap'

    async swap(amountIn: bigint, tokenFrom: Token, tokenTo: Token, slippage: denomNumber) {
        const allowance = await this.getAllowance(this.account, tokenFrom, this.contractAddress)
        
        if(amountIn > allowance) {
            await this.approve(this.account, tokenFrom, uint256.bnToUint256(amountIn), this.contractAddress)
        }

        const amountOut = await this.calculateAmountOut(amountIn, tokenFrom, tokenTo, slippage)
        const path = [tokenFrom.contractAddress, tokenTo.contractAddress]
        const to = this.account.address
        const deadline = String(Math.round(Date.now() / 1000 + 3600));

        const callData = [
            uint256.bnToUint256(amountIn), 
            uint256.bnToUint256(amountOut),
            path,
            to,
            deadline
        ]

        const contract = new Contract(this.ABI, this.contractAddress, this.account) 
        const receipt = await contract.invoke("swapExactTokensForTokens", callData)  

        if(await this.waitForTransaction(receipt.transaction_hash)) {
            logger.success(`Выполнен свап на 10kSwap ${receipt.transaction_hash}`, this.account.address, this.taskName)
        } else {
            logger.error(`Не удалось выполнить свап га 10kSwap ${receipt.transaction_hash}`, this.account.address, this.taskName)
        }
    }

    async getExecutionFee(amountIn: bigint, tokenFrom: Token, tokenTo: Token, slippage: denomNumber) {
        const allowance = await this.getAllowance(this.account, tokenFrom, this.contractAddress)
        
        if(amountIn > allowance) {
            await this.approve(this.account, tokenFrom, uint256.bnToUint256(amountIn), this.contractAddress)
        }

        const amountOut = await this.calculateAmountOut(amountIn, tokenFrom, tokenTo, slippage)
        const path = [tokenFrom.contractAddress, tokenTo.contractAddress]
        const to = this.account.address
        const deadline = String(Math.round(Date.now() / 1000 + 3600));

        const callData = [
            uint256.bnToUint256(amountIn), 
            uint256.bnToUint256(amountOut),
            path,
            to,
            deadline
        ]

        const contract = new Contract(this.ABI, this.contractAddress, this.account) 
        
        return await contract.estimate('swapExactTokensForTokens', callData)
    }
}