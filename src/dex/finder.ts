import { Account, Contract, uint256 } from "starknet";
import { logger } from "../logger/logger";
import { Token, Tokens } from "../tokens/tokens";

export class Finder {

    private account: Account
    private tokens = new Tokens()

    constructor(
        account: Account
    ) {
        this.account = account
    }

    async getHighestBalanceToken() {
        let value: bigint = 0n
        let highToken: Token

        for(let token of this.tokens.getIterator()) {
            const contractAddress = token.contractAddress
            const ABI = token.ABI
            const contract = new Contract(ABI, contractAddress, this.account)

            const userBalance: uint256.Uint256 = (await contract.balanceOf(this.account.address)).balance
            const userBalanceBN = uint256.uint256ToBN(userBalance)
            
            if(value < userBalanceBN) {
                value = userBalanceBN
                highToken = token
            }
        }

        if(!highToken!) {
            throw logger.error(`На аккаунте нет средств`, this.account.address)
        }

        return {token: highToken, balance: value}
    }

    async getEth() {
        const contractAddress = this.tokens.ETH.contractAddress
        const ABI = this.tokens.ETH.ABI
        const contract = new Contract(ABI, contractAddress, this.account)

        const userBalance: uint256.Uint256 = (await contract.balanceOf(this.account.address)).balance
        const userBalanceBN = uint256.uint256ToBN(userBalance)

        return {eToken: this.tokens.ETH, eBalance: userBalanceBN}
    }

}