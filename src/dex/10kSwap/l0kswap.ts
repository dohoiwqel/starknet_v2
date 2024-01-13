import { Contract, EstimateFeeResponse, HttpError, uint256 } from "starknet";
import { contractABI } from './contractABI';
import { denomNumber, makeDenominator } from '../../denominator';
import { l0_or_jediSWAP } from '../../dex';
import { logger } from "../../logger/logger";
import { Token } from "../../tokens/tokens";
import { ethers } from "ethers";

export class L0kswap extends l0_or_jediSWAP {

    private contractAddress: string = "0x07a6f98c03379b9513ca84cca1373ff452a7462a3b61598f0af5bb27ad7f76d1"
    private ABI: any[] = contractABI

    async swap(amountIn: bigint, tokenFrom: Token, tokenTo: Token, slippage: denomNumber) {
        const allowance = await this.getAllowance(tokenFrom, this.contractAddress)

        if(amountIn > allowance) {
            await this.approve(tokenFrom, uint256.bnToUint256(amountIn), this.contractAddress)
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

        try {
            const receipt = await this.sendTransaction(contract, 'swapExactTokensForTokens', callData)
            const prettyAmountIn = ethers.formatUnits(amountIn, tokenFrom.decimals)
            const prettyAmountOut = ethers.formatUnits(amountOut, tokenTo.decimals)
            logger.success(`Выполнен свап tx: ${receipt} ${tokenFrom.ticker} ${prettyAmountIn} -> ${tokenTo.ticker} ${prettyAmountOut}`, this.account.address, this.taskName)
        } catch(e: any) {
            console.log([
                amountIn, 
                amountOut,
                path,
                to,
                deadline
            ])
            logger.error(`Не удалось выполнить свап ${tokenFrom.ticker} на ${tokenTo.ticker} ${e}`, this.account.address, this.taskName)

            if(e instanceof HttpError) {
                throw e
            }
        }
    }

    async getExecutionFee(amountIn: bigint, tokenFrom: Token, tokenTo: Token, slippage: denomNumber): Promise<EstimateFeeResponse> {
        const allowance = await this.getAllowance(tokenFrom, this.contractAddress)

        if(amountIn > allowance) {
            await this.approve(tokenFrom, uint256.bnToUint256(amountIn), this.contractAddress)
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

        try {
            return await contract.estimate('swapExactTokensForTokens', callData)
        } catch(e: any) {
            if(e.message && e.message.includes('nonce')) {
                return await this.getExecutionFee(amountIn, tokenFrom, tokenTo, slippage)
            } else {
                throw e
            }
        }
    }

    async refuelETH(slippage: number) {
        logger.info('На балансе недостаточно эфира для обмена. Пытаемся обменять стейблы в эфир...', this.account.address, this.taskName)
        let {token, balance} = await this.finder.getHighestBalanceToken()
        let {eToken, eBalance} = await this.finder.getEth()
        const _slippage = makeDenominator(slippage)
        await this.swap(balance, token, eToken, _slippage)
        return
    }
}