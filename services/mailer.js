let mailer  = require('nodemailer'),
    utils   = require('../helpers/utils'),
    {check} = require('../helpers/validator'),
    log     = require('../helpers/logger'),
    parse   = require('./parsers/instagram'); // using a parser until I switch to their api.

class MailerService {
    constructor(props) {
        this.storage  = {};
        this.settings = {
            smtpHost: "smtp.gmail.com",
            smtpPort: 465,
            messageSubject: "NinjaFit Site Message from {firstname} {lastname}",
            messageContent: "New Message sent to NinjaFit Site\n\nFirst Name: {firstname}\n\nLast Name: {lastname}\n\nEmail: {email}\n\nMessage Content:\n{content}"

            // "toAddress":    "ninjafitgyms@gmail.com",
            // "toAddressCC":  "raidenkaneda@gmail.com"
        };

        utils.extend(this.settings, props, true);

        // TODO: validation

        this.setupMailer();        
    } 

    setupMailer() {
        this.mailer = mailer.createTransport({

            host:             this.settings.smtpHost,
            port:             this.settings.smtpPort,
            secureConnection: true,
            transportMethod:  'SMTP',
            auth: {
                user: this.settings.fromAddress,
                pass: this.settings.fromPassword
            }
        });
    }

    send (message) {
        return new Promise((resolve, reject) => {

            try {

                let invalid = (field, msg) => resolve({ isValid: false, message: msg, target: field }),
                    valid   =         msg  => resolve({ isValid: true,  message: msg });

                if (!check(message)          .isObject().notNull ()             .isValid) { return invalid("firstName", "There was a problem sending your message!"); }
                if (!check(message.firstName).isString().notEmpty()             .isValid) { return invalid("firstName", "Please enter a first name."); }
                if (!check(message.firstName).len(this.settings.firstNameLength).isValid) { return invalid("firstName", `First name must be at least ${this.settings.firstNameLength} characters.`); }
                if (!check(message.lastName) .isString().notEmpty()             .isValid) { return invalid("lastName", "Please enter a last name."); }
                if (!check(message.lastName) .len(this.settings.lastNameLength) .isValid) { return invalid("lastName", `Last name must be at least ${this.settings.firstNameLength} characters.`); }
                if (!check(message.email)    .isString().notEmpty()             .isValid) { return invalid("email",    "Please enter an email address."); }
                if (!check(message.email)    .isEmail ()                        .isValid) { return invalid("email",   `Please enter a valid email address.`); }
                if (!check(message.content)  .isString().notEmpty()             .isValid) { return invalid("content", "Please enter message content."); }
                if (!check(message.content)  .len(this.settings.contentLength)  .isValid) { return invalid("content", `Message content must be at least ${this.settings.firstNameLength} characters.`); }
                
                let content = this.settings.messageContent
                    .split('{firstname}').join(message.firstName)
                    .split('{lastname}') .join(message.lastName)
                    .split('{email}')    .join(message.email)
                    .split('{content}')  .join(message.content);

                let subject = this.settings.messageSubject
                    .split('{firstname}').join(message.firstName)
                    .split('{lastname}') .join(message.lastName);

                let params = {
                    from:    this.settings.fromAddress,
                    subject: subject,
                    text:    content
                };

                utils.foreach(message.to || this.settings.toAddress, async recipient => {
                    params.to = recipient;

                    await this.mailer.sendMail(params);
                });

                return valid();
            }
            catch (e) { reject(e); }
        });
    }
}

const service = new MailerService((require('../settings.json') || {}).mailer);
Object.freeze(service);

module.exports = { 
    send: service.send.bind(service)
};