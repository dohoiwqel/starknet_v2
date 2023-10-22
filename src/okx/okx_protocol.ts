import axios from "axios"
import crypto from 'crypto'
import { Protocol } from "../protocol"
import { Account, Contract, uint256 } from "starknet"
import { logger } from "../logger/logger"
import { Jediswap } from "../dex/jediswap/jediswap"
import { makeDenominator } from "../denominator"
import { config } from "../../cfg"
import { ethers } from "ethers"
import { sleep } from "../utils/utils"

export class OKX extends Protocol {
    
    public headers: any = {}
    public rest: string
    
    constructor(
        public account: Account,
        public apiKey: string,
        public passPhrase: string,
        public secretKey: string
        
    ) {
        super(account, 'okx_deposit')
        this.headers['Content-Type'] = 'application/json'
        this.headers['OK-ACCESS-KEY'] = this.apiKey
        this.headers['OK-ACCESS-PASSPHRASE'] = this.passPhrase
        this.rest = 'https://www.okx.com'
    }

    private async convertAllTokensToEth(): Promise<any> {
        const {token, balance} = await this.finder.getHighestBalanceToken()

        if(token.ticker === 'ETH') {
            return
        } else {
            const jediSwap = new Jediswap(this.account, this.taskName)
            const slippage = makeDenominator(config.slippage)
            await jediSwap.swap(balance, token, this.tokens.ETH, slippage)
            await sleep(15, 15)
            return await this.convertAllTokensToEth()
        }
    }

    async deposit(subAccountAddress: string) {
        await this.convertAllTokensToEth()
        const {eToken, eBalance} = await this.finder.getEth()
        const contract = new Contract(eToken.ABI, eToken.contractAddress, this.account)

        let callData = [
            subAccountAddress,
            uint256.bnToUint256(eBalance)
        ]

        const fee = await this.estimateFee(contract, 'transfer', callData)

        callData = [
            subAccountAddress,
            uint256.bnToUint256(eBalance - fee * 2n)
        ]

        logger.info('Выполняем депозит', this.account.address, this.taskName)

        try {
            const tx = await this.sendTransaction(contract, 'transfer', callData)
            logger.success(`Выполнен депозит ${tx.transaction_hash}`, this.account.address, this.taskName)
        } catch(e) {
            throw logger.error(`Не удалось выполнить депозит на okx ${e}`)
        }
    }
}