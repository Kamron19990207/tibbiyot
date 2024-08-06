const { Telegraf, Markup } = require('telegraf');

// Set your bot token
const bot = new Telegraf('7040576594:AAG4_8s9DzktAfos4D50WeMiSQTjwUHXQaA');

// Set the channel's username or ID
const channelId = '@donor_volontyor_bot';
const adminId = '@Doctormeeeee'; // Replace with your admin chat ID

// Object to store user data
let userData = {};

// Start command
bot.start((ctx) => {
  const chatId = ctx.chat.id;
  userData[chatId] = {}; // Create an empty object to store user data
  ctx.reply('Assalomu alaykum! Tibbiy so\'rovnomaga xush kelibsiz. Iltimos, kontakt ma\'lumotlaringizni yuboring:',
    Markup.keyboard([
      [Markup.button.contactRequest('📱 Telefon raqamni yuborish')]
    ]).resize()
  );

  // Inform the channel about a new user interacting with the bot
  ctx.telegram.sendMessage(channelId, `Yangi foydalanuvchi botga qo'shildi: ${ctx.from.first_name} (@${ctx.from.username || 'no username'})`)
    .catch(err => console.error('Telegram error:', err)); // Log error if any
});

// When a contact is sent
bot.on('contact', (ctx) => {
  const chatId = ctx.chat.id;
  userData[chatId] = userData[chatId] || {}; // Ensure userData[chatId] exists
  userData[chatId].phoneNumber = ctx.message.contact.phone_number;

  // Remove keyboard after contact is shared
  ctx.reply('Rahmat! Endi ismingiz va familiyangizni kiriting (masalan, Ali Vali):', Markup.removeKeyboard());
});

// When a text message is received
bot.on('text', (ctx) => {
  const chatId = ctx.chat.id;
  userData[chatId] = userData[chatId] || {}; // Ensure userData[chatId] exists

  // Get name and surname
  if (!userData[chatId].name) {
    const [name, surname] = ctx.message.text.split(' ');
    userData[chatId].name = name;
    userData[chatId].surname = surname || '';

    ctx.reply('Iltimos, tugilgan sanangizni kiriting (kun-oy-yil formatida, masalan, 01-01-2000):');
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
        // Other regions can be added here
      ]).resize()
    );
  } else if (!userData[chatId].region) {
    if (!['Toshkent', 'Samarqand', 'Andijon', 'Farg‘ona', 'Qashqadaryo', 'Surxondaryo', 'Namangan', 'Buxoro', 'Jizzax', 'Sirdaryo', 'Xorazm', 'Navoiy', 'Qoraqolpogiston', 'Toshkent Shahri'].includes(ctx.message.text)) {
      ctx.reply('Iltimos, to\'g\'ri viloyatni tanlang.');
    } else {
      userData[chatId].region = ctx.message.text;
      ctx.reply('Iltimos, tuman yoki shahar nomini kiriting:');
    }
  } else if (!userData[chatId].city) {
    userData[chatId].city = ctx.message.text;
    ctx.reply('Bo\'yingizni kiriting (sm):');
  } else if (!userData[chatId].height) {
    if (!/^\d+$/.test(ctx.message.text)) {
      ctx.reply('Iltimos, bo\'yingizni faqat raqamda kiriting (sm):');
    } else {
      userData[chatId].height = ctx.message.text;
      ctx.reply('Vazningizni kiriting (kg):');
    }
  } else if (!userData[chatId].weight) {
    if (!/^\d+$/.test(ctx.message.text)) {
      ctx.reply('Iltimos, vazningizni faqat raqamda kiriting (kg):');
    } else {
      userData[chatId].weight = ctx.message.text;
      ctx.reply('Qon guruhiingizni tanlang:',
        Markup.inlineKeyboard([
          [Markup.button.callback('Musbat', 'bloodType_positive')],
          [Markup.button.callback('Manfiy', 'bloodType_negative')],
          [Markup.button.callback('Bilmayman', 'bloodType_unknown')]
        ])
      );
    }
  }
});

// Capture blood type buttons
bot.action(['bloodType_positive', 'bloodType_negative', 'bloodType_unknown'], (ctx) => {
  const chatId = ctx.chat.id;
  userData[chatId] = userData[chatId] || {}; // Ensure userData[chatId] exists
  const bloodType = ctx.match[0].split('_')[1];
  userData[chatId].bloodType = bloodType === 'unknown' ? 'Bilmayman' : bloodType === 'positive' ? 'Musbat' : 'Manfiy';
  ctx.reply('Sizda yuqumli kasalliklar bormi?',
    Markup.inlineKeyboard([
      [Markup.button.callback('Ha', 'infectiousDisease_yes')],
      [Markup.button.callback('Yo\'q', 'infectiousDisease_no')]
    ])
  );
  ctx.answerCbQuery();
});

// Capture infectious disease buttons
bot.action(['infectiousDisease_yes', 'infectiousDisease_no'], (ctx) => {
  const chatId = ctx.chat.id;
  userData[chatId] = userData[chatId] || {}; // Ensure userData[chatId] exists
  userData[chatId].infectiousDisease = ctx.match[0] === 'infectiousDisease_yes';

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
    `Qon guruhi: ${userData[chatId].bloodType}\n` +
    `Yuqumli kasalliklar: ${userData[chatId].infectiousDisease ? 'Ha' : 'Yo\'q'}`;

  ctx.telegram.sendMessage(channelId, userInfo)
    .catch(err => console.error('Telegram error:', err)); // Log error if any

  // Respond to the user with the information and a button with a URL
  const infoMessage = userInfo + '\n\nKo\'proq ma\'lumot uchun quyidagi tugmani bosing:';
  ctx.replyWithMarkdown(infoMessage, 
    Markup.inlineKeyboard([
      [Markup.button.url('Ma\'lumot olish', 'https://example.com')]
    ])
  );

  ctx.answerCbQuery();
});

// Handle unexpected messages
bot.on('text', (ctx) => {
  const chatId = ctx.chat.id;
  if (!userData[chatId] || !userData[chatId].name) {
    ctx.reply('Iltimos, avvalgi so\'rovnomani to\'ldiring.');
  } else {
    ctx.reply('Notog\'ri harakat qilindi. Iltimos, muammoni hal qilish uchun admin bilan bog\'laning.');
    ctx.telegram.sendMessage(adminId, `Foydalanuvchi (${ctx.from.first_name} @${ctx.from.username || 'no username'}) xato xabar yubordi: ${ctx.message.text}`)
      .catch(err => console.error('Telegram error:', err)); // Log error if any
  }
});

// Handle unexpected voice messages
bot.on('voice', (ctx) => {
  ctx.reply('Ovozli xabarlar qabul qilinmaydi. Iltimos, matnli xabar yuboring yoki admin bilan bog\'laning.');
});

// Handle unexpected photos
bot.on('photo', (ctx) => {
  ctx.reply('Rasm yuborish qabul qilinmaydi. Iltimos, matnli xabar yuboring yoki admin bilan bog\'laning.');
});

// Start the bot
bot.launch().then(() => console.log('Bot ishga tushdi...'))
  .catch(err => console.error('Botni ishga tushirishda xatolik:', err)); // Log error if any
