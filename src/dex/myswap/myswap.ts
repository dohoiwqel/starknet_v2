import { Account, CallData, Contract, EstimateFeeResponse, Provider, ProviderInterface, provider, uint256 } from 'starknet'
import { contractABI } from './contractABI';
import { BigNumberish } from 'starknet';
import { BigNumber, ethers } from 'ethers';
import { denomNumber, makeDenominator } from '../../denominator';
import { Dex } from '../dex';
import axios from 'axios'
import { logger } from '../../../logger/logger';
import { Token } from '../../tokens/tokens';

export class Myswap extends Dex {
    
    private contractAddress: string = "0x010884171baf1914edc28d7afb619b40a4051cfae78a094a55d230f19e944a28"
    private ABI: any[] = contractABI
    private taskName = 'MySwap'

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
            
            const minAmountIn = BigInt(ethers.utils.formatUnits(usdValue, tokenFrom.decimals - tokenTo.decimals).split('.')[0])
            const percent = (minAmountIn * BigInt(slippage.nominator)) / BigInt(100 * slippage.denominator)
            const result = minAmountIn - percent
            return result
        }

        const percent = (amountIn * BigInt(slippage.nominator)) / BigInt(100 * slippage.denominator)
        const result = amountIn - percent
        return result
    }

    async swap(amountIn: bigint, tokenFrom: Token, tokenTo: Token, slippage: denomNumber) {
        const allowance = await this.getAllowance(this.account, tokenFrom, this.contractAddress)

        if(amountIn > allowance) {
            await this.approve(this.account, tokenFrom, uint256.bnToUint256(amountIn), this.contractAddress, this.taskName)
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
        const receipt = await contract.invoke("swap", callData)  

        if(await this.waitForTransaction(receipt.transaction_hash)){
            logger.success(`Выполнен свап ${receipt.transaction_hash}`, this.account.address, this.taskName)
        } else {
            logger.error(`Не удалось выполнить свап на Myswap ${receipt.transaction_hash}`, this.account.address, this.taskName)
        }
    }

    async getExecutionFee(amountIn: bigint, tokenFrom: Token, tokenTo: Token, slippage: denomNumber) {
        const allowance = await this.getAllowance(this.account, tokenFrom, this.contractAddress)
        
        if(amountIn > allowance) {
            await this.approve(this.account, tokenFrom, uint256.bnToUint256(amountIn), this.contractAddress, this.taskName)
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

        console.log([
            poolId, 
            tokenFrom.contractAddress,
            ethers.utils.formatEther(amountIn.toString()),
            ethers.utils.formatUnits(minAmountOut.toString(), 6),
        ])

        const contract = new Contract(this.ABI, this.contractAddress, this.account) 
        return await contract.estimate('swap', callData)
    }
}