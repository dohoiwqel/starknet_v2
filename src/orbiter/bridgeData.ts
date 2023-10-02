import { ethers } from "ethers"

export type network = 'ethereum' | 'starknet' | 'arbitrum'

export function getWithHoldingFee(toNetwork: network) {
    let feeInEth = '0'

    switch(toNetwork) {
        case 'ethereum':
            feeInEth = '0.0074'
            break
        case 'arbitrum':
            feeInEth = '0.0008'
            break
    }

    return ethers.parseEther(feeInEth)
}

export function getMinBridgeAmount(fromNetwork: network) {
    
    let minInEth = '0'

    switch(fromNetwork) {
        case 'starknet':
            minInEth = '0.005'
            break
    }

    return ethers.parseEther(minInEth)
}

export function getPayTextId(toNetwork: network) {

    let payText = '9002'

    switch(toNetwork) {
        case 'arbitrum':
            payText = '9002'
            break
    }

    return payText
}

export function getPayTextValue(value: bigint, payTextId: string) {
    const _value = value.toString()
    const replacedString = _value.slice(0, -payTextId.length) + payTextId;
    return BigInt(replacedString);
}

export function checkPayText(value: string, payTextValue: string) {
    const targetSuffix = payTextValue.toString();
    const inputSuffix = value.slice(-targetSuffix.length);
  
    if (inputSuffix !== targetSuffix) {
      throw new Error("ОШИБКА С СОСТАВЛЕНИЕ PAYTEXT");
    }
}