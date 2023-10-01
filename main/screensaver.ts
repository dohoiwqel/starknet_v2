// import terminalLink from 'terminal-link';
import terminalLink = require('terminal-link');
import colors from 'colors';


function printCenteredText(text: string, colors?: any) {
    const terminalWidth = process.stdout.columns; // Получаем ширину консоли
    const padding = Math.floor((terminalWidth - text.length) / 2); // Вычисляем количество пробелов для выравнивания текста по центру
    const centeredText = ' '.repeat(padding) + text; // Добавляем пробелы перед текстом
    colors?console.log(colors(centeredText)): console.log(centeredText); // Выводим текст в консоль
}

export function screensaver() {
    console.log('')
    printCenteredText(`    ▄████████     ███        ▄███████▄ `)
    printCenteredText(`   ███    ███ ▀█████████▄   ███    ███ `)
    printCenteredText(`   ███    █▀     ▀███▀▀██   ███    ███ `)
    printCenteredText(`  ▄███▄▄▄         ███   ▀   ███    ███ `)
    printCenteredText(` ▀▀███▀▀▀         ███     ▀█████████▀  `)
    printCenteredText(`   ███            ███       ███        `)
    printCenteredText(`   ███            ███       ███        `)
    printCenteredText(`   ███           ▄████▀    ▄████▀      `)
    console.log('')
                                       
    printCenteredText('Fuck the population')
    printCenteredText('https://t.me/ftp_crypto', colors.yellow)
}

screensaver()