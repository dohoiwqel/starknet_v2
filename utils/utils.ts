import readline from 'readline'
import * as fs from 'fs'

export function sleep(sleep_min: number, sleep_max: number) {
    const seconds = getRandomInt(sleep_min, sleep_max) 
    // console.log(`Спим ${seconds} секунд`)
    return new Promise(resolve => setTimeout(() => resolve(''), seconds*1000))
}

export function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max) + 1;
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

export async function read(fileName: string): Promise<string[]> {
    const array: string[] = []
    const readInterface = readline.createInterface({
        input: fs.createReadStream(fileName),
        crlfDelay: Infinity,
    })
    for await (const line of readInterface) {
        array.push(line)
    }
    return array
}

export function getRandomElementFromArray(fromArray: any[], n: number, mutableArray: any[]): string[] {
    const selectedIndices: number[] = [];

    if(fromArray.length === 0) {
        return mutableArray
    }
  
    while (mutableArray.length < n) {
        // console.log(mutableArray.length)
        const randomIndex = Math.floor(Math.random() * fromArray.length);
        // Проверка, что строка с таким индексом еще не была выбрана
        if (!selectedIndices.includes(randomIndex)) {
            selectedIndices.push(randomIndex);
            mutableArray.push(fromArray[randomIndex]);
        }
    }
  
    return mutableArray;
  }