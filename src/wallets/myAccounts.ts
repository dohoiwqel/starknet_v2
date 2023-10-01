import { Account, Contract, Provider, SequencerProvider, constants, ec, transaction, uint256, ProviderInterface, stark, GatewayError } from "starknet";
import { ABI } from "./ABI";
import { ethers } from "ethers";
import { calculateAddressBraavos, deployBraavosAccount } from "./deploy_bravos";
import * as XLSX from 'xlsx'
import { logger } from "../../logger/logger";

export class MyAccounts {

    private provider: Provider

    constructor() {
        this.provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN } })
    }

    async deploy(account: Account, privateKey: string) {
        try {
            const txHash = await deployBraavosAccount(privateKey, this.provider!)
            await this.provider.waitForTransaction(txHash.transaction_hash)
            logger.success(`Задеплоен аккаунт tx: ${txHash.transaction_hash}`, account.address)
        } catch(e: any) {
            if(e.errorCode) {
                if(e.errorCode === "StarknetErrorCode.INSUFFICIENT_ACCOUNT_BALANCE") {
                    throw logger.error(`Недостаточно средст для деплоя`, account.address)
                }
            }

            logger.error(`Незивестная ошибка при деплое аккаунта ${JSON.stringify(e)}`, account.address)
        }
    }

    async checkDeploy(account: Account, privateKey: string) {
        try {
            const contract = new Contract(ABI, account.address, account)
            const pubKey = await contract.getPublicKey()
        } catch(e: any) {
            if(e.message.includes("is not deployed")) {
                logger.info('Деплоим аккаунт', account.address)
                await this.deploy(account, privateKey)
            }
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

    async getAccount(mnemonicORpirvateKey: string) {
        try {
            const lineLength = mnemonicORpirvateKey.split(" ").length
            
            //Если мнемоника
            if(lineLength > 1) {
                const privateKey = this.getBraavosPrivateKey(mnemonicORpirvateKey)
                const accountAddress = calculateAddressBraavos(privateKey)
                const account = new Account(this.provider!, accountAddress, privateKey)
                return {account: account, privateKey: privateKey}
            }
    
            //Если privateKey
            const accountAddress = calculateAddressBraavos(mnemonicORpirvateKey)
            const account = new Account(this.provider!, accountAddress, mnemonicORpirvateKey)
            return {account: account, privateKey: mnemonicORpirvateKey}
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