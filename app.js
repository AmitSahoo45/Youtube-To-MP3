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

const getVideoId = (input) => {
    if (!input) return '';
    const value = input.trim();

    try {
        const parsed = new URL(value);
        const hostname = parsed.hostname.toLowerCase();

        if (hostname === 'youtu.be' || hostname.endsWith('.youtu.be')) {
            return parsed.pathname.replace(/^\/+/, '');
        }

        if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
            const fromQuery = parsed.searchParams.get('v');
            if (fromQuery) return fromQuery;
        }
    } catch (error) {
        return value;
    }

    return value;
}

const convertYoutube = async (req, res, format = 'mp3') => {
    const videoID = getVideoId(req.body.videoID);
    if (!videoID) {
        return res.render('index', { success: false, message: 'Please enter a video ID' });
    }

    const isMp4 = format === 'mp4';
    const endpoint = isMp4
        ? (process.env.MP4_API_URL || 'https://youtube-mp36.p.rapidapi.com/dlmp4?id=')
        : 'https://youtube-mp36.p.rapidapi.com/dl?id=';
    const host = isMp4
        ? (process.env.MP4_API_HOST || process.env.API_HOST)
        : process.env.API_HOST;

    try {
        const apiResponse = await fetch(`${endpoint}${encodeURIComponent(videoID)}`, {
            'method': 'GET',
            'headers': {
                'x-rapidapi-key': process.env.API_KEY,
                'x-rapidapi-host': host
            }
        });

        const fetchResponse = await apiResponse.json();

        if (fetchResponse.status === 'ok') {
            return res.render('index', { success: true, song_title: fetchResponse.title, song_link: fetchResponse.link });
        }

        return res.render('index', { success: false, song_title: fetchResponse.title, message: fetchResponse.msg });
    } catch (error) {
        return res.render('index', { success: false, message: 'Unable to convert this video right now. Please try again.' });
    }
}

app.post('/convert-mp3', (req, res) => convertYoutube(req, res, 'mp3'));
app.post('/convert-mp4', (req, res) => convertYoutube(req, res, 'mp4'));

// starting the server
app.listen(PORT, () => {
    console.log('Server on port 3000')
});
