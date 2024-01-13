import { Contract, EstimateFeeResponse, HttpError, uint256 } from 'starknet'
import { contractABI } from './contractABI';
import { ethers } from 'ethers';
import { denomNumber, makeDenominator } from '../../denominator';
import { l0_or_jediSWAP } from '../../dex';
import { getEthPrice } from '../oracles/oracle';
import axios from 'axios'
import { logger } from '../../logger/logger';
import { Token } from '../../tokens/tokens';
import { poolTokenABI } from './poolTokenABI';

export class Jediswap extends l0_or_jediSWAP {

    private contractAddress: string = "0x041fd22b238fa21cfcf5dd45a8548974d8263b3a531a60388411c5e230f97023"
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
            const receipt = await this.sendTransaction(contract, 'swap_exact_tokens_for_tokens', callData)
            const prettyAmountIn = ethers.formatUnits(amountIn, tokenFrom.decimals)
            const prettyAmountOut = ethers.formatUnits(amountOut, tokenTo.decimals)
            logger.success(`Выполнен свап tx: ${receipt} ${tokenFrom.ticker} ${prettyAmountIn} -> ${tokenTo.ticker} ${prettyAmountOut}`, this.account.address, this.taskName)
        } catch(e) {
            console.log([
                amountIn, 
                amountOut,
                path,
                to,
                deadline
            ], 'НА СВАПЕ')
            
            throw logger.error(`Не удалось выполнить свап ${tokenFrom.ticker} на ${tokenTo.ticker} ${e}`, this.account.address, this.taskName)
        }
    }

    async getExecutionFee(amountIn: bigint, tokenFrom: Token, tokenTo: Token, slippage: denomNumber): Promise<EstimateFeeResponse> {
        try {
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
            
            return await contract.estimate('swap_exact_tokens_for_tokens', callData)
        } catch(e: any) {
            if(e.message && e.message.includes('nonce')) {
                return await this.getExecutionFee(amountIn, tokenFrom, tokenTo, slippage)
            } else {
                throw e
            }
        }
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

    //Возвращает значение в модуль task для add_liquidity
    async getUsdtBalance_humanReadable() {
        const balance = await this.getBalanceOf(this.tokens.USDT)
        return Number(Number(ethers.formatUnits(balance, this.tokens.USDT.decimals)).toFixed(this.tokens.USDT.decimals))
    }

    async addLiquidity(number: number, slippage: number) {

        const denomSlippage = makeDenominator(slippage)

        const ratio = await this.getRatio()

        const amountA = BigInt(ethers.parseUnits(number.toString(), this.tokens.USDT.decimals).toString())
        const amountB = amountA * ratio / 1_000_000n

        const balanceA = await this.getBalanceOf(this.tokens.USDT)
        const balanceB = await this.getBalanceOf(this.tokens.USDC)

        const ethPrice = BigInt(await getEthPrice())
        const ethBalance = await this.getBalanceOf(this.tokens.ETH)

        //Проверка USDT
        if(balanceA < amountA) {
            const needReceievA = (amountA - balanceA) * 105n / 100n
            const availabeUSDC = balanceB - amountB

            if(availabeUSDC > needReceievA) {
                await this.swap(needReceievA, this.tokens.USDC, this.tokens.USDT, denomSlippage)
            } else {
                
                //decimals 6
                const needToSwapEth = needReceievA / ethPrice
                
                if(BigInt(ethers.formatUnits(ethBalance, 12).split('.')[0]) < needToSwapEth) {
                    throw logger.error(`Недостаточно средств для обмена`, this.account.address, this.taskName)
                } else {
                    const formatNeedToSwapEth = ethers.parseUnits(needToSwapEth.toString(), 12)
                    await this.swap(formatNeedToSwapEth, this.tokens.ETH, this.tokens.USDT, denomSlippage)
                }
            }
        }

        //Проверка USDC
        if(balanceB < amountB) {
            console.log('тут')
            const needReceievB = (amountB - balanceB) * 105n / 100n
            const availabeUSDT = balanceA - amountA

            if(availabeUSDT > needReceievB) {
                await this.swap(needReceievB, this.tokens.USDT, this.tokens.USDC, denomSlippage)
            } else {
                
                //decimals 6
                const needToSwapEth = needReceievB / ethPrice
                
                if(BigInt(ethers.formatUnits(ethBalance, 12).split('.')[0]) < needToSwapEth) {
                    throw logger.error(`Недостаточно средств для обмена`, this.account.address, this.taskName)
                } else {
                    const formatNeedToSwapEth = ethers.parseUnits(needToSwapEth.toString(), 12)
                    await this.swap(formatNeedToSwapEth, this.tokens.ETH, this.tokens.USDC, denomSlippage)
                }
            }
        }

        const deadline = String(Math.round(Date.now() / 1000 + 3600));

        const allowanceUSDT = await this.getAllowance(this.tokens.USDT, this.contractAddress)
        if(allowanceUSDT < amountA) {
            await this.approve(this.tokens.USDT, uint256.bnToUint256(amountA), this.contractAddress)
        }

        const allowanceUSDC = await this.getAllowance(this.tokens.USDC, this.contractAddress)
        if(allowanceUSDC < amountB) {
            await this.approve(this.tokens.USDC, uint256.bnToUint256(amountB), this.contractAddress)
        }

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

        try {
            const receipt = await this.sendTransaction(contract, "add_liquidity", callData)
            logger.success(`Залили ликвидность в JediSwap ${receipt}`, this.account.address, this.taskName)
        } catch(e) {
            console.log([
                this.tokens.USDT.contractAddress,
                this.tokens.USDC.contractAddress,
                amountA,
                amountB,
                amountA * 98n/1000n,
                amountB * 98n/1000n,
                this.account.address,
                deadline
            ])
            
            logger.error(`Не удалось залить ликвидность в Jediswap ${e}`, this.account.address, this.taskName)

            if(e instanceof HttpError) {
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

    async withdrawFromPool() {

        const poolTokenContract = new Contract(poolTokenABI, '0x05801bdad32f343035fb242e98d1e9371ae85bc1543962fedea16c59b35bd19b', this.account)
        const lpTokenBalance: any = (await poolTokenContract.call('balanceOf', [this.account.address]))
        const lpTokenBalanceOf: any = (await poolTokenContract.call('totalSupply'))

        const myShares = BigInt(lpTokenBalanceOf.totalSupply.low) / BigInt(lpTokenBalance.balance.low)
        
        const firstToken = this.tokens.USDC
        const secondToken = this.tokens.USDT

        const reserves: any = await poolTokenContract.call('get_reserves')

        const firstTokenReserves = BigInt(reserves.reserve0.low)
        const secondTokenReserves = BigInt(reserves.reserve1.low)

        //отняли 5 процентов 
        const firstTokenAmount = firstTokenReserves / myShares * 95n/100n
        const secondTokenAmount = secondTokenReserves / myShares * 95n/100n

        await this.approve(this.tokens.jediswap_USDC_USDC_shares, uint256.bnToUint256(BigInt(lpTokenBalance.balance.low)), this.contractAddress)

        const contract = new Contract(this.ABI, this.contractAddress, this.account)
        const deadline = String(Math.round(Date.now() / 1000 + 3600));

        const callData = [
            firstToken.contractAddress,
            secondToken.contractAddress,
            uint256.bnToUint256(BigInt(lpTokenBalance.balance.low)),
            uint256.bnToUint256(firstTokenAmount),
            uint256.bnToUint256(secondTokenAmount),
            this.account.address,
            deadline,
        ]

        try {
            const txReceipt = await this.sendTransaction(contract, 'remove_liquidity', callData)
            const txResponse = await this.waitForTransaction(txReceipt)

            logger.success(`Забрали ликвидность tx: ${txResponse}`, this.account.address, this.taskName)
        } catch(e) {
            throw logger.error(`Не удалось достать ликвидность ${e}`, this.account.address, this.taskName)
        }
        
    }
}