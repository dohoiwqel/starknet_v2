import { Account, SequencerProvider, TransactionStatus, constants } from "starknet";
import { logger } from "../logger/logger";

export class Protocol {

    protected account: Account
    public taskName: string

    constructor(account: Account, taskName: string) {
        this.account = account
        this.taskName = taskName
    }

    protected async waitForTransaction(tx: string) {
        try {
            const provider = new SequencerProvider({ baseUrl: constants.BaseUrl.SN_MAIN })
            await provider.waitForTransaction(tx, {retryInterval: 1000, successStates: [TransactionStatus.ACCEPTED_ON_L2]})
            return true
        } catch(e: any) {
            throw logger.error(e.response || e.error || e, this.account.address, this.taskName)
        }
    }
}