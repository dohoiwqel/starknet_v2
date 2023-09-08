import colors from 'colors';

export function get_short_address(address: string){
    return address.slice(0, 4) + "..." + address.slice(address.length - 4, address.length)
}

function center_pad_string(inputString: string, targetLength: number, paddingChar: string) {
    if (inputString.length >= targetLength) {
        return inputString; // Если строка уже достаточно длинная, возвращаем её без изменений
    }

    const paddingLength = targetLength - inputString.length;
    const leftPadding = Math.floor(paddingLength / 2);
    const rightPadding = paddingLength - leftPadding;

    const paddedString = paddingChar.repeat(leftPadding) + inputString + paddingChar.repeat(rightPadding);
    return paddedString;
}

export const logger = {
    success: (message: any, from_long?: string, task_name?: string) => {
      const from = from_long?.startsWith("0x")? get_short_address(from_long) : from_long
      console.log(`${colors.green(`[${new Date().toLocaleString().split(",")[1].trim()}]`)} ${from? colors.blue(`[${center_pad_string(from, 10, " ")}] `): ""}${colors.green(`[SUCCESS]`)} ${task_name? colors.green(`[${task_name}] `): ""}${message}`);
    },
    info: (message: any, from_long?: string, task_name?: string) => {
      const from = from_long?.startsWith("0x")? get_short_address(from_long) : undefined
      console.log(`${colors.yellow(`[${new Date().toLocaleString().split(",")[1].trim()}]`)} ${from? colors.blue(`[${center_pad_string(from, 10, " ")}] `): ""}${colors.yellow(`[INFO]`)} ${task_name? colors.yellow(`[${task_name}] `): ""}${message}`);
    },
    error: (message: any, from_long?: string, task_name?: string) => {
      const from = from_long?.startsWith("0x")? get_short_address(from_long) : undefined
      console.log(`${colors.red(`[${new Date().toLocaleString().split(",")[1].trim()}]`)} ${from? colors.blue(`[${center_pad_string(from, 10, " ")}] `): ""}${colors.red(`[ERROR]`)} ${task_name? colors.red(`[${task_name}] `): ""}${message}`);
    },
};
  
  

