import { SNSEvent } from 'aws-lambda';
import axios from 'axios';

export const lambdaHandler = async (event: SNSEvent): Promise<void> => {
    try {
        const telegramBotToken = `bot${process.env.TELEGRAM_BOT_TOKEN}`;
        const telegramPostUrl = `https://api.telegram.org/${telegramBotToken}/sendMessage`;
        console.log(event.Records[0].Sns.MessageAttributes);
        const {
            title: titleAttribute,
            url: urlAttribute,
            imageUrl: imageUrlAttribute,
        } = event.Records[0].Sns.MessageAttributes;

        const title = titleAttribute.Value;
        const url = urlAttribute.Value;
        const imageUrl = imageUrlAttribute.Value;

        const message = `*${title}*  [${url}](${url})  [ ](${imageUrl})`;

        const response = await axios.post(telegramPostUrl, {
            chat_id: '@promobugsdev',
            parse_mode: 'markdown',
            text: message,
        });

        console.log(response);
    } catch (err) {
        console.log(err);
    }
};
