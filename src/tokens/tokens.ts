import { tokenABI } from "./tokenABI"

export interface Token {
    contractAddress: string
    ABI: any[]
    decimals: number
    ticker: string
}

export interface PoolToken extends Token {}

export class Tokens {
    public USDT: Token = {contractAddress: '0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8', ABI: tokenABI, decimals: 6, ticker: "USDT"};
    public USDC: Token = {contractAddress: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8', ABI: tokenABI, decimals: 6, ticker: "USDC"};
    public ETH: Token = {contractAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7', ABI: tokenABI, decimals: 18, ticker: "ETH"};
    public jediswap_USDC_USDC_shares: PoolToken = {contractAddress: '0x05801bdad32f343035fb242e98d1e9371ae85bc1543962fedea16c59b35bd19b', ABI: tokenABI, decimals: 18, ticker: "JediPool"}

    getIterator(): Token[] {
        return [this.USDT, this.USDC];
    }
}