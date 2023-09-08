import { BigNumber, ethers } from "ethers";
import { ABI } from "./oracleABI";

export async function getEthPrice() {
    const rpc = "https://rpc.ankr.com/eth"
    const provider = new ethers.providers.JsonRpcProvider(rpc)
    const oracleAddress = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
    const oracleABI = ABI
    const oracle = new ethers.Contract(oracleAddress, oracleABI, provider)
    const weiPrice: BigNumber = await oracle.latestAnswer()
    return Math.round(Number(ethers.utils.formatUnits(weiPrice.toString(), '8').toString()))
}