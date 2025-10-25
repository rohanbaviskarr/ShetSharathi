const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const cron = require('node-cron');

// Express setup
const app = express();
const port = 3000;

// Twilio credentials (replace with your actual credentials)
const accountSid = 'ACd4e66ee3426473a7aa81fdddd4c24452'; // Your Twilio SID
const authToken = '718ebeef08192661b105511a4143fbd8';   // Your Twilio Auth Token
const twilioPhoneNumber = '+14178042346';              // Your Twilio phone number
const client = new twilio(accountSid, authToken);

// In-memory storage for subscribers with their preferred times, cron jobs, and language
let subscribers = [];

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// SMS messages in different languages
const smsMessages = {
  en: {
    welcome: (time) => `Welcome to Farmer's Marketplace! You’ll receive policy updates daily at ${time}`,
    policy: `
      📢 New Government Policy Update for Farmers:
      The government has introduced a new scheme to provide financial support for farmers affected by climate change.
      Farmers will receive subsidies to adopt drought-resistant crop varieties and modern irrigation techniques.
      Apply now at your local agriculture office or visit the official portal for more details.
      
      Stay updated and make the most of government policies! 🌱
    `
  },
  mr: {
    welcome: (time) => `शेतकऱ्यांचा बाजारात आपले स्वागत आहे! आपल्याला दररोज ${time} वाजता धोरण अद्यतने मिळतील`,
    policy: `
      📢 शेतकऱ्यांसाठी नवीन सरकारी धोरण अद्यतन:
      सरकारने हवामान बदलामुळे प्रभावित शेतकऱ्यांना आर्थिक सहाय्य देण्यासाठी नवीन योजना सुरू केली आहे।
      शेतकऱ्यांना दुष्काळ-प्रतिरोधक पीक प्रकार आणि आधुनिक सिंचन तंत्रे स्वीकारण्यासाठी अनुदान मिळेल।
      आता आपल्या स्थानिक कृषी कार्यालयात अर्ज करा किंवा अधिक माहितीसाठी अधिकृत पोर्टलला भेट द्या।
      
      धोरणांशी अद्ययावत राहा आणि त्याचा जास्तीत जास्त फायदा घ्या! 🌱
    `
  },
  hi: {
    welcome: (time) => `किसानों के बाजार में आपका स्वागत है! आपको प्रतिदिन ${time} बजे नीति अपडेट प्राप्त होंगे`,
    policy: `
      📢 किसानों के लिए नई सरकारी नीति अपडेट:
      सरकार ने जलवायु परिवर्तन से प्रभावित किसानों को वित्तीय सहायता प्रदान करने के लिए एक नई योजना शुरू की है।
      किसानों को सूखा-प्रतिरोधी फसल किस्मों और आधुनिक सिंचाई तकनीकों को अपनाने के लिए सब्सिडी मिलेगी।
      अब अपने स्थानीय कृषि कार्यालय में आवेदन करें या अधिक जानकारी के लिए आधिकारिक पोर्टल पर जाएं।
      
      नीतियों के साथ अपडेट रहें और उनका अधिकतम लाभ उठाएं! 🌱
    `
  }
};

// Function to send SMS to a single subscriber
const sendSmsToSubscriber = async (phoneNumber, language) => {
  const message = smsMessages[language].policy;

  try {
    await client.messages.create({
      body: message,
      to: phoneNumber,
      from: twilioPhoneNumber
    });
    console.log(`Message sent to ${phoneNumber} in ${language}`);
  } catch (error) {
    console.error(`Failed to send message to ${phoneNumber}: ${error.message}`);
  }
};

// Endpoint to subscribe farmers
app.post('/subscribe', async (req, res) => {
  const { phoneNumber, time, language } = req.body;

  // Validate request body
  if (!phoneNumber || !time || !language) {
    return res.status(400).json({ message: 'Phone number, time, and language are required.' });
  }

  // Check if already subscribed
  if (subscribers.some(sub => sub.phoneNumber === phoneNumber)) {
    return res.json({ message: 'You are already subscribed.' });
  }

  // Validate language
  if (!['en', 'mr', 'hi'].includes(language)) {
    return res.status(400).json({ message: 'Invalid language. Use "en", "mr", or "hi".' });
  }

  // Parse the time (e.g., "02:30 PM")
  let cronHours, minutes;
  try {
    const [timePart, period] = time.split(' ');
    [cronHours, minutes] = timePart.split(':');
    cronHours = parseInt(cronHours);
    if (period.toUpperCase() === 'PM' && cronHours !== 12) cronHours += 12; // Convert to 24-hour
    if (period.toUpperCase() === 'AM' && cronHours === 12) cronHours = 0;
  } catch (error) {
    console.error(`Invalid time format for ${phoneNumber}: ${time}`);
    return res.status(400).json({ message: 'Invalid time format. Use HH:MM AM/PM, e.g., 02:30 PM.' });
  }

  // Validate time values
  if (isNaN(cronHours) || cronHours < 0 || cronHours > 23 || isNaN(minutes) || minutes < 0 || minutes > 59) {
    return res.status(400).json({ message: 'Time must be valid (hours 1-12, minutes 00-59, AM/PM).' });
  }

  // Create cron schedule (e.g., "30 14 * * *" for 2:30 PM)
  const cronSchedule = `${minutes} ${cronHours} * * *`;

  // Store subscriber with their schedule and language
  const subscriber = { phoneNumber, time, language, cronSchedule };
  subscribers.push(subscriber);
  console.log('New subscriber:', subscriber);

  // Schedule daily SMS for this subscriber in their language
  cron.schedule(cronSchedule, () => {
    console.log(`Sending policy update to ${phoneNumber} at ${time} in ${language}`);
    sendSmsToSubscriber(phoneNumber, language);
  });

  // Send a welcome SMS immediately to confirm subscription
  try {
    await client.messages.create({
      body: smsMessages[language].welcome(time),
      to: phoneNumber,
      from: twilioPhoneNumber
    });
    console.log(`Welcome SMS sent to ${phoneNumber} in ${language}`);
  } catch (error) {
    console.error(`Failed to send welcome SMS to ${phoneNumber}: ${error.message}`);
  }

  res.json({ message: 'Successfully subscribed!' }); // Consistent success message
});

// Starting the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});