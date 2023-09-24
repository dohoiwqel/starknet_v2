import { prompt } from 'enquirer';

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