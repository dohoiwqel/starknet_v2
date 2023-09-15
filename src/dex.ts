import { Account, Contract, Provider, SequencerProvider, TransactionStatus, constants, uint256 } from "starknet"
import { denomNumber } from "./denominator"
import { getEthPrice } from "./dex/oracles/oracle"
import { ethers } from "ethers"
import { logger } from "../logger/logger"
import { Token, Tokens } from "./tokens/tokens"
import { Protocol } from "./protocol"
import { Finder } from "./finder"

export class Dex extends Protocol{

    protected tokens: Tokens = new Tokens()
    protected finder = new Finder(this.account)

    async getBalanceOf(account: Account, token: Token): Promise<bigint> {
        const contractAddress = token.contractAddress
        const ABI = token.ABI
        const contract = new Contract(ABI, contractAddress)        
        contract.connect(account)
        const balance = await contract.balanceOf(account.address)
        return balance.balance.low
    }

    async getAllowance(account: Account, token: Token, spender: string): Promise<bigint> {
        const contract = new Contract(token.ABI, token.contractAddress)        
        contract.connect(account)
        const allowance = await contract.allowance(account.address, spender)
        return uint256.uint256ToBN(allowance.remaining)
    }

    async approve(account: Account, token: Token, amount: uint256.Uint256, spender: string, task_name: string) {
        const contractAddress = token.contractAddress
        const ABI = token.ABI
        const contract = new Contract(ABI, contractAddress, account)        

        const callData = [
            spender,
            amount
        ]

        try {
            const receipt = await this.sendTransaction(contract, this.account, "approve", callData)
            logger.success(`Выполнен аппрув ${receipt.transaction_hash}`, this.account.address, this.taskName)
        } catch(e) {
            logger.error(`Не удалось выполнить аппрув ${e}`, this.account.address, this.taskName)
            console.log(e)
        }

    }

    getTokenTo(tokenFrom: Token) {
        const tokens = this.tokens.getIterator()
        return tokenFrom.contractAddress === tokens[0].contractAddress? tokens[1]: tokens[0]
    }
}

export class l0_or_jediSWAP extends Dex {
    async calculateAmountOut(amountIn: bigint, tokenFrom: Token, tokenTo: Token, slippage: denomNumber): Promise<bigint> {

        //Если обмениваем в ETH
        if(tokenTo.ticker === 'ETH') {
            const ethPrice = await getEthPrice()
            const formatAmountIn = Number(ethers.formatUnits(amountIn, tokenFrom.decimals))
            const amountOut = ethers.parseUnits((formatAmountIn / ethPrice).toFixed(tokenTo.decimals).toString(), tokenTo.decimals)
            const percent = (amountOut * BigInt(slippage.nominator)) / BigInt(100 * slippage.denominator)
            const result = amountOut - percent
            return result
        }

        //Если обмениваем ETH
        if(tokenFrom.ticker === 'ETH') {
            const ethPrice = await getEthPrice()
            const usdAmount = amountIn * BigInt(ethPrice)
            const formatUSDAmount = BigInt(ethers.formatUnits(usdAmount, tokenFrom.decimals - tokenTo.decimals).split('.')[0])
            const percent = (formatUSDAmount * BigInt(slippage.nominator)) / BigInt(100 * slippage.denominator)
            const result = formatUSDAmount - percent
            console.log(result)
            return result
        }

        const percent = (amountIn /100n) * BigInt(slippage.nominator) / BigInt(slippage.denominator)
        const result = amountIn - percent
        return result
        // if(tokenFrom.decimals === tokenTo.decimals) return result
        // if(tokenFrom.decimals < tokenTo.decimals) return result * BigInt(10**(tokenTo.decimals - tokenFrom.decimals))
        // return result / BigInt(10**(tokenFrom.decimals - tokenTo.decimals))
    }
}