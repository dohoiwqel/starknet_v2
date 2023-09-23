import { config } from "../cfg"
import { logger } from "../logger/logger"
import { MyAccounts } from "../wallets/myAccounts"

async function main() {
    logger.info(`Создаем ${config.batch_create_number} аккаунтов старкнет`)
    const myAccounts = new MyAccounts()
    myAccounts.batchCreate(config.batch_create_number)
    return
}

main()