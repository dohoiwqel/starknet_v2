import { Dex } from "../../dex";
import { logger } from "../../logger/logger";
import { Token } from "../../tokens/tokens";
import * as avnuSdk from '@avnu/avnu-sdk'
import { ethers } from "ethers";

export class Avnu extends Dex {
    
    //Простой обмен с токена на токен
    async simpleSwap(quote: avnuSdk.Quote, slippage: number) {
        
        const swapOptions = {
            executeApprove: true,
            gasless: false,
            slippage
        }

        const swapResponse = await avnuSdk.executeSwap(this.account, quote, swapOptions)
        return this.waitForTransaction(swapResponse.transactionHash)
    }

    //Обмен, выступающий контроллером
    async swap(amountIn: bigint, tokenFrom: Token, tokenTo: Token, slippage: number) {
        try {

            const quoteRequest = {
                sellTokenAddress: tokenFrom.contractAddress,
                buyTokenAddress: tokenTo.contractAddress,
                sellAmount: amountIn,
                takerAddress: this.account.address
            }

            const quote = (await avnuSdk.fetchQuotes(quoteRequest))[0]

            const swapResponse = await this.simpleSwap(quote, slippage)
            const prettyAmountIn = ethers.formatUnits(quote.sellAmount, tokenFrom.decimals)
            const prettyAmountOut = ethers.formatUnits(quote.buyAmount, tokenTo.decimals)

            logger.success(`Выполнен swap на avnu tx: ${swapResponse.transaction_hash} ${tokenFrom.ticker} ${prettyAmountIn} -> ${tokenTo.ticker} ${prettyAmountOut}`)
            return swapResponse.transaction_hash

        } catch(e: any) {
            throw logger.error(`Не удалось выполнить avnu свап ${e}`, this.account.address, this.taskName)
        }
    }

    async refuelETH(slippage: number) {
        slippage = slippage > 1? 1: slippage
        logger.info('На балансе недостаточно эфира для обмена. Пытаемся обменять стейблы в эфир...', this.account.address, this.taskName)
        let {token, balance} = await this.finder.getHighestBalanceToken()
        let {eToken, eBalance} = await this.finder.getEth()
        await this.swap(balance, token, eToken, slippage)
        return
    }

    async getExecutionFee(amountIn: bigint, tokenFrom: Token, tokenTo: Token) {

        const quoteRequest = {
            sellTokenAddress: tokenFrom.contractAddress,
            buyTokenAddress: tokenTo.contractAddress,
            sellAmount: amountIn,
            takerAddress: this.account.address
        }

        const quote = (await avnuSdk.fetchQuotes(quoteRequest))[0]

        const approveCall = avnuSdk.buildApproveTx(quote.sellTokenAddress, quote.sellAmount, quote.chainId)
        const executeCall = await avnuSdk.fetchBuildExecuteTransaction(quote.quoteId)

        const feeData = await this.account.estimateInvokeFee([approveCall, executeCall])

        return feeData
    }
}