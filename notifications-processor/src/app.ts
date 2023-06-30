import { SNSEvent } from 'aws-lambda';
import axios from 'axios';

export const lambdaHandler = async (event: SNSEvent): Promise<void> => {
    try {
        const {
            title: titleAttribute,
            url: urlAttribute,
            imageUrl: imageUrlAttribute,
        } = event.Records[0].Sns.MessageAttributes;

        const title = titleAttribute.Value;
        const url = urlAttribute.Value;
        const imageUrl = imageUrlAttribute.Value;
        const captionHtml = `<b>${title}</b>\u000a<a href="${url}">${url}</a>`;

        const telegramBotToken = `bot${process.env.TELEGRAM_BOT_TOKEN}`;
        const telegramPostUrl = `https://api.telegram.org/${telegramBotToken}/sendPhoto`;

        const response = await axios.post(telegramPostUrl, {
            chat_id: '@promobugsdev',
            photo: imageUrl,
            parse_mode: 'HTML',
            caption: captionHtml,
        });

        console.log(response);
    } catch (err) {
        console.log(err);
    }
};
