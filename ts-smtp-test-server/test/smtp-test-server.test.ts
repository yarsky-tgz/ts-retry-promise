import {expect} from "chai";
import "mocha";
import {createTransport} from "nodemailer";
import * as Mail from "nodemailer/lib/mailer";
import * as SMTPConnection from "nodemailer/lib/smtp-connection";
import {SmtpServerConfig, SmtpTestServer} from "../src/smtp-test-server";

describe("SMTP Test server", () => {

    describe("with runnning server", () => {

        const server = new SmtpTestServer();

        before(async () => {
            await server.start();
        });

        beforeEach(() => {
            server.clear();
        });

        after(async () => {
            await server.shutdown();
        });

        it("can receive mail", async () => {
            await sendMail(server.config, {
                attachments: [{content: "text attachment"}],
                from: "me@me.de",
                html: "some html",
                text: "some text",
                to: "to@me.de",
            });

            expect(server.messages).length(1);

            const mail = server.messages[0];
            expect(mail.from.text).to.eq("me@me.de");
            expect(mail.to.text).to.eq("to@me.de");
            expect(mail.text).to.eq("some text");
            expect(mail.html).to.eq("some html");
            expect(mail.attachments).length(1);
        });

        it("can wait for mails", async () => {
            setTimeout(() =>
                sendMail(server.config, {
                        text: "1",
                        to: "to@me.de",
                    },
                ), 50);

            setTimeout(() =>
                sendMail(server.config, {
                        text: "2",
                        to: "to@me.de",
                    },
                ), 100);

            const messages = await server.waitForMessages(2);

            expect(messages).length(2);
            expect(messages[0].text).to.contain("1");
            expect(messages[1].text).to.contain("2");
        });

    });

    it("can configure authentication", async () => {
        const server = await new SmtpTestServer(
            {port: 2026, authentication: (user, pass) => user === "the only one"},
        ).start();

        try {
            await expectError(sendMail(server.config, {}));

            await sendMail(server.config, {}, {user: "the only one", pass: "pass"});
            expect(server.messages).length(1);

        } finally {
            await server.shutdown();
        }
    });

});

async function sendMail(config: SmtpServerConfig,
                        mailOptions: Mail.Options,
                        creds: SMTPConnection.Credentials = {user: "user", pass: "pass"}) {

    const transporter = createTransport({
        auth: creds,
        host: config.host,
        port: config.port,
        secure: config.secure, // true for 465, false for other ports
        tls: {
            rejectUnauthorized: false,
        },
    });

    const defaultOptions: Mail.Options = {
        from: '"Fred Foo 👻" <foo@example.com>',
        subject: "Hello ✔",
        text: "Hello world?",
        to: "bar@example.com, baz@example.com",
    };

    // send mail with defined transport object
    await transporter.sendMail(Object.assign({}, defaultOptions, mailOptions));
}

async function expectError<T>(p: Promise<T>): Promise<Error> {
    let result: any;
    try {
        result = await p;
    } catch (error) {
        return error;
    }
    throw Error("Expected error, but got " + result);
}
