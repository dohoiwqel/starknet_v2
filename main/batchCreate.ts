import { logger } from "../src/logger/logger"
import { input } from "../src/utils/querys";
import { MyAccounts } from "../src/wallets/myAccounts"
import { screensaver } from "./screensaver";

async function main() {

    screensaver()

    let answer = await input('Введите количество кошельков')
    let wallet_number = 0

    try {
        wallet_number = parseInt(answer!)
    } catch(e) {
        logger.error(`Не удалось создать кошельки. Введенное число ${wallet_number}`)
        return
    }

    if(Number.isNaN(wallet_number)) {
        logger.error(`Введенно неверное количество кошельков ${answer}`)
        return
    }

    logger.info(`Создаем ${answer} аккаунтов старкнет`)

    const myAccounts = new MyAccounts()
    myAccounts.batchCreate(wallet_number)
    return
}

main()