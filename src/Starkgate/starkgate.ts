import { TransactionResponse, ethers } from "ethers";
import { ABI } from './contractABI'
import { logger } from "../logger/logger";
import axios from 'axios'

export class Starkgate {

    private account: ethers.Wallet | undefined
    private taskName = 'Starkgate'
    private contractAddress = '0xae0Ee0A63A2cE6BaeEFFE56e7714FB4EFE48D419'
    
    constructor(account?: ethers.Wallet) {
        this.account = account
    }

    async getStarknetFee() {
        const response = await axios.post(
            'https://alpha-mainnet.starknet.io/feeder_gateway/estimate_message_fee',
            {
              'from_address': '993696174272377493693496825928908586134624850969',
              'to_address': '0x073314940630fd6dcda0d772d4c972c4e0a9946bef9dabf4ef84eda8ef542b82',
              'entry_point_selector': '0x2d757788a8d8d6f21d1cd40bce38a8222d70654214e96ff95d8086e684fbee5',
              'payload': [
                '0x2b67ff13da70253211ee9e69b1dd4800abed32c991cb3eb63dac18168d2f4db',
                '0x38d7ea4c68000',
                '0x0'
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
                'origin': 'https://starkgate.starknet.io',
                'pragma': 'no-cache',
                'referer': 'https://starkgate.starknet.io/',
                'sec-ch-ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
              }
            }
        )
        return BigInt(response.data.overall_fee)
    }

    async bridge(l2Address: string, value: string, amount: string, gasPrice: bigint) {
        const contract = new ethers.Contract(this.contractAddress, ABI, this.account)
        const tx: TransactionResponse = await contract.deposit(amount, l2Address, {
            value: value,
            gasPrice: gasPrice,
            gasLimit: 125_000n
        })

        logger.success(`Выполнен бридж. l1 tx: ${tx.hash}`, this.account!.address, this.taskName)
    }
}