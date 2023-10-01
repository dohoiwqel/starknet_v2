import axios from 'axios';
import crypto from 'crypto';
import { config } from '../cfg';
import { logger } from '../logger/logger';
import { getRandomFloat, read, sleep } from '../utils/utils';
import path from 'path'
import { MyAccounts } from '../src/wallets/myAccounts';
import { Provider, constants } from 'starknet';
import { screensaver } from './screensaver';

class OKX {
    public headers: any = {}
    public rest: string
    constructor(
        public apiKey: string,
        public passPhrase: string,
        public secretKey: string
        
    ) {
        this.headers['Content-Type'] = 'application/json'
        this.headers['OK-ACCESS-KEY'] = this.apiKey
        this.headers['OK-ACCESS-PASSPHRASE'] = this.passPhrase
        this.rest = 'https://www.okx.com'
    }

    private generateHmacSha256Signature(data: string, key: string): string {
        const hmac = crypto.createHmac('sha256', key);
        hmac.update(data);
        return hmac.digest('base64');
    }

    async awaitWithdrawl(wdId: string): Promise<string> {
        return await new Promise(resolve => {
            const interval = setInterval(async() => {
                const timestamp = new Date().toISOString()
                const path = `/api/v5/asset/deposit-withdraw-status?wdId=${wdId}`
                const response = await axios.get(this.rest + path, {
                    headers: {
                        ...this.headers,
                        'OK-ACCESS-TIMESTAMP': timestamp,
                        'OK-ACCESS-SIGN': this.generateHmacSha256Signature(timestamp+'GET'+path, this.secretKey),
                    },
                })
                console.log(response.data.data[0].state)
                if(response.data.data[0].state === 'Withdrawal complete') {
                    clearInterval(interval)
                    resolve(response.data.data[0].txId)
                }
            }, 10_000)
        })
    }

    private async getWithdrawlFee(): Promise<string> {
        const timestamp = new Date().toISOString()
        const path = '/api/v5/asset/currencies?ccy=ETH'
        const response = await axios.get(this.rest + path, {
            headers: {
                ...this.headers,
                'OK-ACCESS-TIMESTAMP': timestamp,
                'OK-ACCESS-SIGN': this.generateHmacSha256Signature(timestamp+'GET'+path, this.secretKey),
            },
        })
        return response.data.data.filter((data: { chain: string; }) => data.chain === 'ETH-Starknet')[0]['maxFee']
    }
    
    async withdrawal(address: string, amount: string) {
        const withdrawlFee = await this.getWithdrawlFee()        
        const timestamp = new Date().toISOString()
        const path = '/api/v5/asset/withdrawal'

        const body = {
            "amt":amount,
            "fee":withdrawlFee,
            "dest":"4",
            "ccy":"ETH",
            "chain":"ETH-Starknet",
            "toAddr":address,
        }

        const response = await axios.post(this.rest + path, 
            body,
            {
                headers: {
                    ...this.headers,
                    'OK-ACCESS-TIMESTAMP': timestamp,
                    'OK-ACCESS-SIGN': this.generateHmacSha256Signature(timestamp+'POST'+path+JSON.stringify(body), this.secretKey),
                }, 
            }
        )
        if(response.data.msg) throw `Произошла ошибка при выводе средств на аккаунт ${address} ${response.data.msg}`
        return response.data.data[0].wdId
    }
}

async function main() {

    screensaver()
    
    const privates = await read(path.resolve(__dirname, '..', 'privates.txt'))
    const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } })

    const okx = new OKX(config.okx_apiKey, config.okx_passPhrase, config.okx_secretKey)

    try {
        for(let privateKeyOrMnemonic of privates) {
            const myAccounts = new MyAccounts(provider)
            const {account, privateKey} = await myAccounts.getAccount(privateKeyOrMnemonic)
            const starkAddress = account.address
            const wdId = await okx.withdrawal(starkAddress, getRandomFloat(config.okx_withdraw_amount[0], config.okx_withdraw_amount[1]).toString())
            logger.success(`Средства отправлены`, starkAddress)
            await sleep(config.okx_sleep_min, config.okx_sleep_max)
        }
    } catch(e: any) {
        if(e.response && e.response.data) {
            logger.error(JSON.stringify(e.response.data))
            return
        }

        console.log(e)
    }

}

main()