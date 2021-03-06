console.log('Loading function');

const aws = require('aws-sdk');
const simpleParser = require('mailparser').simpleParser;
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const sesout = new aws.SES({region: 'us-west-2'});
let nodemailer = require('nodemailer');
let transporter = nodemailer.createTransport({
    SES: new aws.SES({
        apiVersion: '2010-12-01'
    })
});

module.exports.email = async event => {
  //console.log('Received event:', JSON.stringify(event, null, 2));
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
  const params = {
      Bucket: bucket,
      Key: key,
  };
  try {
      const data = await s3.getObject(params).promise();
      //console.log('raw email:' + data.Body);
      const email = await simpleParser(data.Body);
      console.log('date:', email.date);
      console.log('subject:', email.subject);
      console.log('body:', email.text);
      console.log('from:', email.from.text);
      console.log('attachments:', email.attachments);

      const sendit = await transporter.sendMail({
        from: "craig@craiggunson.com",
        to: process.env.privateaddress,
        replyTo: email.from.text,
        subject: email.subject,
        text: email.text,
        attachments: email.attachments
         
        
    });
        console.log(sendit.envelope);
        console.log(sendit.messageId);
    
      return { status: 'success' };

  } catch (err) {
      console.log(err);
      const message = `Dude, either failed getting object ${key} from bucket ${bucket}... or failed to send it.  Check role and env var privateaddress`;
      console.log(message);
      throw new Error(message);
  }
};
