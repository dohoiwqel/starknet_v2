import { Account, ArgsOrCalldata, Contract, GetTransactionReceiptResponse, HttpError, TransactionStatus, uint256 } from "starknet";
import { logger } from "./logger/logger";
import { getProvider, sleep } from "./utils/utils";
import { PoolToken, Token, Tokens } from "./tokens/tokens";
import { Finder } from "./finder";
import { getEthPrice } from "./oracles/oracle";


export class Protocol {

    public taskName: string
    protected account: Account
    protected tokens: Tokens
    protected finder: Finder

    constructor(account: Account, taskName: string) {
        this.account = account
        this.taskName = taskName
        this.tokens = new Tokens()
        this.finder = new Finder(this.account)
        
    }

    protected async waitForTransaction(tx: string): Promise<GetTransactionReceiptResponse> {
        try {
            const provider = getProvider()
            const response = await provider.waitForTransaction(tx, {retryInterval: 10000, successStates: [TransactionStatus.ACCEPTED_ON_L2]})

            if(response.status === 'ACCEPTED_ON_L2') {
                return response
            
            } else if(response.status === 'REJECTED') {
                throw new Error(`Не удалось послать транзакцию ${response.transaction_hash}`);

            } else {
                await sleep(2, 2)
                return await this.waitForTransaction(tx)
            }
        } catch(e: any) {
            if(e.message && e.message.includes('Не удалось послать транзакцию')) {
                throw logger.error(e.message)
            } else {
                return await this.waitForTransaction(tx)
            }
        }
    }

    protected async getEthPrice() {
        return await getEthPrice()
    }

    protected async sendTransaction(contract: Contract, functionName: string, callData: ArgsOrCalldata | undefined): Promise<GetTransactionReceiptResponse> {
        try {
            const nonce = await this.account.getNonce()
            const receipt = await contract.invoke(functionName, callData, {nonce: nonce})
            return await this.waitForTransaction(receipt.transaction_hash)

        } catch(e: any) {
            if(e.message && e.message.includes('nonce')) {
                return await this.sendTransaction(contract, functionName, callData)
            }

            throw e
        }
    }

    protected async getBalanceOf(token: Token): Promise<bigint> {
        const contractAddress = token.contractAddress
        const ABI = token.ABI
        const contract = new Contract(ABI, contractAddress, this.account)        
        const balance = await contract.balanceOf(this.account.address)
        return balance.balance.low
    }

    protected async getAllowance(token: Token, spender: string): Promise<bigint> {
        const contract = new Contract(token.ABI, token.contractAddress, this.account)        
        const allowance = await contract.allowance(this.account.address, spender)
        return uint256.uint256ToBN(allowance.remaining)
    }

    protected async approve(token: Token | PoolToken, amount: uint256.Uint256, spender: string): Promise<void> {
        
        logger.info(`Выполняем аппрув ${token.ticker}`, this.account.address, this.taskName)

        const contractAddress = token.contractAddress
        const ABI = token.ABI
        const contract = new Contract(ABI, contractAddress, this.account)        

        const callData = [
            spender,
            amount
        ]

        try {
            const receipt = await this.sendTransaction(contract, "approve", callData)
            logger.success(`Выполнен аппрув tx: ${receipt.transaction_hash}`, this.account.address, this.taskName)
        } catch(e) {
            if(e instanceof HttpError) {
                await sleep(5, 10)
                return await this.approve(token, amount, spender)
            }

            throw logger.error(`Не удалось выполнить аппрув ${e}`, this.account.address, this.taskName)
        }
    }

    protected async estimateFee(contract: Contract, method: string, callData: Array<any>): Promise<bigint> {
        try {
            const feeResponse = await contract.estimate(method, callData)
            return feeResponse.overall_fee
        } catch(e: any) {
            if(e.message && e.message.includes('nonce')) {
                return await this.estimateFee(contract, method, callData)
            } else {
                throw e
            }
        }
    }

    protected async simpleCall(contract: Contract, method: any, args: any[]): Promise<any> {
        try {
            const result = await contract.method(...args)
            return result
        } catch(e: any) {
            console.log(e)
            return this.simpleCall(contract, method, args)
        } 
    }

}