const { Telegraf, Markup } = require('telegraf');

// Bot tokenini kiriting
const bot = new Telegraf('7040576594:AAG4_8s9DzktAfos4D50WeMiSQTjwUHXQaA');

// Kanal IDsi yoki username
const channelId = '@donorim1999';
// Admin IDsi yoki username
const adminChatId = '@Doctormeeeee';

// Foydalanuvchi ma'lumotlari va xabar IDlarini saqlash uchun obyektlar
let userData = {};
let messageIds = {};

// Start buyrug'i
bot.start((ctx) => {
    const chatId = ctx.chat.id;
    userData[chatId] = {}; // Foydalanuvchi ma'lumotlarini saqlash uchun obyekt
    messageIds[chatId] = []; // Xabar IDlarini saqlash uchun massiv

    ctx.reply('Assalomu alaykum! Tibbiy so\'rovnomaga xush kelibsiz. Iltimos, kontakt ma\'lumotlaringizni yuboring:',
        Markup.keyboard([
            [Markup.button.contactRequest('📱 Telefon raqamni yuborish')]
        ]).resize()
    ).then((message) => {
        messageIds[chatId].push(message.message_id);
    }).catch(err => console.error('Xabar yuborishda xatolik:', err));

    // Kanalga yangi foydalanuvchi haqida xabar yuborish
    ctx.telegram.sendMessage(channelId, `Yangi foydalanuvchi botga qo'shildi: ${ctx.from.first_name} (@${ctx.from.username || 'no username'})`)
        .catch(err => console.error('Telegram xatoligi:', err));
});

// Xatolarni boshqarish
bot.catch((err, ctx) => {
    console.error(`Bot xatosi: ${ctx.updateType}`, err);
    ctx.reply('Xatolik yuz berdi, iltimos, keyinroq qayta urinib ko\'ring.');
});

// Kontaktni boshqarish
bot.on('contact', (ctx) => {
    const chatId = ctx.chat.id;
    userData[chatId] = userData[chatId] || {};
    userData[chatId].phoneNumber = ctx.message.contact.phone_number;
    messageIds[chatId] = messageIds[chatId] || [];
    messageIds[chatId].push(ctx.message.message_id);

    // Kontakt olingandan keyin klaviaturani o'chirish
    ctx.reply('Rahmat! Endi ismingiz va familiyangizni kiriting (masalan, Abdulhamid Haydarov):', Markup.removeKeyboard())
        .then((message) => {
            messageIds[chatId].push(message.message_id);
        }).catch(err => console.error('Xabar yuborishda xatolik:', err));
});

// Matn xabarlarini boshqarish
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
            .catch(err => console.error('Xabar yuborishda xatolik:', err));
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
        }).catch(err => console.error('Xabar yuborishda xatolik:', err));
    } else if (!userData[chatId].region) {
        userData[chatId].region = ctx.message.text;
        ctx.reply('Iltimos, tuman yoki shahar nomini kiriting:', Markup.removeKeyboard())
            .then((message) => {
                messageIds[chatId].push(message.message_id);
            }).catch(err => console.error('Xabar yuborishda xatolik:', err));
    } else if (!userData[chatId].city) {
        userData[chatId].city = ctx.message.text;
        ctx.reply('Bo\'yingizni kiriting (sm):')
            .then((message) => {
                messageIds[chatId].push(message.message_id);
            }).catch(err => console.error('Xabar yuborishda xatolik:', err));
    } else if (!userData[chatId].height && /^[0-9]+$/.test(ctx.message.text)) {
        userData[chatId].height = ctx.message.text;
        ctx.reply('Vazningizni kiriting (kg):')
            .then((message) => {
                messageIds[chatId].push(message.message_id);
            }).catch(err => console.error('Xabar yuborishda xatolik:', err));
    } else if (!userData[chatId].weight && /^[0-9]+$/.test(ctx.message.text)) {
        userData[chatId].weight = ctx.message.text;
        ctx.reply('Qon guruhiingizni tanlang:',
            Markup.inlineKeyboard([
                [Markup.button.callback('O(I)', 'bloodType_O')],
                [Markup.button.callback('A(II)', 'bloodType_A')],
                [Markup.button.callback('B(III)', 'bloodType_B')],
                [Markup.button.callback('AB(IV)', 'bloodType_AB')],
                [Markup.button.callback('Bilmayman', 'bloodType_bilmaydi')]
            ])
        ).then((message) => {
            messageIds[chatId].push(message.message_id);
        }).catch(err => console.error('Xabar yuborishda xatolik:', err));
    } else {
        // Kutilmagan xabarlarni boshqarish
        handleUnexpectedMessage(ctx);
    }
});

// Qon guruhi tugmalari uchun harakatlarni boshqarish
bot.action(['bloodType_O', 'bloodType_A', 'bloodType_B', 'bloodType_AB', 'bloodType_bilmaydi'], (ctx) => {
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
    }).catch(err => console.error('Xabar yuborishda xatolik:', err));
    ctx.answerCbQuery();
});

// Rezus omili tugmalari uchun harakatlarni boshqarish
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
            [Markup.button.callback('Bor', 'infectiousDisease_yes')],
            [Markup.button.callback('Yo\'q', 'infectiousDisease_no')]
        ])
    ).then((message) => {
        messageIds[chatId].push(message.message_id);
    }).catch(err => console.error('Xabar yuborishda xatolik:', err));
    ctx.answerCbQuery();
});

// Yuqumli kasalliklar tugmalari uchun harakatlarni boshqarish
bot.action(['infectiousDisease_yes', 'infectiousDisease_no'], (ctx) => {
    const chatId = ctx.chat.id;
    userData[chatId].infectiousDisease = ctx.match[0] === 'infectiousDisease_yes';

    ctx.reply('So\'rovnomani tugatish uchun tugmani bosing:',
        Markup.inlineKeyboard([
            [Markup.button.callback('So\'rovnomani tugatish', 'complete_survey')]
        ])
    ).then((message) => {
        messageIds[chatId].push(message.message_id);
    }).catch(err => console.error('Xabar yuborishda xatolik:', err));
    ctx.answerCbQuery();
});

// So'rovnomani tugatish
bot.action('complete_survey', (ctx) => {
    const chatId = ctx.chat.id;
    const userInfo = `
Ism: ${userData[chatId].name}
Familiya: ${userData[chatId].surname}
Telefon raqami: ${userData[chatId].phoneNumber}
Tug'ilgan sanasi: ${userData[chatId].birthDate}
Hudud: ${userData[chatId].region}
Shahar/tuman: ${userData[chatId].city}
Bo'yi: ${userData[chatId].height} sm
Vazni: ${userData[chatId].weight} kg
Qon guruhi: ${userData[chatId].bloodType}
Rezus omili: ${userData[chatId].rhFactor}
Yuqumli kasalliklar: ${userData[chatId].infectiousDisease ? 'Bor' : 'Yo\'q'}
    `;

    // Kanalga xabar yuborish
    ctx.telegram.sendMessage(channelId, userInfo)
        .catch(err => console.error('Telegram xatoligi:', err));

    // Foydalanuvchiga natija va link yuborish
    ctx.reply(userInfo, Markup.inlineKeyboard([
        [Markup.button.url('Ko\'proq ma\'lumot', 'https://t.me/volunteer_uzbasmi')]
    ]))
        .catch(err => console.error('Xabar yuborishda xatolik:', err));

    // So'rovnoma tugadi
    ctx.reply('So\'rovnoma tugallandi! Sizga rahmat!')
        .catch(err => console.error('Xabar yuborishda xatolik:', err));

    ctx.answerCbQuery();
});

// Kutilmagan xabarlarni boshqarish funksiyasi
function handleUnexpectedMessage(ctx) {
    const chatId = ctx.chat.id;
    const message = ctx.message.text;

    ctx.telegram.sendMessage(adminChatId, `Kutilmagan xabar:\nFoydalanuvchi: ${ctx.from.first_name} ${ctx.from.last_name}\nUsername: @${ctx.from.username}\nXabar: ${message}`)
        .catch(err => console.error('Admin ga xabar yuborishda xatolik:', err));

    ctx.reply('Iltimos, ko\'rsatmalarga rioya qiling yoki yordam uchun admin bilan bog\'laning.')
        .catch(err => console.error('Xabar yuborishda xatolik:', err));
}

// Botni ishga tushirish
bot.launch()
    .then(() => console.log('Bot ishga tushirildi'))
    .catch(err => console.error('Botni ishga tushirishda xatolik:', err));
