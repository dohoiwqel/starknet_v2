import { Iconfig } from "./src/interfaces/iconfig";

export const config: Iconfig = {

    rpc_url: "",

    //OKX
    okx_apiKey: '',
    okx_secretKey: '',
    okx_passPhrase: '',
    okx_withdraw_amount: [0.003, 0.006],
    okx_sleep_min: 5,
    okx_sleep_max: 10,

    /* Ощиие настройки */
    minGasPrice: 100, //Минимальный газ при котором софт начнет работу в GWEI прим. 100 = 100gwei
    sleep_protocols: [1, 1], //Задержка между выполнением потоколов. Случайное число [ОТ, ДО] в СЕКУНДАХ
    sleep_account: [1, 1], //Задержка между запуском аккаунтов. Случайное число [ОТ, ДО] в СЕКУНДАХ
    refuel_threshold: "0.0005",

    /* Бридж ETH через официальный мост */ 
    starkgate_amount: "0.0077",
    starkgate_bridge_full_ETH: false, 

    /* Обновдение кошельков до актуальной версии имплементации */
    upgrade: true,

    /* Предоставление ликвидности в jediSwap */
    jediSwap_liq: false,
    jediSwap_liq_amount: [1, 10], //Выбирает случайно количество стейблов для предоставления ликвидности [ОТ, ДО]
    jediswap_liq_withdraw: true,

    /* Бридж ИЗ старкнета в arbitrum, использця orbiter */
    orbiter_to_evm: false,
    orbiter_amount: "0",
    orbiter_to_network: 'arbitrum',
    orbiter_bridge_full_ETH: true,
    
    /*
        dex - рандомизирует количество dex протоколов
        если указано [4, 4] будут взяты все ВКЛЮЧЕННЫЕ протоколы
        если указано [1, 2] или [1, 4] будет взято случайное число протоколов от 1 до 2 или от 1 до 3 соотвественно 
    */
    protocols: [6, 6], //Выбирает случайное количество протоколов [ОТ, ДО] из включенных НИЖЕ.
    jediSwap: true,
    l0kswap: true,
    mySwap: true,
    avnu: true,
    dmail: true,
    mint_starkId: true,

    slippage: 5, //Проскальзывание в процентах 1 = 1%

    stableSwap: true, //Если включено обменивает ТОЛЬКО стейблы иначе обменивает ETH на стейбл
    stableSwap_full_balance: true, //Если включено обменивает весь доступный баланс стейблов
    stable_amount_to_swap: [100, 200], //Выбирает случайно количество стейблов для свапа [ОТ, ДО]

    /* Письма Dmail */
    Dmail_mails_count: [1, 1], ////Выбирает случайно количество писем для отправки [ОТ, ДО]
}