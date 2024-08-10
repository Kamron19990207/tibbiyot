const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const bodyParser = require('body-parser');

// Bot tokenni quyida o'zgartiring
const bot = new Telegraf('YOUR_BOT_TOKEN');

const app = express();
app.use(bodyParser.json());

// Webhook URL (replace '<your-vercel-app-name>' with your actual Vercel app name)
const webhookUrl = `https://tibbiyot-lwfq-e2s5rk94e-kamron19990207s-projects.vercel.app/webhook`;

app.post('/webhook', (req, res) => {
  bot.handleUpdate(req.body);
  res.status(200).send('Webhook received');
});

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// Set webhook
bot.telegram.setWebhook(webhookUrl).then(() => {
  console.log('Webhook set successfully');
}).catch((err) => {
  console.error('Error setting webhook:', err);
});

// Handle bot commands and interactions
const channelId = '@donorim1999';
const adminChatId = '123456789';

let userData = {};
let messageIds = {};

bot.start((ctx) => {
  const chatId = ctx.chat.id;
  userData[chatId] = {};
  messageIds[chatId] = [];

  ctx.reply('Assalomu alaykum! Tibbiy so\'rovnomaga xush kelibsiz. Iltimos, kontakt ma\'lumotlaringizni yuboring:',
    Markup.keyboard([
      [Markup.button.contactRequest('📱 Telefon raqamni yuborish')]
    ]).resize()
  ).then((message) => {
    messageIds[chatId].push(message.message_id);
  }).catch(err => console.error('Error sending message:', err));

  ctx.telegram.sendMessage(channelId, `Yangi foydalanuvchi botga qo'shildi: ${ctx.from.first_name} (@${ctx.from.username || 'no username'})`)
    .catch(err => console.error('Telegram error:', err));
});

bot.on('contact', (ctx) => {
  const chatId = ctx.chat.id;
  userData[chatId] = userData[chatId] || {};
  userData[chatId].phoneNumber = ctx.message.contact.phone_number;
  messageIds[chatId] = messageIds[chatId] || [];
  messageIds[chatId].push(ctx.message.message_id);

  ctx.reply('Rahmat! Endi ismingiz va familiyangizni kiriting (masalan, Ali Vali):', Markup.removeKeyboard())
    .then((message) => {
      messageIds[chatId].push(message.message_id);
    }).catch(err => console.error('Error sending message:', err));
});

bot.on('text', (ctx) => {
  const chatId = ctx.chat.id;
  userData[chatId] = userData[chatId] || {};
  messageIds[chatId] = messageIds[chatId] || [];
  messageIds[chatId].push(ctx.message.message_id);

  if (!userData[chatId].name) {
    const [name, surname] = ctx.message.text.split(' ');
    if (!name || !surname) {
      return ctx.reply('Iltimos, to\'liq ismingiz va familiyangizni kiriting (masalan, Ali Vali):')
        .catch(err => console.error('Error sending message:', err));
    }
    userData[chatId].name = name;
    userData[chatId].surname = surname;

    ctx.reply('Iltimos, tugilgan sanangizni kiriting (kun-oy-yil formatida, masalan, 01-01-2000):')
      .catch(err => console.error('Error sending message:', err));
  } else if (!userData[chatId].birthDate) {
    if (!/^\d{2}-\d{2}-\d{4}$/.test(ctx.message.text)) {
      return ctx.reply('Iltimos, tugilgan sanangizni to\'g\'ri formatda kiriting (masalan, 01-01-2000):')
        .catch(err => console.error('Error sending message:', err));
    }
    userData[chatId].birthDate = ctx.message.text;
    ctx.reply('Endi yashash joyingizni tanlang:',
      Markup.keyboard([
        ['Toshkent', 'Samarqand'],
        ['Andijon', 'Farg‘ona'],
        ['Qashqadaryo', 'Surxondaryo'],
        ['Namangan', 'Buxoro'],
        ['Jizzax', 'Sirdaryo'],
        ['Xorazm', 'Navoiy'],
        ['Qoraqolpogiston', 'Toshkent Shahri'],
      ]).resize()
    ).then((message) => {
      messageIds[chatId].push(message.message_id);
    }).catch(err => console.error('Error sending message:', err));
  } else if (!userData[chatId].region) {
    userData[chatId].region = ctx.message.text;
    ctx.reply('Iltimos, tuman yoki shahar nomini kiriting:', Markup.removeKeyboard())
      .then((message) => {
        messageIds[chatId].push(message.message_id);
      }).catch(err => console.error('Error sending message:', err));
  } else if (!userData[chatId].city) {
    userData[chatId].city = ctx.message.text;
    ctx.reply('Bo\'yingizni kiriting (sm):')
      .then((message) => {
        messageIds[chatId].push(message.message_id);
      }).catch(err => console.error('Error sending message:', err));
  } else if (!userData[chatId].height) {
    if (!/^\d+$/.test(ctx.message.text)) {
      return ctx.reply('Iltimos, bo\'yingizni raqamlarda kiriting (masalan, 175):')
        .catch(err => console.error('Error sending message:', err));
    }
    userData[chatId].height = ctx.message.text;
    ctx.reply('Vazningizni kiriting (kg):')
      .then((message) => {
        messageIds[chatId].push(message.message_id);
      }).catch(err => console.error('Error sending message:', err));
  } else if (!userData[chatId].weight) {
    if (!/^\d+$/.test(ctx.message.text)) {
      return ctx.reply('Iltimos, vazningizni raqamlarda kiriting (masalan, 70):')
        .catch(err => console.error('Error sending message:', err));
    }
    userData[chatId].weight = ctx.message.text;
    ctx.reply('Qon guruhiingizni tanlang:',
      Markup.inlineKeyboard([
        [Markup.button.callback('O(I)', 'bloodType_O')],
        [Markup.button.callback('A(II)', 'bloodType_A')],
        [Markup.button.callback('B(III)', 'bloodType_B')],
        [Markup.button.callback('AB(IV)', 'bloodType_AB')],
        [Markup.button.callback('Bilmayman', 'bloodType_aniqbilmaydi')]
      ])
    ).then((message) => {
      messageIds[chatId].push(message.message_id);
    }).catch(err => console.error('Error sending message:', err));
  } else {
    handleUnexpectedMessage(ctx);
  }
});

bot.action(['bloodType_O', 'bloodType_A', 'bloodType_B', 'bloodType_AB', 'bloodType_aniqbilmaydi'], (ctx) => {
  const chatId = ctx.chat.id;
  userData[chatId].bloodType = ctx.match[0].split('_')[1];

  ctx.reply('Sizning rezus omilingiz (Rh) qanday?',
    Markup.inlineKeyboard([
      [Markup.button.callback('Musbat (+)', 'rh_positive')],
      [Markup.button.callback('Manfiy (-)', 'rh_negative')],
      [Markup.button.callback('Bilmayman', 'rh_unknown')]
    ])
  ).then((message) => {
    messageIds[chatId].push(message.message_id);
  }).catch(err => console.error('Error sending message:', err));
  ctx.answerCbQuery();
});

bot.action(['rh_positive', 'rh_negative', 'rh_unknown'], (ctx) => {
  const chatId = ctx.chat.id;
  const rhFactors = {
    'rh_positive': 'Musbat (+)',
    'rh_negative': 'Manfiy (-)',
    'rh_unknown': 'Bilmayman'
  };
  userData[chatId].rhFactor = rhFactors[ctx.match[0]];

  ctx.reply('Sizda yuqumli kasalliklar bormi?',
    Markup.inlineKeyboard([
      [Markup.button.callback('Ha', 'infectiousDisease_yes')],
      [Markup.button.callback('Yo\'q', 'infectiousDisease_no')]
    ])
  ).then((message) => {
    messageIds[chatId].push(message.message_id);
  }).catch(err => console.error('Error sending message:', err));
  ctx.answerCbQuery();
});

bot.action(['infectiousDisease_yes', 'infectiousDisease_no'], (ctx) => {
  const chatId = ctx.chat.id;
  userData[chatId].infectiousDisease = ctx.match[0] === 'infectiousDisease_yes';

  if (messageIds[chatId]) {
    for (const messageId of messageIds[chatId]) {
      ctx.deleteMessage(messageId).catch(err => console.error('Error deleting message:', err));
    }
  }

  const summaryMessage = `
So'rovnoma tugallandi. Quyidagi ma'lumotlaringiz qayd etildi:

📱 Telefon raqami: ${userData[chatId].phoneNumber}
👤 F.I.O: ${userData[chatId].name} ${userData[chatId].surname}
📅 Tug'ilgan sana: ${userData[chatId].birthDate}
🏡 Yashash joyi: ${userData[chatId].region}, ${userData[chatId].city}
📏 Bo'y: ${userData[chatId].height} sm
⚖️ Vazn: ${userData[chatId].weight} kg
🩸 Qon guruhi: ${userData[chatId].bloodType}
🧬 Rezus omili: ${userData[chatId].rhFactor}
🦠 Yuqumli kasalliklar: ${userData[chatId].infectiousDisease ? 'Ha' : 'Yo\'q'}

Kanalimizga obuna bo'ling: https://t.me/${channelId}
  `;

  ctx.reply(summaryMessage).catch(err => console.error('Error sending message:', err));

  ctx.answerCbQuery();
});

function handleUnexpectedMessage(ctx) {
  const chatId = ctx.chat.id;

  ctx.telegram.sendMessage(adminChatId, `Kutilmagan xabar: ${ctx.message.text}\nFoydalanuvchi: ${ctx.from.first_name} (@${ctx.from.username || 'no username'})`)
    .catch(err => console.error('Error notifying admin:', err));

  ctx.reply('So\'rovnoma tugallandi. Yangi xabarlar qabul qilinmaydi.')
    .catch(err => console.error('Error sending message:', err));
}

bot.launch().then(() => {
  console.log('Bot started');
}).catch(err => console.error('Error starting bot:', err));
