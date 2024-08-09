const { Telegraf, Markup } = require('telegraf');

const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const bot = new Telegraf('7040576594:AAG4_8s9DzktAfos4D50WeMiSQTjwUHXQaA');





const app = express();
app.use(bodyParser.json());

// Define a port
const PORT =  3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Basic route to check if the server is up
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// Set your bot token




// Set the channel's username or ID
const channelId = '@donorim1999';
// Replace with the actual numeric user ID of the admin
const adminChatId = '123456789';

// Object to store user data and message IDs
let userData = {};
let messageIds = {};

// Start command
bot.start((ctx) => {
  const chatId = ctx.chat.id;
  userData[chatId] = {}; // Create an empty object to store user data
  messageIds[chatId] = []; // Initialize an empty array to store message IDs

  ctx.reply('Assalomu alaykum! Tibbiy so\'rovnomaga xush kelibsiz. Iltimos, kontakt ma\'lumotlaringizni yuboring:',
    Markup.keyboard([
      [Markup.button.contactRequest('📱 Telefon raqamni yuborish')]
    ]).resize()
  ).then((message) => {
    messageIds[chatId].push(message.message_id);
  }).catch(err => console.error('Error sending message:', err));

  // Inform the channel about a new user interacting with the bot
  ctx.telegram.sendMessage(channelId, `Yangi foydalanuvchi botga qo'shildi: ${ctx.from.first_name} (@${ctx.from.username || 'no username'})`)
    .catch(err => console.error('Telegram error:', err));
});

// Handle contact
bot.on('contact', (ctx) => {
  const chatId = ctx.chat.id;
  userData[chatId] = userData[chatId] || {};
  userData[chatId].phoneNumber = ctx.message.contact.phone_number;
  messageIds[chatId] = messageIds[chatId] || [];
  messageIds[chatId].push(ctx.message.message_id);

  // Remove keyboard after contact is shared
  ctx.reply('Rahmat! Endi ismingiz va familiyangizni kiriting (masalan, Ali Vali):', Markup.removeKeyboard())
    .then((message) => {
      messageIds[chatId].push(message.message_id);
    }).catch(err => console.error('Error sending message:', err));
});

// Handle text
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
    // Handle unexpected messages after survey completion
    handleUnexpectedMessage(ctx);
  }
});

// Handle button actions for blood type
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

// Handle button actions for Rh factor
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

// Handle button actions for infectious diseases
bot.action(['infectiousDisease_yes', 'infectiousDisease_no'], (ctx) => {
  const chatId = ctx.chat.id;
  userData[chatId].infectiousDisease = ctx.match[0] === 'infectiousDisease_yes';

  // Delete previous messages
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

// Handle unexpected messages
function handleUnexpectedMessage(ctx) {
  const chatId = ctx.chat.id;

  // Notify the admin of the unexpected message
  ctx.telegram.sendMessage(adminChatId, `Kutilmagan xabar: ${ctx.message.text}\nFoydalanuvchi: ${ctx.from.first_name} (@${ctx.from.username || 'no username'})`)
    .catch(err => console.error('Error notifying admin:', err));

  // Inform the user that the survey is already complete
  ctx.reply('So\'rovnoma tugallandi. Yangi xabarlar qabul qilinmaydi.')
    .catch(err => console.error('Error sending message:', err));
}

// Start polling for updates
bot.launch().then(() => {
  console.log('Bot started');
}).catch(err => console.error('Error starting bot:', err));
