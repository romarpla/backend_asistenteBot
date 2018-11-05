const fs = require('fs');
const readline = require('readline');
const {
    google,
} = require('googleapis');
const express = require('express');
const expires = require('expires');

const app = express();

let contenido = {
    vector: [],
    respuestas: []
};
//let vector = [];
let timestamp = expires.after('5 seconds');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH = './creds/token.json';

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listNumbers(auth, cb = null) {
    const sheets = google.sheets({
        version: 'v4',
        auth,
    });
    sheets.spreadsheets.values.get({
            spreadsheetId: '1vNocD3KOtPLMkX7Sp-OZ7OxeOfYcfUn7cNHVz6_5YqY',
            range: 'Sheet1!A2:A',
        },
        (err, res) => {
            if (err) return console.log(`The API returned an error: ${err}`);
            const rows = res.data.values;
            if (rows.length) {
                console.log('Numero');
                // Print columns A and E, which correspond to indices 0 and 4.
                contenido.vector = rows.map(
                    row => `${row[0]}@c.us`,
                    // console.log(`${row[0]}@c.us`);
                    // console.log(`Vector con los datos ${vector}`);
                );
                console.error(contenido.vector);
                if (cb) cb();
            } else {
                console.log('No data found.');
            }
        });
}

function listResponses(auth, cb = null) {
    const sheets = google.sheets({
        version: 'v4',
        auth,
    });
    sheets.spreadsheets.values.get({
            spreadsheetId: '1vNocD3KOtPLMkX7Sp-OZ7OxeOfYcfUn7cNHVz6_5YqY',
            range: 'Sheet1!D2:D',
        },
        (err, res) => {
            if (err) return console.log(`The API returned an error: ${err}`);
            const rows = res.data.values;
            if (rows.length) {
                console.log('Respuestas');
                // Print columns A and E, which correspond to indices 0 and 4.
                contenido.respuestas = rows.map(
                    row => `${row[0]}`,
                    // console.log(`${row[0]}@c.us`);
                    // console.log(`Vector con los datos ${vector}`);
                );
                console.error(contenido.respuestas);
                if (cb) cb();
            } else {
                console.log('No data found.');
            }
        });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (error) => {
                if (error) console.error(error);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, res) {
    const {
        client_secret,
        client_id,
        redirect_uris,
    } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client, res);
    });
}

// Load client secrets from a local file.
function loadNumbers(cb) {
    fs.readFile('./creds/credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Sheets API.
        authorize(JSON.parse(content), listNumbers, () => {
            authorize(JSON.parse(content), listResponses, cb);
        });
    });
}

loadNumbers();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.post('/', (req, res) => {
    if (expires.expired(timestamp)) {
        timestamp = expires.after('5 seconds');
        loadNumbers(() => res.send(contenido));
    } else res.send(contenido);
    console.log('Se ha hecho un post Contenido');
    console.log(contenido);
});

app.listen(3007, () => {
    console.log('Example app listening on port 3007!');
});