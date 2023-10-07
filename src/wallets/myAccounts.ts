import { Account, Contract, Provider, SequencerProvider, constants, ec, transaction, uint256, ProviderInterface, stark, GatewayError, TransactionStatus } from "starknet";
import { ABI } from "./ABI";
import { ethers } from "ethers";
import { calculateAddressBraavos, deployBraavosAccount } from "./deploy_bravos";
import * as XLSX from 'xlsx'
import { logger } from "../../logger/logger";
import { getProvider } from "../../utils/utils";

export class MyAccounts {

    private createProvider: Provider
    private standartProvider: Provider

    constructor() {
        this.createProvider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } })
        this.standartProvider = getProvider()
    }

    async deploy(account: Account, privateKey: string) {
        try {
            const txHash = await deployBraavosAccount(privateKey, this.createProvider!)
            await this.createProvider.waitForTransaction(txHash.transaction_hash, {retryInterval: 10000, successStates: [TransactionStatus.ACCEPTED_ON_L2]})
            logger.success(`Задеплоен аккаунт tx: ${txHash.transaction_hash}`, account.address)
            account = new Account(this.createProvider, account.address, privateKey)
            return {account: account, privateKey: privateKey}
        } catch(e: any) {
            if(e.errorCode) {
                if(e.errorCode === "StarknetErrorCode.INSUFFICIENT_ACCOUNT_BALANCE") {
                    throw logger.error(`Недостаточно средств для деплоя`, account.address)
                }
            }

            throw logger.error(`Незивестная ошибка при деплое аккаунта ${JSON.stringify(e)}`, account.address)
        }
    }

    async checkDeploy(_account: Account, _privateKey: string) {
        try {
            const contract = new Contract(ABI, _account.address, _account)
            const pubKey = await contract.getPublicKey()
            return {account: _account, privateKey: _privateKey} //Стандартный провайдер
        } catch(e: any) {
            if(e.message.includes("is not deployed") || e.message.includes('Contract not found')) {
                logger.info('Деплоим аккаунт', _account.address)
                const {account: account, privateKey: privateKey} = await this.deploy(_account, _privateKey) //деплой провайдер
                return {account: account, privateKey: privateKey}
            }

            throw logger.error(`Неизвестная ошибка при получении аккаунта`)
        }
    }

    private EIP2645Hashing(key0: string) {
        const N = BigInt(2) ** BigInt(256);
        const starkCurveOrder = BigInt(`0x${constants.EC_ORDER}`);
    
        const N_minus_n = N - (N % starkCurveOrder);
        for (let i = 0; ; i++) {
            const hex = '0x0' + (i).toString(16)
            const x = ethers.concat([key0, ethers.getBytes(hex)]);
    
            const key = BigInt(ethers.hexlify(ethers.sha256(x)));
    
            if (key < N_minus_n) {
                return `0x0${(key % starkCurveOrder).toString(16)}`;
            }
        }
    };
    
    private getBraavosPrivateKey(mnemonic: string) {
        const seed = (ethers.Mnemonic.fromPhrase(mnemonic)).computeSeed();
        let hdnode = ethers.HDNodeWallet.fromSeed(seed);
        hdnode = hdnode.derivePath(`m/44'/9004'/0'/0/0`);
        const groundKey = this.EIP2645Hashing(hdnode.privateKey);
        return groundKey
    }

    async get_account_without_checkDeploy(mnemonicORpirvateKey: string) {
        try {
            const lineLength = mnemonicORpirvateKey.split(" ").length
            
            //Если мнемоника
            if(lineLength > 1) {
                const _privateKey = this.getBraavosPrivateKey(mnemonicORpirvateKey)
                const accountAddress = calculateAddressBraavos(_privateKey)
                const _account = new Account(this.standartProvider!, accountAddress, _privateKey)
                return {account: _account, privateKey: _privateKey}
            
            } else {
                //Если privateKey
                const _privateKey = mnemonicORpirvateKey
                const accountAddress = calculateAddressBraavos(mnemonicORpirvateKey)
                const _account = new Account(this.standartProvider!, accountAddress, _privateKey)
                return {account: _account, privateKey: _privateKey}
            }

        } catch(e) {
            throw new Error (`Ошибка при полуении starknet аккаунта ${e}`)
        }
    }

    async getAccount(mnemonicORpirvateKey: string) {
        try {
            const lineLength = mnemonicORpirvateKey.split(" ").length
            
            //Если мнемоника
            if(lineLength > 1) {
                const _privateKey = this.getBraavosPrivateKey(mnemonicORpirvateKey)
                const accountAddress = calculateAddressBraavos(_privateKey)
                const _account = new Account(this.standartProvider!, accountAddress, _privateKey)

                const {account, privateKey} = await this.checkDeploy(_account, _privateKey)
                return {account: account, privateKey: privateKey}
            
            } else {
                //Если privateKey
                const _privateKey = mnemonicORpirvateKey
                const accountAddress = calculateAddressBraavos(mnemonicORpirvateKey)
                const _account = new Account(this.standartProvider!, accountAddress, _privateKey)

                const {account, privateKey} = await this.checkDeploy(_account, _privateKey)
                return {account: account, privateKey: privateKey}
            }

        } catch(e) {
            throw new Error (`Ошибка при полуении starknet аккаунта ${e}`)
        }
    }

    private writeToXLSX(data: any[]) {
        const workbook = XLSX.utils.book_new()
        let worksheet = XLSX.utils.aoa_to_sheet(data)
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Данные')
        XLSX.writeFile(workbook, 'output.xlsx')
    }

    batchCreate(count: number) {

        let dataArr: any[] = []

        dataArr.push(["Address", "PrivateKey", "Mnemonic"])

        for(let i=0; i<count; i++) {
            const mnemonic = ethers.Wallet.createRandom().mnemonic!.phrase
            const privateKey = this.getBraavosPrivateKey(mnemonic)
            const accountAddress = calculateAddressBraavos(privateKey)

            dataArr.push([accountAddress, privateKey, mnemonic])
        }

        this.writeToXLSX(dataArr)
        logger.success(`Создано ${count} аккаунтов старкнет`)
    }
}