import { Account, CallData, Contract, Provider, ProviderInterface, provider, uint256 } from 'starknet'
import { contractABI } from './contractABI';
import { BigNumberish } from 'starknet';
import { BigNumber, ethers } from 'ethers';
import { denomNumber, makeDenominator } from '../../denominator';
import { Dex, l0_or_jediSWAP } from '../dex';
import { getEthPrice } from '../oracles/oracle';
import axios, { all } from 'axios'
import { logger } from '../../../logger/logger';
import { Token } from '../../tokens/tokens';

export class Jediswap extends l0_or_jediSWAP {

    private contractAddress: string = "0x041fd22b238fa21cfcf5dd45a8548974d8263b3a531a60388411c5e230f97023"
    private ABI: any[] = contractABI
    private taskName = 'jediSwap'

    async swap(amountIn: bigint, tokenFrom: Token, tokenTo: Token, slippage: denomNumber) {
        const allowance = await this.getAllowance(this.account, tokenFrom, this.contractAddress)
        
        if(amountIn > allowance) {
            await this.approve(this.account, tokenFrom, uint256.bnToUint256(amountIn), this.contractAddress, this.taskName)
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
        const receipt = await contract.invoke("swap_exact_tokens_for_tokens", callData)  


        if(await this.waitForTransaction(receipt.transaction_hash)) {
            logger.success(`Выполнен свап ${receipt.transaction_hash}`, this.account.address, this.taskName)
        } else {
            logger.error(`Не удалось выполнить свап ${receipt.transaction_hash}`, this.account.address, this.taskName)
        }
    }

    async getExecutionFee(amountIn: bigint, tokenFrom: Token, tokenTo: Token, slippage: denomNumber) {
        const allowance = await this.getAllowance(this.account, tokenFrom, this.contractAddress)
        
        if(amountIn > allowance) {
            await this.approve(this.account, tokenFrom, uint256.bnToUint256(amountIn), this.contractAddress, this.taskName)
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
        
        return await contract.estimate('swap_exact_tokens_for_tokens', callData)
    }

    private async getRatio() {
        const response = await axios.post(
            'https://alpha-mainnet.starknet.io/feeder_gateway/call_contract',
            {
                'signature': [],
                'contract_address': '0x477dde12a2737a67d2c3c6820a48ae5ed2cf7257c8c44a61e39d1c118e6f468',
                'entry_point_selector': '0x23ce8154ba7968a9d040577a2140e30474cee3aad4ba52d26bc483e648643f4',
                'calldata': [
                    '3',
                    '2487912913868014004131904966926849406549842942812205187711794077420293443995',
                    '1715705677754146725544391220708589383422824993050994982749243481839397737234',
                    '0'
                ]
            },
            {
                params: {
                'blockNumber': 'pending'
                },
                headers: {
                'authority': 'alpha-mainnet.starknet.io',
                'accept': '*/*',
                'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                'cache-control': 'no-cache',
                'content-type': 'application/json',
                'origin': 'https://app.jediswap.xyz',
                'pragma': 'no-cache',
                'referer': 'https://app.jediswap.xyz/',
                'sec-ch-ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
                }
            }
        )

        const res = BigInt(response.data.result[2]) * 1_000_000n / BigInt(response.data.result[4])
        return res
    }

    private async checkAddLiquidity(depositValue: number, slippage: denomNumber) {
        //Проверки на наличие достоточного количество USDT USDC
        const usdtBalance = await this.getBalanceOf(this.account, this.tokens.USDT)
        const usdcBalance = await this.getBalanceOf(this.account, this.tokens.USDC)
        
        const ethBalance = await this.getBalanceOf(this.account, this.tokens.ETH)
        const ethPrice = BigInt(await getEthPrice())
        
        const ethUSDBalance = ethBalance * ethPrice
        const formatethUSDBalance = BigInt(Math.floor(parseInt(ethers.utils.formatUnits(ethUSDBalance, 12))))
        const formatDepositValue = BigInt(ethers.utils.parseUnits(depositValue.toString(), 6).toString())

        if(usdtBalance < formatDepositValue) {

            const needToSwapUSD = formatDepositValue - usdtBalance
            
            if(usdcBalance > formatDepositValue) {
                // const needToSwap = usdcBalance - formatDepositValue
                await this.swap(needToSwapUSD, this.tokens.USDC, this.tokens.USDT, slippage)
                return
            }

            if(formatethUSDBalance > formatDepositValue) {
                // const needToSwapUSD = formatethUSDBalance - formatDepositValue
                const needToSwapEth = needToSwapUSD / ethPrice
                const formatNeedToSwapEth = ethers.utils.parseEther(needToSwapEth.toString()).toBigInt()
                await this.swap(formatNeedToSwapEth, this.tokens.ETH, this.tokens.USDT, slippage)
                return
            }

            return
        }

        if(usdcBalance < formatDepositValue) {

            const needToSwapUSD = formatDepositValue - usdcBalance
            
            if(usdtBalance > formatDepositValue) {
                await this.swap(needToSwapUSD, this.tokens.USDT, this.tokens.USDC, slippage)
                return
            }

            if(formatethUSDBalance > formatDepositValue) {
                const needToSwapEth = needToSwapUSD / ethPrice
                const formatNeedToSwapEth = ethers.utils.parseEther(needToSwapEth.toString()).toBigInt()
                await this.swap(formatNeedToSwapEth, this.tokens.ETH, this.tokens.USDC, slippage)
                return
            }

            return
        }
    }

    async addLiquidity(number: number, slippage: number) {
         
        await this.checkAddLiquidity(number, makeDenominator(slippage))

        const ratio = await this.getRatio()

        console.log(`DEV: 1 USDT === ${ethers.utils.formatUnits(ratio, 6)} USDC`)

        const amountA = BigInt(ethers.utils.parseUnits(number.toString(), this.tokens.USDT.decimals).toString())
        const amountB = amountA * ratio / 1_000_000n
        const deadline = String(Math.round(Date.now() / 1000 + 3600));

        const callData = [
            this.tokens.USDT.contractAddress,
            this.tokens.USDC.contractAddress,
            uint256.bnToUint256(amountA),
            uint256.bnToUint256(amountB),
            uint256.bnToUint256(amountA * 995n/1000n),
            uint256.bnToUint256(amountB * 995n/1000n),
            this.account.address,
            deadline
        ]

        const contract = new Contract(this.ABI, this.contractAddress, this.account)
        const receipt = await contract.invoke("add_liquidity", callData)  
        
        if(await this.waitForTransaction(receipt.transaction_hash)) {
            logger.success(`Залили ликвидность в JediSwap ${receipt.transaction_hash}`, this.account.address, this.taskName)
        } else {
            logger.error(`Не удалось залить ликвидность в Jediswap ${receipt.transaction_hash}`, this.account.address, this.taskName)
        }
    }
}