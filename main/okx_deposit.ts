import path from 'path'
import { read, resultIndicator, sleep } from '../src/utils/utils'
import { logger } from '../src/logger/logger'
import { MyAccounts } from '../src/wallets/myAccounts'
import { refuelEth } from '../src/refuel'
import { config } from '../cfg'
import { task_okx_deposit } from '../src/tasks'
import { screensaver } from './screensaver'

async function main() {

    screensaver()

    const privates = await read(path.resolve(__dirname, '..', 'privates.txt'))
    const okxAddresses = await read(path.resolve(__dirname, '..', 'okxAccount.txt'))
    
    let counter = 1

    for(let [i, privateKeyOrMnemonic] of privates.entries()) {

        try {
            const myAccounts = new MyAccounts()
            const {account, privateKey} = await myAccounts.getAccount(privateKeyOrMnemonic)
            await myAccounts.checkDeploy(account, privateKey)
    
            //Проверяем количество eth на аккаунте
            await refuelEth(account, config.refuel_threshold, config.slippage)
    
            if(privates.length !== okxAddresses.length) {
                throw logger.error('Количество кошельков Starknet должно быть равно количеству субаккаунтов OKX')
            }
        
            const okx_subAcc = okxAddresses[i]
            
            if(!okx_subAcc.startsWith('0x')) {
                logger.error(`Введен неправильный адрес суб-аккаунта ${okx_subAcc}`)
                return
            }
        
            if(!okx_subAcc) {
                logger.error('Заполните OKX адреса')
                return
            }
        
            config.okx_deposit_address = okx_subAcc
            await task_okx_deposit(account, config)

            resultIndicator(counter, privates.length)
            counter++

        } catch(e: any) {
            if(e) {
                console.log(e)
            }

            resultIndicator(counter, privates.length)
            counter++
        }

        await sleep(config.okx_sleep_min, config.okx_sleep_max)

    }
}

main()