const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const endpoint = process.env.OPENAI_ENDPOINT;
const api_key = process.env.OPENAI_API_KEY;

// Allow cross origin
app.use(cors({
    origin: '*'
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const getSocks = (type, theme) => {
    switch(theme){
        case("SCI-FI"):
            return ("technical SCI-FI themed " + type + " using cool futuristic terms describing it's functionality and looks");
        case("Steampunk"):
            return ("steampunk themed " + type + " incorporating steam techonolgy and cogs. Use a somewhat old english dialect when writing");
        case("Festive"):
            return ("festive " + type + " themed around a holiday or festival. Describe details about the socks and how they corrolate to the given festivity");
        case("Soviet"):
            return ("terrible quality, ironicly bad Soviet themed " + type + " written in a sterotypically bad Soviet dialect.");
    }
    return "pair of normal socks. Describe the socks generic and boring details, or lack therof";
};

const sovietify = (sentence) => {
    // Remove 'the' and 'The' from the sentence
    return sentence.replace(/\b(?:the|The)\b/g, '').trim();
}; 

// Returns true if text contains 4 semicolons ";"
const isCorrectlyFormatted = (text) => {
  const matches = text.match(/;/g);
  return matches && matches.length === 4;
}

app.post('/sockIdea', async (req, res) => {
    // Extracting size and type from the request body
    const { type, theme } = req.body;
    var requests = 0; // How many requests we have sent
    try {
        var openAIResponse = "";

        // As long as we don't get a satisfactory result we will ask for a new response
        while(!isCorrectlyFormatted(openAIResponse) && requests < 3){
            // Increase requests by 1
            console.log("We have requested a sock  " + requests++ + " times");
            
            // Fetch response from OpenAI API
            const response = await axios.post(endpoint, {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are going to give sock ideas structured like this: [Name]; [type of sock]; [theme]; [slogan]; [description] (With the semicolons). The description has to be 3-5 sentences long and reflect on the quality (Terrible quality socks should be ridiculed). Describe the socks in a cool and unique manner!"
                    },
                    {
                        role: "user",
                        content: `Give me a cool sock idea for a ${getSocks(type, theme)}!`
                    }
                ]
            }, {
                headers: {
                    'Authorization': `Bearer ${api_key}`,
                    'Content-Type': 'application/json'
                }
            });
    
            openAIResponse = response.data.choices[0].message.content;
            console.log("Theme:" + theme)
            console.log("Soviet?" + theme=="Soviet")         
            if(theme=="Soviet"){
                res.send(sovietify(openAIResponse));
            } else {
                res.send(openAIResponse);
            }
        }
    } catch (error) {
        console.error("Error calling OpenAI API:", error.response ? error.response.data : error.message);
        res.status(500).send("Failed to retrieve data from OpenAI");
    }
});

app.post('/sockIdea/Image', async (req, res) => {
    const { name, type, description} = req.body;

    try {
        const response = await axios.post(
          'https://api.openai.com/v1/images/generations',
          {
            prompt: type + " socks with the description: " + description,
            n: 1,                                //define the number of images
            size: '256x256',                     //define the resolution of image
          },
          {
            headers: {
                'Authorization': `Bearer ${api_key}`,
                'Content-Type': 'application/json'
            }
          }
        );
    
        const imageUrl = response.data.data[0].url;
        res.send(imageUrl);

    } catch (error) {
        console.error("Error calling DALL·E API:", error.response ? error.response.data : error.message);
        res.status(500).send("Failed to retrieve image from DALL·E");
    }
});
