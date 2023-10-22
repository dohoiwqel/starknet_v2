import { Contract, EstimateFeeResponse, HttpError, uint256 } from 'starknet'
import { contractABI } from './contractABI';
import { ethers } from 'ethers';
import { denomNumber, makeDenominator } from '../../denominator';
import { Dex } from '../../dex';
import axios from 'axios'
import { logger } from '../../logger/logger';
import { Token } from '../../tokens/tokens';

export class Myswap extends Dex {
    
    private contractAddress: string = "0x010884171baf1914edc28d7afb619b40a4051cfae78a094a55d230f19e944a28"
    private ABI: any[] = contractABI

    private getPoolId(tokenFrom: Token, tokenTo: Token) {
        if(tokenFrom.ticker === "ETH") {
            if(tokenTo.ticker === "USDT") return "4";
            if(tokenTo.ticker === "USDC") return "1";
        }

        if(tokenFrom.ticker === "USDT") {
            if(tokenTo.ticker === "ETH") return "4";
            if(tokenTo.ticker === "USDC") return "5";
        }

        //Доделать
        if(tokenFrom.ticker === "USDC") {
            if(tokenTo.ticker === "ETH") return "1";
            if(tokenTo.ticker === "USDT") return "5";
        }

        return "0"
    }

    private async requestData() {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=ethereum,dai,usd-coin,tether,wrapped-steth,bitcoin,lords', {
            headers: {
                'authority': 'api.coingecko.com',
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                'origin': 'https://www.myswap.xyz',
                'referer': 'https://www.myswap.xyz/',
                'sec-ch-ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
            }
        })
        
        const data = response.data
        return data
    }

    private convertToken(token: Token) {
        if(token.ticker === "ETH") return "ethereum";
        if(token.ticker === "USDT") return "tether";
        if(token.ticker === "USDC") return "usd-coin";
    }

    private async getRatio(tokenFrom: Token, tokenTo: Token) {
        const data = await this.requestData()
        const convTokenFrom = this.convertToken(tokenFrom)
        const convTokenTo = this.convertToken(tokenTo)
        
        const ratio = data[convTokenFrom!].usd / data[convTokenTo!].usd
        return makeDenominator(Number(ratio.toFixed(6)), 10**6)
    }

    async calculateMinAmountIn(amountIn: bigint, tokenFrom: Token, tokenTo: Token, slippage: denomNumber) {

        if(tokenFrom.ticker === 'ETH') {
            const data = await this.requestData()
            
            const ethPrice = BigInt(Math.round(data['ethereum'].usd))
            const tokenPrice = BigInt(Math.round(data[this.convertToken(tokenTo)!].usd))

            const usdValue = amountIn * ethPrice / tokenPrice
            
            const minAmountIn = BigInt(ethers.formatUnits(usdValue, tokenFrom.decimals - tokenTo.decimals).split('.')[0])
            const percent = (minAmountIn * BigInt(slippage.nominator)) / BigInt(100 * slippage.denominator)
            const result = minAmountIn - percent
            return result
        }

        const percent = (amountIn * BigInt(slippage.nominator)) / BigInt(100 * slippage.denominator)
        const result = amountIn - percent
        return result
    }

    async swap(amountIn: bigint, tokenFrom: Token, tokenTo: Token, slippage: denomNumber) {
        const allowance = await this.getAllowance(tokenFrom, this.contractAddress)

        if(amountIn > allowance) {
            await this.approve(tokenFrom, uint256.bnToUint256(amountIn), this.contractAddress)
        }

        const poolId = this.getPoolId(tokenFrom, tokenTo)
        const ratio = await this.getRatio(tokenFrom, tokenTo)

        let minAmountIn = amountIn * BigInt(ratio.nominator) / BigInt(ratio.denominator)
        minAmountIn = await this.calculateMinAmountIn(amountIn, tokenFrom, tokenTo, slippage)

        const callData = [
            poolId, 
            tokenFrom.contractAddress,
            uint256.bnToUint256(amountIn),
            uint256.bnToUint256(minAmountIn),
        ]

        const contract = new Contract(this.ABI, this.contractAddress, this.account) 

        try {
            const receipt = await this.sendTransaction(contract, "swap", callData)
            const prettyAmountIn = ethers.formatUnits(amountIn, tokenFrom.decimals)
            const prettyAmountOut = ethers.formatUnits(minAmountIn, tokenTo.decimals)
            logger.success(`Выполнен свап tx: ${receipt.transaction_hash} ${tokenFrom.ticker} ${prettyAmountIn} -> ${tokenTo.ticker} ${prettyAmountOut}`, this.account.address, this.taskName)
        } catch(e) {
            console.log([
                poolId, 
                tokenFrom.contractAddress,
                amountIn,
                minAmountIn,
            ])

            logger.error(`Не удалось выполнить свап ${tokenFrom.ticker} на ${tokenTo.ticker} ${e}`, this.account.address, this.taskName)

            if(e instanceof HttpError) {
                throw e
            }
        }
    }

    async getExecutionFee(amountIn: bigint, tokenFrom: Token, tokenTo: Token, slippage: denomNumber): Promise<EstimateFeeResponse> {
        try {
            const allowance = await this.getAllowance(tokenFrom, this.contractAddress)
        
            if(amountIn > allowance) {
                await this.approve(tokenFrom, uint256.bnToUint256(amountIn), this.contractAddress)
            }
    
            const poolId = this.getPoolId(tokenFrom, tokenTo)
            const ratio = await this.getRatio(tokenFrom, tokenTo)
    
            let minAmountOut = amountIn * BigInt(ratio.nominator) / BigInt(ratio.denominator)
            minAmountOut = await this.calculateMinAmountIn(amountIn, tokenFrom, tokenTo, slippage)
    
            const callData = [
                poolId, 
                tokenFrom.contractAddress,
                uint256.bnToUint256(amountIn),
                uint256.bnToUint256(minAmountOut),
            ]
    
            const contract = new Contract(this.ABI, this.contractAddress, this.account) 
            return await contract.estimate('swap', callData)
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