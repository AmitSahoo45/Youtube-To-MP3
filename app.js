// required packages
const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

// creating the express server
const app = express();

// server port number
const PORT = process.env.PORT || 3000;

// set template engine
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use('/assets', express.static("public"))

// needed to parse html data POST request
app.use(express.urlencoded({
    extended: true
}))
app.use(express.json());

app.get('/', (req, res) => {
    res.render('index');
})

const convertYoutube = async (req, res) => {
    const videoID = req.body.videoID ? req.body.videoID.trim() : '';
    if (!videoID) {
        return res.render('index', { success: false, message: 'Please enter a video ID' });
    }

    try {
        const fetchAPI = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${encodeURIComponent(videoID)}`, {
            'method': 'GET',
            'headers': {
                'x-rapidapi-key': process.env.API_KEY,
                'x-rapidapi-host': process.env.API_HOST
            }
        });

        const fetchResponse = await fetchAPI.json();

        if (fetchResponse.status === 'ok') {
            return res.render('index', { success: true, song_title: fetchResponse.title, song_link: fetchResponse.link });
        }

        return res.render('index', { success: false, song_title: fetchResponse.title, message: fetchResponse.msg });
    } catch (error) {
        return res.render('index', { success: false, message: 'Unable to convert this video right now. Please try again.' });
    }
}

app.post('/convert-mp3', convertYoutube);
app.post('/convert-mp4', convertYoutube);

// starting the server
app.listen(PORT, () => {
    console.log('Server on port 3000')
});
