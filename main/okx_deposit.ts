import path from 'path'
import { read } from '../utils/utils'
import { logger } from '../logger/logger'
import { MyAccounts } from '../src/wallets/myAccounts'
import { Provider, constants } from 'starknet'
import { refuelEth } from '../utils/refuel'
import { config } from '../cfg'
import { task_okx_deposit } from '../src/tasks'

async function main() {
    const privates = await read(path.resolve(__dirname, '..', 'privates.txt'))
    const okxAddresses = await read(path.resolve(__dirname, '..', 'okxAccount.txt'))
    
    for(let [i, privateKeyOrMnemonic] of privates.entries()) {

        const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } })

        const myAccounts = new MyAccounts(provider)
        const {account, privateKey} = await myAccounts.getAccount(privateKeyOrMnemonic)
        await myAccounts.checkDeploy(account, privateKey)

        //Проверяем количество eth на аккаунте
        await refuelEth(account, config.refuel_threshold, config.slippage)

        if(privates.length !== okxAddresses.length) {
            throw logger.error('Количество кошельков Starknet должно быть равно количеству субаккаунтов OKX')
        }
    
        const okx_subAcc = okxAddresses[i]
    
        if(!okx_subAcc) {
            logger.error('Заполните OKX аддресса')
            return
        }
    
        config.okx_deposit_address = okx_subAcc
        await task_okx_deposit(account, config)
    }
}

main()