import { Account, Contract, uint256 } from "starknet";
import { Tokens, Token } from './tokens/tokens'
import { logger } from "../logger/logger";

export class Finder {

    private account: Account
    private Tokens: Tokens

    constructor(
        account: Account
    ) {
        this.account = account
        this.Tokens = new Tokens
    }

    async getHighestBalanceToken() {
        let value: bigint = 0n
        let highToken: Token

        for(let token of this.Tokens.getIterator()) {
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
            const {eToken, eBalance} = await this.getEth()
            return {token: eToken, balance: eBalance}
        }

        return {token: highToken, balance: value}
    }

    async getEth() {
        const contractAddress = this.Tokens.ETH.contractAddress
        const ABI = this.Tokens.ETH.ABI
        const contract = new Contract(ABI, contractAddress, this.account)

        const userBalance: uint256.Uint256 = (await contract.balanceOf(this.account.address)).balance
        const userBalanceBN = uint256.uint256ToBN(userBalance)

        return {eToken: this.Tokens.ETH, eBalance: userBalanceBN}
    }

}