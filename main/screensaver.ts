// import terminalLink from 'terminal-link';
import terminalLink = require('terminal-link');
import colors from 'colors';
import { printCenteredText } from '../src/utils/utils';

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