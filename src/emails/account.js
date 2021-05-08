
const mailGun = require("mailgun-js");



const DOMAIN = process.env.DOMAIN
const apiKey = process.env.MAILGUN_API_KEY

const mg = mailGun({apiKey: apiKey, domain: DOMAIN});

// const data = {
//     from: 'اصغر <asgare@gmail.com>',
//     to: 'asgare@gmail.com',
//     subject: 'اصغر افتخاري',
//     text: 'Testing some Mailgun awesomeness!1'
// };
// mg.messages().send(data, function (error, body) {
// 	console.log(body);
// 	console.log(error);

// });


const sendWelcomeEmail = async ( email , name ) =>{

    const data = {
        from: 'اصغر <asgare@gmail.com>',
        to: email,
        subject: 'اصغر افتخاري',
        text: `Dear ${name} welcome to Task App.`
    }

    return await mg.messages().send(data)
    
}


const sendLoginEmail = async ( email , name ) =>{

    const data = {
        from: 'اصغر <asgare@gmail.com>',
        to: email,
        subject: 'اصغر افتخاري',
        text: `Dear ${name}, /n Login detected at ${new Date()}.`
    }

    return await mg.messages().send(data)
    
}

module.exports = {
    sendWelcomeEmail,
    sendLoginEmail
}

 