import { Iconfig } from "./interfaces/iconfig";

export const config: Iconfig = {

    //OKX
    okx_apiKey: '',
    okx_passPhrase: '',
    okx_secretKey: '',
    okx_amount: '0.001',
    okx_sleep_min: 5,
    okx_sleep_max: 10,

    /* Ощиие настройки */
    minGasPrice: 100, //Минимальный газ при котором софт начнет работу в GWEI прим. 100 = 100gwei
    sleep_protocols: [1, 1], //Задержка между выполнением потоколов. Случайное число [ОТ, ДО] в СЕКУНДАХ
    sleep_account: [1, 1], //Задержка между запуском аккаунтов. Случайное число [ОТ, ДО] в СЕКУНДАХ
    refuel_threshold: "0.0035",

    /* Создание кошельков */
    batch_create: false,
    batch_create_number: 30, //Количество созданных кошельков

    /* Бридж ETH через официальный мост */ 
    // starkgate: false,
    // starkgate_show_fee: false, // Если true покажет сколько потребуется ETH для установленного starkgate_amount. БРИДЖ НЕ ПРОИЗОЙДЕТ
    starkgate_amount: "0.0077",

    /* Обновдение кошельков до актуальной версии имплементации */
    upgrade: false,

    /* Предоставление ликвидности в jediSwap */
    jediSwap_liq: false,
    jediSwap_liq_amount: [1, 1], //Выбирает случайно количество стейблов для предоставления ликвидности [ОТ, ДО]

    /* Бридж ИЗ старкнета в arbitrum, использця orbiter */
    orbiter_to_evm: true,
    orbiter_amount: "0", //Если 0, то выполнит трансфер всего эфира на кошельке
    orbiter_to_network: 'arbitrum',
    
    /*
        dex - рандомизирует количество dex протоколов
        если указано [4, 4] будут взяты все ВКЛЮЧЕННЫЕ протоколы
        если указано [1, 2] или [1, 4] будет взято случайное число протоколов от 1 до 2 или от 1 до 3 соотвественно 
    */
    protocols: [4, 4], //Выбирает случайное количество протоколов [ОТ, ДО] из включенных НИЖЕ.
    jediSwap: false,
    l0kswap: false,
    mySwap: false,
    dmail: false, 

    slippage: 1, //Проскальзывание в процентах 1 = 1%

    stableSwap: true, //Если включено обменивает ТОЛЬКО стейблы иначе обменивает ETH на стейбл
    stableSwap_full_balance: true, //Если включено обменивает весь доступный баланс стейблов
    stable_amount_to_swap: [100, 200], //Выбирает случайно количество стейблов для свапа [ОТ, ДО]

    /* Письма Dmail */
    Dmail_mails_count: [1, 1], ////Выбирает случайно количество писем для отправки [ОТ, ДО]
}