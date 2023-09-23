import * as fs from 'fs'
import { read } from '../utils/utils'
import { MyAccounts } from '../wallets/myAccounts'
import { Provider, constants } from 'starknet'
import * as querys from './querys'
import { logger } from '../logger/logger'
import path from 'path'
import { Idata } from '../interfaces/iData'

async function writeData() {

    let json: Idata = {}

    const privates = await read(path.resolve(__dirname, '..', 'privates.txt'))
    const ethPrivates = await read(path.resolve(__dirname, '..', 'ethPrivates.txt'))
    const okxAccounts = await read(path.resolve(__dirname, '..', 'okxAccount.txt'))

    const dataConfig: {ethAccount: boolean, okxAccount: boolean} = {
        ethAccount: true, //если false, то исключаем аккаунты
        okxAccount: true
    }
    
    if(ethPrivates.length !== privates.length) {
        console.log('')
        logger.info('Количество EVM аддресов должно быть равно количеству Starknet аддресов\n')
        const answer = await querys.yesNo('Заполнить данные без EVM аккаунтов ?')
        dataConfig.ethAccount = false
        if(!answer) return; 
    }

    if(okxAccounts.length !== privates.length) {
        console.log('')
        logger.info('Количество OKX аддресов должно быть равно количеству Starknet аддресов\n')
        const answer = await querys.yesNo('Заполнить данные без OKX аккаунтов ?')
        dataConfig.okxAccount = false
        if(!answer) return; 
    }
    
    const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } })
    logger.info('Создаем ...')
    for(let [i, privateKeyOrMnemonic] of privates.entries()) {
        const myAccounts = new MyAccounts(provider)
        const {account, privateKey} = await myAccounts.getAccount(privateKeyOrMnemonic)
        await myAccounts.checkDeploy(account, privateKey)

        json[account.address] = {
            ethAcoount: dataConfig.ethAccount? ethPrivates[i]: null,
            okxAccount: dataConfig.okxAccount? okxAccounts[i]: null
        }
    }

    const _path = path.resolve(__dirname, 'data.json')
    fs.writeFileSync(_path, JSON.stringify(json, null, 2))
    logger.success(`Файл с данными сохранен в ${_path}`)
    return json
}

export async function create_data(): Promise<Idata | undefined> {

    let json: Idata = {}

    try {
        const raw_json = fs.readFileSync(path.resolve(__dirname, 'data.json'), 'utf-8')
        json = JSON.parse(raw_json)

        const answer = await querys.select(['Экспортировать данные', 'Перезаписать данные', 'Продолжить'], 'Данные получены. Выберите')

        switch(answer) {
            case "Экспортировать данные":
                const filePath = await querys.input('Введите путь для экспорта данных. Оставьте пустым чтобы клонировать данные в текущую директорию')

                if(filePath === '') {
                    const fileName = await querys.input('Введите название файла') || "data"
                    const _path = path.resolve(__dirname, `${fileName}.json`)
                    fs.writeFileSync(_path, JSON.stringify(json, null, 2))
                    logger.success(`Файл экспортирован в ${path}`)
                    logger.success
                    return 
                } else {
                    const fileName = await querys.input('Введите название файла') || "data"
                    fs.writeFileSync(`${path.resolve(filePath+"\\"+fileName+'.json')}`, JSON.stringify(json, null, 2))
                }
                return await create_data()

            case "Перезаписать данные":
                return await writeData()

            case "Продолжить":
                return json
        }

    } catch(e: any) {
        if(e.code === 'ENOENT' && e.path.includes('data.json')) {
            console.log('Данных не найдено. Создаем ...')
            return await writeData()
        } else {
            throw e
        }
    }
}