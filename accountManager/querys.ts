import { prompt } from 'enquirer';

export async function select(menuOptions: Array<string>, text: string) {
    try {
        const questions = [
            {
                type: 'select',
                name: 'selectedAction',
                message: text,
                choices: menuOptions,
            },
        ];

        const answer: {selectedAction: string} = await prompt(questions)
        return answer.selectedAction
    
    } catch(e) {
        if(e) {
            throw e
        }
    }
}

export async function input(text: string) {
    try {
        const questions = [
            {
              type: 'input',
              name: 'userInput',
              message: text,
            },
        ];

        const answer: {userInput: string} = await prompt(questions)
        return answer.userInput

    } catch(e) {
        if(e) {
            throw e
        }
    }
}

export async function yesNo(text: string) {
    try {
        const menuOptions = [
            'Да',
            'Нет'
        ];
    
        const questions = [
            {
                type: 'select',
                name: 'selectedAction',
                message: text,
                choices: menuOptions,
            },
        ];
    
        const answer: {selectedAction: string} = await prompt(questions)
    
        switch(answer.selectedAction) {
            case 'Да':
                return true;
            case 'Нет':
                return false
            default:
                throw new Error('Ошибка в получении ответа от пользователя')
        }

    } catch(e) {
        if(e) {
            throw e
        }
    }

}