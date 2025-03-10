const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const { crmConfig } = require('./config.js');
const { Client } = require('pg');
const CryptoJs = require('crypto-js');
require('dotenv').config();

const app = express();
const server = createServer(app);

const io = new Server(server, {
    maxHttpBufferSize: 1e8,
    cors: {
        origin: "https://dhruvbhikadiya.github.io'",
    }
});

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

function binaryToString(binaryStr) {
    return binaryStr.split(' ').map(bin => {
        const asciiValue = parseInt(bin, 2);

        return String.fromCharCode(asciiValue);
    }).join('');
};

function stringToBinary(str) {
    return str.split('')
        .map(char => {
            const binary = char.charCodeAt(0).toString(2);
            return binary.padStart(8, '0');
        })
        .join(' ');
};

const binaryEvent = (event) => {
    return event.split('').map(char => {
        const asciiValue = char.charCodeAt(0);
        const binaryValue = asciiValue.toString(2);
        return binaryValue.padStart(8, '0');
    }).join(' ');
};

var partners = {};

var users = {};

io.on('connection', (socket) => {
    const sendUserData = (users, partners, partnerKey) => {
        let allUser = [];
        if (users?.[partnerKey]) {
            allUser = [...allUser, ...Object.keys(users[partnerKey])].toString()
        }
        else {
            allUser = allUser.toString();
        }

        if (partners && partners[partnerKey] && Object.keys(partners[partnerKey]).length) {
            let partnerUser = Object.keys(partners[partnerKey])
            for (let i = 0; i < partnerUser.length; i++) {
                console.log(partners[partnerKey][partnerUser[i]]);
                io.to(partners[partnerKey][partnerUser[i]]).emit('userData', stringToBinary(allUser));
            }
        }
    }

    // USER JOINED EVENT
    const userJoined = binaryEvent('userJoined');
    socket.on(userJoined, async (data) => {
        const jsonstring = binaryToString(data);
        const obj = JSON.parse(jsonstring);

        console.log('userJoined', obj.socketId);

        if (!users[obj.partnerKey]) {
            users[obj.partnerKey] = {};
        }

        users[obj.partnerKey][obj.userId] = obj.socketId;

        sendUserData(users, partners, obj.partnerKey);

    });

    // PARTNER JOINED EVENT
    const partnerJoined = binaryEvent('partnerJoined');
    socket.on(partnerJoined, async (data) => {
        const jsonstring = binaryToString(data);
        const obj = JSON.parse(jsonstring);

        if (!partners[obj.partnerKey]) {
            partners[obj.partnerKey] = {};
        }

        partners[obj.partnerKey][obj.userId] = obj.socketId;

        let allUser = [];
        if (users?.[obj.partnerKey]) {
            allUser = [...allUser, ...Object.keys(users[obj.partnerKey])].toString()
        }
        else {
            allUser = allUser.toString();
        }

        io.to(obj.socketId).emit('userData', stringToBinary(allUser));
    });

    // SCREEN-SHOT EVENT CALLED FROM PARTNER
    const userClicked = binaryEvent('userClicked');
    socket.on(userClicked, (data) => {
        const stringData = binaryToString(data);
        const parsedData = JSON.parse(stringData);
        const userSocketId = users[parsedData.partnerKey][parsedData.id];
        socket.to(userSocketId).emit(userClicked);
    });

    // SCREEN-SHOT SEND FROM USER
    const sentDataChunk = binaryEvent('sentDataChunk');
    socket.on(sentDataChunk, (chunk, index, totalChunk, partnerKey) => {
        const partnerkey = binaryToString(partnerKey);
        const partnerSocketId = partners[partnerkey];
        const sendChunkData = binaryEvent('sendChunkData');
        let obj = { chunk: chunk, index: index, totalChunk: totalChunk };
        socket.to(partnerSocketId).emit(sendChunkData, obj);
    });

    // SCREEN SHARING START
    const request_screen_share = binaryEvent('request_screen_share');
    socket.on(request_screen_share, (data) => {
        const stringData = binaryToString(data);
        const parsedData = JSON.parse(stringData);
        const userSocketId = users[parsedData.partnerKey][parsedData.id];
        const start_screen_share = binaryEvent('start_screen_share');
        console.log(users[parsedData.partnerKey][parsedData.id], '-- userSocketId --');
        socket.to(userSocketId).emit(start_screen_share, stringToBinary(JSON.stringify({ peerId: parsedData.peerId, userId: parsedData.userId })));
    });

    const stoppedScreenSharing = binaryEvent('stoppedScreenSharing');
    socket.on(stoppedScreenSharing, (stopedData) => {
        const { partnerKey, userId } = JSON.parse(binaryToString(stopedData));
        const partnerSocket = partners[partnerKey][userId];

        socket.to(partnerSocket).emit(stoppedScreenSharing);
    });
    // SCREEN SHARING END

    // NOTIFICATION START
    const sendNotification = binaryEvent('sendNotification');
    socket.on(sendNotification, (data) => {
        const obj = binaryToString(data);

        const parsedData = JSON.parse(obj);

        const jsonString = JSON.stringify(parsedData);

        const binaryData = stringToBinary(jsonString);

        const sendNotification = binaryEvent('sendNotification');
        console.log('parsedData -->', parsedData);

        parsedData.id.forEach(element => {
            const userSocketId = users[parsedData.partnerKey][parsedData.id];
            socket.to(userSocketId).emit(sendNotification, (binaryData));
        });
    });
    // NOTIFICATION END

    const DecryptData = async (data) => {
        if (data) {
            data = decodeURIComponent(data);
            var key = CryptoJs.enc.Utf8.parse("acg7ay8h447825cg");
            var iv = CryptoJs.enc.Utf8.parse("8080808080808080");
            var DecryptedSession = CryptoJs.AES.decrypt(data, key, {
                keySize: 128 / 8,
                iv: iv,
                mode: CryptoJs.mode.CBC,
                padding: CryptoJs.pad.Pkcs7,
            }).toString(CryptoJs.enc.Utf8);
            return DecryptedSession;
        } else {
            return "";
        }
    };

    const sendUserSubscription = binaryEvent('sendUserSubscription');
    socket.on(sendUserSubscription, async (partnerKey, userName, endpoint, expirationTime, subscription) => {
        let connection = new Client(crmConfig);
        try {
            await connection.connect();
            if (!partnerKey) return res.status(401).json({ code: -1, message: "Please set header in partnerkey..!" });
            const token = binaryToString(partnerKey);
            const decryptToken = await DecryptData(token);
            const [partnerid, name, secret_key] = decryptToken.split(":");
            const schemaName = `partner_${partnerid}_${name.trim().replace(/\s+/g, "_").toLowerCase()}`;

            const keys = subscription.keys;
            const username = binaryToString(userName);
            const params = [schemaName, username, JSON.parse(binaryToString(endpoint)), JSON.parse(binaryToString(expirationTime)), keys];
            await connection.query(`select public.insert_user_subscription($1,$2,$3,$4,$5)`, params);
        } catch (e) {
            console.log(e);
        }
        finally {
            await connection.end();
        }
    });

    function deleteSocketId(socketId, ...objects) {
        let found = false;
        let partnerKey;
        objects.forEach((obj, index) => {
            for (const outerKey in obj) {
                for (const userId in obj[outerKey]) {
                    if (obj[outerKey][userId] === socketId) {
                        delete obj[outerKey][userId];
                        console.log(`Deleted userId "${userId}" with socket ID "${socketId}" from object ${index + 1}.`);
                        found = true;

                        if (Object.keys(obj[outerKey]).length === 0) {
                            delete obj[outerKey];
                            console.log(`Deleted empty outer key: "${outerKey}" from object ${index + 1}.`);
                        }

                        partnerKey = outerKey;

                    }
                }
            }
        });

        if (!found) {
            console.log(`Socket ID "${socketId}" not found in any object.`);
        }

        return partnerKey;
    }

    socket.on('disconnect', async () => {
        console.log('User disconnected :- ', socket.id);

        const partnerKey = deleteSocketId(socket.id, partners, users);

        sendUserData(users, partners, partnerKey);
    });
});

server.listen(process.env.PORT, (e) => {
    e ? console.log(e) : console.log('Server is running on port :- ', process.env.PORT);
});
