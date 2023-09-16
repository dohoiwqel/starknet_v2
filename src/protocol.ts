import { Account, ArgsOrCalldata, Contract, GetTransactionReceiptResponse, SequencerProvider, TransactionStatus, Uint256, constants } from "starknet";

export class Protocol {

    protected account: Account
    public taskName: string

    constructor(account: Account, taskName: string) {
        this.account = account
        this.taskName = taskName
    }

    protected async waitForTransaction(tx: string): Promise<GetTransactionReceiptResponse> {
        try {
            const provider = new SequencerProvider({ baseUrl: constants.BaseUrl.SN_MAIN })
            const response = await provider.waitForTransaction(tx, {retryInterval: 1000, successStates: [TransactionStatus.ACCEPTED_ON_L2]})
            
            if(response.status === 'ACCEPTED_ON_L2') return response;
            if(response.status === 'REJECTED') throw `Не удалось послать транзакцию ${response.transaction_hash}`;

            return await this.waitForTransaction(tx)

        } catch(e: any) {
            throw (e.response || e.error || e)
        }
    }

    protected async sendTransaction(contract: Contract, account: Account, functionName: string, callData: ArgsOrCalldata | undefined): Promise<GetTransactionReceiptResponse> {
        try {
            const nonce = await account.getNonce()
            const receipt = await contract.invoke(functionName, callData, {nonce: nonce})
            return await this.waitForTransaction(receipt.transaction_hash)

        } catch(e: any) {
            if(e.message && e.message.includes('Invalid transaction nonce')) {
                console.log('DEV: Ошибка с nonce')
                return await this.sendTransaction(contract, account, functionName, callData)
            }

            throw e
        }
    }
}