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
        const contract = new Contract(ABI, contractAddress)        
        contract.connect(account)
        const res = await contract.approve(spender, amount)
        if(await this.waitForTransaction(res.transaction_hash)){
            logger.success(`Выполнен аппрув ${res.transaction_hash}`, account.address, task_name)
        } else {
            logger.error(`Не удалось выполнить аппрув ${res.transaction_hash}`, account.address)
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

        const percent = (amountIn * BigInt(slippage.nominator)) / BigInt(100 * slippage.denominator)
        const result = amountIn - percent

        if(tokenFrom.decimals === tokenTo.decimals) return result
        if(tokenFrom.decimals < tokenTo.decimals) return result * BigInt(10**(tokenTo.decimals - tokenFrom.decimals))
        return result / BigInt(10**(tokenFrom.decimals - tokenTo.decimals))
    }
}