const { Telegraf, Markup } = require('telegraf');

// Set your bot token
const bot = new Telegraf('7040576594:AAG4_8s9DzktAfos4D50WeMiSQTjwUHXQaA');

// Set the channel's username or ID
const channelId = '@donorim1999';
// Replace with a known user ID who has started a conversation with the bot
const adminChatId = '@Doctormeeeee';

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

// Error handling middleware
bot.catch((err, ctx) => {
  console.error(`Bot error for ${ctx.updateType}`, err);
  ctx.reply('Xatolik yuz berdi, iltimos, keyinroq qayta urinib ko\'ring.');
});

// Handle contact
bot.on('contact', (ctx) => {
  const chatId = ctx.chat.id;
  userData[chatId] = userData[chatId] || {};
  userData[chatId].phoneNumber = ctx.message.contact.phone_number;
  messageIds[chatId] = messageIds[chatId] || [];
  messageIds[chatId].push(ctx.message.message_id);

  // Remove keyboard after contact is shared
  ctx.reply('Rahmat! Endi ismingiz va familiyangizni kiriting (masalan, Abdulhamid Haydarov):', Markup.removeKeyboard())
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
    userData[chatId].name = name;
    userData[chatId].surname = surname || '';

    ctx.reply('Iltimos, tugilgan sanangizni kiriting (kun-oy-yil formatida, masalan, 01-01-2000):')
      .catch(err => console.error('Error sending message:', err));
  } else if (!userData[chatId].birthDate) {
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
  } else if (!userData[chatId].height && /^[0-9]+$/.test(ctx.message.text)) {
    userData[chatId].height = ctx.message.text;
    ctx.reply('Vazningizni kiriting (kg):')
      .then((message) => {
        messageIds[chatId].push(message.message_id);
      }).catch(err => console.error('Error sending message:', err));
  } else if (!userData[chatId].weight && /^[0-9]+$/.test(ctx.message.text)) {
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
    // Handle unexpected messages
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
  if (messageIds[chatId] && messageIds[chatId].length > 0) {
    messageIds[chatId].forEach(msgId => {
      ctx.telegram.deleteMessage(ctx.chat.id, msgId)
        .catch(err => console.error('Error deleting message:', err));
    });
  }

  // Send user information to the channel
  const userInfo =
    `Sizning ma'lumotlaringiz:\n` +
    `Ism: ${userData[chatId].name}\n` +
    `Familiya: ${userData[chatId].surname}\n` +
    `Telefon raqami: ${userData[chatId].phoneNumber}\n` +
    `Tugilgan sana: ${userData[chatId].birthDate}\n` +
    `Manzil: ${userData[chatId].region}, ${userData[chatId].city}\n` +
    `Bo'yi: ${userData[chatId].height} sm\n` +
    `Vazni: ${userData[chatId].weight} kg\n` +
    `Qon guruhi: ${userData[chatId].bloodType} (${userData[chatId].rhFactor})\n` +
    `Yuqumli kasalliklar: ${userData[chatId].infectiousDisease ? 'Ha' : 'Yo\'q'}`;

  ctx.telegram.sendMessage(channelId, userInfo)
    .then((message) => {
      messageIds[chatId].push(message.message_id); // Store the message ID
    }).catch(err => console.error('Telegram error:', err));

  // Respond to the user with the information and a button with a URL
  const infoMessage = userInfo + '\n\nKo\'proq ma\'lumot uchun quyidagi tugmani bosing:';
  ctx.replyWithMarkdown(infoMessage, 
    Markup.inlineKeyboard([
      [Markup.button.url('Ma\'lumot olish', 'https://t.me/volunteer_uzbasmi')]
    ])
  ).then(() => {
    ctx.reply('So\'rovnoma tugadi. Agar qo\'shimcha savollaringiz bo\'lsa, admin bilan bog\'laning.')
      .catch(err => console.error('Error sending completion message:', err));
  }).catch(err => console.error('Error sending final message:', err));

  ctx.answerCbQuery();
});

// Handle media and unexpected messages
const handleUnexpectedMessage = (ctx) => {
  const chatId = ctx.chat.id;
  ctx.reply(`Notog'ri harakat qilindi. Iltimos, muammoni hal qilish uchun admin bilan bog'laning.`);

  // Notify the admin about the unexpected message
  const adminMessage = `Foydalanuvchi ${ctx.from.first_name} (@${ctx.from.username || 'no username'}) noto'g'ri xabar yubordi: ${ctx.message.text || 'media/content'}`;
  
  ctx.telegram.sendMessage(adminChatId, adminMessage)
    .catch(err => {
      console.error('Error notifying admin:', err);
      ctx.telegram.sendMessage(chatId, 'Admin bilan bog‘lanishda xatolik yuz berdi.')
        .catch(console.error);
    });
};

bot.on('photo', handleUnexpectedMessage);
bot.on('video', handleUnexpectedMessage);
bot.on('voice', handleUnexpectedMessage);
bot.on('document', handleUnexpectedMessage);
bot.on('sticker', handleUnexpectedMessage);
bot.on('location', handleUnexpectedMessage);
bot.on('contact', handleUnexpectedMessage);

// Start the bot
bot.launch().then(() => console.log('Bot ishga tushdi...'))
  .catch(err => console.error('Botni ishga tushirishda xatolik:', err));

