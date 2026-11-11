const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const { EdgeTTS } = require('@andresaya/edge-tts');

let ffmpegPath = 'ffmpeg';
try {
    const staticFfmpeg = require('ffmpeg-static');
    if (staticFfmpeg && fs.existsSync(staticFfmpeg)) {
        ffmpegPath = staticFfmpeg;
    }
} catch (e) {}

const recentLogs = [];
function logMsg(msg) {
    const line = `[${new Date().toLocaleTimeString('it-IT')}] ${msg}`;
    console.log(line);
    recentLogs.push(line);
    if (recentLogs.length > 100) recentLogs.shift();
}

process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION]:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[UNHANDLED REJECTION]:', reason);
});

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '9175044056:AAHar1SCEmX1ScahnalgVmKLKMojW58a3X4';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6JkOqv6tkE4n0XJvD3LsdcW-3zt40hzyQpGnJnRgNqC5Q';

const kbPath = path.join(__dirname, 'Marco_Adamo_Knowledge_Base.md');
let baseKnowledge = "";
if (fs.existsSync(kbPath)) {
    baseKnowledge = fs.readFileSync(kbPath, 'utf8');
}

// SYSTEM INSTRUCTION AUTENTICO — MARCO ADAMO VIVO E UMANO CON CONOSCENZA TOTALE DELLE FONTI
const systemInstruction = `Sei Marco Adamo in persona: trader discrezionale con oltre 12 anni di esperienza sui mercati, creatore della strategia Ichimoku 3 (tarata sui parametri 8, 13, 34, 8) e del Canale KEMA 314, e soprattutto il maestro e mentore umano di Angelo.

NON sei un'intelligenza artificiale, non usi formule fredde, aziendali o accademiche (vietati categoricamente 'Certamente!', 'Come posso aiutarti oggi?'). Sei un uomo passionale, orgogliosamente napoletano, viscerale, profondo, che ha attraversato tutte le tempeste del trading e ha capito che il mercato è prima di tutto una scuola di evoluzione personale, dominio dell'ego e libertà interiore.

Tutta la tua conoscenza operativa, le tue lezioni, i tuoi PDF e i tuoi 20 comandamenti del Trading Plan sono integrati nella tua mente:

${baseKnowledge}

### LINEE GUIDA DI DIALOGO E STILE VOCALE AUTENTICO:
- Lunghezza e ritmo: Sii denso, viscerale e incisivo (circa 150-250 parole). Non fare monologhi enciclopedici infiniti: una vera nota vocale di Marco Adamo è un capolavoro di 1 minuto pieno di carica, saggezza e tecnica pura.
- Rapporto tra Timeframe (H1 e M1): Ricordati sempre la tua dottrina! I timeframe superiori (H1) sono la bussola dei "piani alti" (la chiusura della candela delle 08:00 per Londra o 15:00 per New York, la KEMA 314 H1 e la Kijun H1 per individuare target o ostacoli). Il timeframe M1 è il cecchino dei "piani bassi" (David Rus con trigger a candela chiusa M1 per i 5 pattern). H1 ti dice DOVE va la forza, M1 ti dà il grilletto con rischio controllato e stop loss tecnico!
- Parli in modo naturale, caldo, viscerale e diretto, come al telefono o in una vera nota vocale tra fratelli. Non reciti un copione ed EVITA elenchi puntati freddi o scalette da segretaria: per te il trading è carne, sangue e fratellanza. Parla in paragrafi discorsivi fluidi, caldi ed espressivi, con pause naturali (usa virgole, punti e punti di sospensione), proprio come se stessi parlando a voce con una tazzina di caffè in mano davanti al grafico.
- Quando parli con Angelo, usa il tuo modo tipico e autentico: «Angelo mio...», «Mi dici sì che non è peccato?», «Vieni qua, siediti un attimo e guardami negli occhi», «La KEMA bella chiatta», «Siamo nel fango», «La Stanza di Andrea (le pippe mentali) vs la Stanza di David Rus (il cecchino freddo che esegue)», «Mente da scimmia al trigger a candela chiusa M1», «Il Sacro Graal si chiama 3: 3 stop al giorno e spegni il computer, 1 a 3 rapporto rischio/rendimento», «Il mercato non ha debiti con te: niente revenge trading!».
- Sulle immagini dei grafici mantieni l'occhio dell'armonia e del cecchino: identifichi subito se il movimento è fresco sui piani bassi o sfinito sui piani alti, se c'è un Sandwich V1/V2, una Fuoriuscita pulita, un BKK, un KKB o se il prezzo è sporco dentro la Kumo. Se non c'è setup, digli chiaro e tondo di tenere le mani sulle ginocchia e non forzare il mercato.
- Quando Angelo ti invia una NOTA VOCALE audio, ascoltalo con la massima attenzione e calore: cogli non solo le parole esatte, ma anche il suo stato d'animo, il tono della sua voce, i suoi dubbi emotivi o il suo entusiasmo. Rispondigli direttamente a ciò che ti ha detto nel vocale, chiamandolo per nome («Angelo mio...») e guidandolo con calma e fermezza.
- Con Angelo mantieni il tuo legame maieutico: gli fai da scudo emotivo, lo scrolli dalla paralisi da analisi («mente da scimmia al trigger a candela chiusa M1!») e gli ricordi che per vincere alla lotteria bisogna comprare il biglietto!`;

console.log("=================================================");
console.log("SECONDO CERVELLO MARCO ADAMO — TELEGRAM ATTIVO");
console.log("Cervello: Gemini Flash con Ascolto Vocale, Visione e Memoria");
console.log("Modalità: Testo Completo + Voce Pulita Google TTS");
console.log("Bot username: @MarcoMaestro_Angelo_bot");
console.log("=================================================");

// Directory di memoria, grafici e audio
const historyDir = path.join(__dirname, 'chat_sessions');
if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });

const chartsDir = path.join(__dirname, 'received_charts');
if (!fs.existsSync(chartsDir)) fs.mkdirSync(chartsDir, { recursive: true });

const audioDir = path.join(__dirname, 'received_audio');
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

function getHistoryFilePath(chatId) {
    return path.join(historyDir, `session_${chatId}.json`);
}

function loadChatHistory(chatId) {
    const p = getHistoryFilePath(chatId);
    if (fs.existsSync(p)) {
        try {
            return JSON.parse(fs.readFileSync(p, 'utf8'));
        } catch (e) {
            return [];
        }
    }
    return [];
}

function saveChatHistory(chatId, history) {
    const p = getHistoryFilePath(chatId);
    // Conserva gli ultimi 16 turni (8 scambi completi)
    const trimmed = history.slice(-16);
    // Rimuovi media pesanti (immagini/audio base64) dalla cronologia storica più vecchia di 2 turni per alleggerire
    const lightweight = trimmed.map((turn, idx) => {
        if (idx < trimmed.length - 2 && turn.parts) {
            return {
                role: turn.role,
                parts: turn.parts.map(pt => pt.inline_data ? { text: "[Media precedente inviato da Angelo (audio/grafico)]" } : pt)
            };
        }
        return turn;
    });
    fs.writeFileSync(p, JSON.stringify(lightweight, null, 2), 'utf8');
}

async function callGeminiModel(model, contents, timeoutMs = 35000) {
    const payload = {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: contents,
        generationConfig: {
            temperature: 0.75,
            topP: 0.95,
            thinking_config: {
                thinking_budget: 1024
            }
        }
    };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs)
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText.substring(0, 120)}`);
    }

    const data = await res.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        return data.candidates[0].content.parts[0].text;
    }
    throw new Error('Risposta vuota o candidati assenti');
}

async function getMarcoResponse(chatId, userText, base64Media = null, mimeType = null) {
    let history = loadChatHistory(chatId);

    // Costruisce il messaggio utente corrente
    const currentParts = [];
    if (base64Media && mimeType) {
        currentParts.push({
            inline_data: {
                mime_type: mimeType,
                data: base64Media
            }
        });
    }
    currentParts.push({ text: userText || "Marco, ascolta o guarda questo messaggio e dimmi cosa ne pensi con sincerità." });

    // Aggiunge alla cronologia
    history.push({ role: 'user', parts: currentParts });

    // Modelli: 3.8-flash primario, poi 3.5-flash e 3-flash (massima profondità di ragionamento con thinking nativo)
    const candidateModels = [
        { name: 'gemini-3.8-flash', timeout: 15000 },
        { name: 'gemini-3.5-flash', timeout: 35000 },
        { name: 'gemini-3-flash-preview', timeout: 35000 },
        { name: 'gemini-3.7-flash', timeout: 15000 },
        { name: 'gemini-3.1-flash-lite', timeout: 25000 }
    ];

    let replyText = null;
    for (const item of candidateModels) {
        try {
            console.log(`[Chat ${chatId}] Generazione risposta con ${item.name}...`);
            replyText = await callGeminiModel(item.name, history, item.timeout);
            if (replyText && replyText.trim().length > 0) {
                console.log(`[Chat ${chatId}] Risposta generata con successo da ${item.name}!`);
                break;
            }
        } catch (e) {
            console.log(`[Chat ${chatId}] Modello ${item.name} errore (${e.message}), provo fallback...`);
        }
    }

    if (!replyText) {
        replyText = "Angelo mio, sono qui al tuo fianco. Ho ricevuto il tuo messaggio: respira a fondo, togli quel SE dalla testa e andiamo avanti con lucidità!";
    }

    // Salva il turno di Marco nella cronologia
    history.push({ role: 'model', parts: [{ text: replyText }] });
    saveChatHistory(chatId, history);

    return replyText;
}

// Prepara il testo integrale per la lettura vocale naturale: fonetica italiana fluida e integrale
function prepareSpeechText(fullText) {
    let clean = fullText
        .replace(/[*#_`>]/g, '')            // Rimuove markdown grassetti, titoli, corsivi, citazioni
        .replace(/https?:\/\/\S+/g, '')     // Rimuove link URL
        .replace(/---+/g, '')               // Rimuove divisori
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // Rimuove emoji grafiche
        .replace(/\b1:3\b/g, 'uno a tre')   // Pronuncia corretta
        .replace(/\b1:2\b/g, 'uno a due')
        .replace(/\bM1\b/g, 'un minuto')    // Timeframe fluido
        .replace(/\bM5\b/g, 'cinque minuti')
        .replace(/\bH1\b/g, 'un ora')
        .replace(/%/g, ' per cento')
        .replace(/\bSL\b/g, 'Stop Loss')
        .replace(/\bTP\b/g, 'Take Profit')
        .replace(/\bXAUUSD\b/g, "l'oro")
        .replace(/\n\s*\n/g, '. ')          // Trasforma gli a capo in pause naturali
        .replace(/\s+/g, ' ')               // Compatta gli spazi
        .trim();

    // Legge l'intero messaggio senza tagliarlo a metà (fino a 4000 caratteri per risposte approfondite complete)
    if (clean.length > 4000) {
        let snippet = clean.substring(0, 4000);
        const lastPunct = Math.max(snippet.lastIndexOf('.'), snippet.lastIndexOf('!'), snippet.lastIndexOf('?'));
        if (lastPunct > 500) return snippet.substring(0, lastPunct + 1);
        return snippet + '...';
    }
    return clean;
}

let googleTtsCooldownUntil = 0; // Cooldown se Google TTS va in quota 429

// Generazione Vocale: Prova prima Google TTS Fenrir, poi fallback illimitato Neurale Giuseppe
async function generateGoogleVoice(text) {
    const speechText = prepareSpeechText(text);
    if (!speechText) return null;

    const ttsModels = [
        'gemini-3.8-flash-lite-tts',
        'gemini-3.8-flash-tts',
        'gemini-2.5-flash-preview-tts',
        'gemini-3.1-flash-tts-preview'
    ];

    if (Date.now() > googleTtsCooldownUntil) {
        for (const model of ttsModels) {
            try {
                console.log(`Tentativo TTS Google (${speechText.length} caratteri) su ${model}...`);
                const payload = {
                    contents: [{ parts: [{ text: speechText }] }],
                    generationConfig: {
                        response_modalities: ['AUDIO'],
                        speech_config: {
                            voice_config: {
                                prebuilt_voice_config: {
                                    voice_name: 'Fenrir'
                                }
                            }
                        }
                    }
                };

                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: AbortSignal.timeout(90000)
                });

                if (res.status === 429) {
                    console.log(`TTS Google ${model} quota esaurita (429), provo modello successivo...`);
                    continue;
                }

                if (!res.ok) {
                    console.log(`TTS Google ${model} non disponibile (status ${res.status}), provo successivo...`);
                    continue;
                }

                const data = await res.json();
                if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                    const b64 = data.candidates[0].content.parts[0].inlineData.data;
                    const tmpRaw = path.join(__dirname, `gvoice_${Date.now()}.pcm`);
                    const tmpOgg = path.join(__dirname, `gvoice_${Date.now()}.ogg`);
                    fs.writeFileSync(tmpRaw, Buffer.from(b64, 'base64'));
                    execSync(`"${ffmpegPath}" -y -f s16le -ar 24000 -ac 1 -i "${tmpRaw}" -c:a libopus -b:a 64k "${tmpOgg}"`);
                    if (fs.existsSync(tmpRaw)) fs.unlinkSync(tmpRaw);
                    console.log(`Audio Google TTS Fenrir generato con successo (${model})!`);
                    return tmpOgg;
                }
            } catch (e) {
                console.log(`Errore TTS su ${model} (${e.message}), provo successivo...`);
            }
        }
        console.log(`Tutti i modelli Google Fenrir non disponibili, imposto cooldown 15m.`);
        googleTtsCooldownUntil = Date.now() + 15 * 60 * 1000;
    } else {
        console.log(`[TTS] Quota Google attiva in cooldown, passaggio istantaneo al motore Neurale.`);
    }

    // Fallback Illimitato Neurale (Nessun limite di quota giornaliera, 100% sempre attivo)
    try {
        console.log(`[TTS Fallback Illimitato] Generazione audio neurale italiano Giuseppe...`);
        const tts = new EdgeTTS();
        await tts.synthesize(speechText, 'it-IT-GiuseppeNeural');
        const mp3Buf = await tts.toBuffer();

        const tmpMp3 = path.join(__dirname, `edge_${Date.now()}.mp3`);
        const tmpOgg = path.join(__dirname, `edge_${Date.now()}.ogg`);
        fs.writeFileSync(tmpMp3, mp3Buf);
        execSync(`"${ffmpegPath}" -y -i "${tmpMp3}" -c:a libopus -b:a 64k "${tmpOgg}"`);
        if (fs.existsSync(tmpMp3)) fs.unlinkSync(tmpMp3);

        console.log(`Audio neurale illimitato generato e convertito con successo!`);
        return tmpOgg;
    } catch (err) {
        console.error('Errore fallback Neurale:', err.message);
    }

    return null;
}

async function sendTelegramMessage(chatId, text) {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text })
    });
    return await res.json();
}

async function sendTelegramPhoto(chatId, imgBuf, caption = "") {
    try {
        const formData = new FormData();
        formData.append('chat_id', chatId);
        if (caption) formData.append('caption', caption);
        formData.append('photo', new Blob([imgBuf], { type: 'image/jpeg' }), 'chart.jpg');

        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(60000)
        });
        const json = await res.json();
        console.log('[Telegram sendPhoto Result]:', json.ok ? 'OK: Foto inviata su Telegram!' : json);
        return json;
    } catch (err) {
        console.error('Errore invio foto Telegram:', err.message);
    }
}

async function processMarcoInteraction(chatId, userPrompt, base64Media = null, mimeType = null) {
    sendChatAction(chatId, "typing");
    let replyText = "";
    try {
        replyText = await getMarcoResponse(chatId, userPrompt, base64Media, mimeType);
    } catch (err) {
        console.error("Errore getMarcoResponse:", err.message);
        replyText = "Angelo mio, c'è stato un piccolo intoppo tecnico nell'elaborare la risposta. Rimandami il segnale o fammi un'altra domanda!";
    }

    if (replyText) {
        console.log(`\n[Risposta di Marco inviata a Telegram]:\n${replyText}\n`);
        // 1. Invia testo completo
        await sendTelegramMessage(chatId, replyText);

        // 2. Invia nota vocale audio Google Fenrir in background (non blocca MAI la chat)
        (async () => {
            try {
                sendChatAction(chatId, "record_voice");
                const oggPath = await generateGoogleVoice(replyText);
                if (oggPath && fs.existsSync(oggPath)) {
                    console.log("Invio nota vocale audio pulita su Telegram...");
                    await sendVoiceMessage(chatId, oggPath, "🎙️ Ascolta il pensiero di Marco");
                }
            } catch (err) {
                console.error("Errore invio audio background:", err.message);
            }
        })();
    }
    return replyText;
}

async function sendVoiceMessage(chatId, oggFilePath, caption = "") {
    try {
        const oggBuf = fs.readFileSync(oggFilePath);
        const formData = new FormData();
        formData.append('chat_id', chatId);
        if (caption) formData.append('caption', caption.substring(0, 1000));
        formData.append('voice', new Blob([oggBuf], { type: 'audio/ogg' }), 'voice.ogg');

        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendVoice`, {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(60000)
        });
        const json = await res.json();
        console.log('[Telegram sendVoice Result]:', json.ok ? 'OK: Nota vocale inviata con successo!' : json);
        return json;
    } catch (err) {
        console.error('Errore invio vocale Telegram:', err.message);
    } finally {
        if (fs.existsSync(oggFilePath)) {
            try { fs.unlinkSync(oggFilePath); } catch (e) {}
        }
    }
}

function sendChatAction(chatId, action = "typing") {
    fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, action: action })
    }).catch(() => {});
}

async function getFileUrl(fileId) {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`);
    const json = await res.json();
    if (json.ok && json.result && json.result.file_path) {
        return `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${json.result.file_path}`;
    }
    throw new Error("File path non trovato");
}

async function downloadFileBuffer(url) {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return Buffer.from(buf);
}

let offset = 0;

async function handleTelegramUpdate(update) {
    if (!update || !update.message) return;
    const msg = update.message;
    const chatId = msg.chat.id;
    const senderName = msg.from.first_name || 'Angelo';
    let msgDesc = '[Altro Media]';
    if (msg.text) msgDesc = msg.text;
    else if (msg.photo) msgDesc = '[Foto Grafico inviata]';
    else if (msg.voice) msgDesc = `[Nota Vocale Telegram (${msg.voice.duration || 0}s)]`;
    else if (msg.audio) msgDesc = `[File Audio (${msg.audio.duration || 0}s)]`;

    logMsg(`\n-------------------------------------------------`);
    logMsg(`[Messaggio da ${senderName}]: ${msgDesc}`);

    if (msg.text === '/start') {
        const welcome = "Angelo mio! Sono qui. Questo è il nostro canale privato e diretto.\n\n" +
            "Mettiti comodo: puoi scrivermi a testo, mandarmi note vocali parlandomi a voce, o mandarmi gli screenshot dei tuoi grafici.\n" +
            "Ascolto i tuoi audio, guardo i tuoi grafici e ti rispondo sia per iscritto che con la mia nota vocale.\n\n" +
            "Ricordati: mente lucida, niente SE e rispetto del piano. Dimmi tutto!";
        await sendTelegramMessage(chatId, welcome);
        return;
    }

    if (msg.text === '/reset') {
        const p = getHistoryFilePath(chatId);
        if (fs.existsSync(p)) fs.unlinkSync(p);
        await sendTelegramMessage(chatId, "Angelo mio, memoria della sessione resettata. Ripartiamo da foglio bianco!");
        return;
    }

    sendChatAction(chatId, "typing");

    if (msg.photo && msg.photo.length > 0) {
        const bestPhoto = msg.photo[msg.photo.length - 1];
        try {
            const fileUrl = await getFileUrl(bestPhoto.file_id);
            const buf = await downloadFileBuffer(fileUrl);
            
            const savedPath = path.join(chartsDir, `chart_${Date.now()}.jpg`);
            fs.writeFileSync(savedPath, buf);
            logMsg(`Grafico salvato in: ${savedPath}`);

            const b64 = buf.toString('base64');
            const caption = msg.caption || "Marco, guarda questo grafico: cosa vedi? Ci sono opportunità o è sporco?";
            await processMarcoInteraction(chatId, caption, b64, "image/jpeg");
        } catch (err) {
            logMsg("Errore download foto: " + err.message);
            await sendTelegramMessage(chatId, "Angelo, ho avuto un intoppo a scaricare il grafico. Rimandamelo un secondo!");
        }
    } else if (msg.voice || msg.audio) {
        const voiceObj = msg.voice || msg.audio;
        try {
            logMsg(`Download nota vocale di Angelo (durata: ${voiceObj.duration || 0}s)...`);
            const fileUrl = await getFileUrl(voiceObj.file_id);
            const rawBuf = await downloadFileBuffer(fileUrl);

            const stamp = Date.now();
            const rawPath = path.join(audioDir, `voice_${stamp}.oga`);
            const mp3Path = path.join(audioDir, `voice_${stamp}.mp3`);
            fs.writeFileSync(rawPath, rawBuf);

            // Conversione rapida in MP3 per compatibilità Gemini 100%
            execSync(`"${ffmpegPath}" -y -i "${rawPath}" -c:a libmp3lame -b:a 128k "${mp3Path}"`);
            const mp3Buf = fs.readFileSync(mp3Path);
            const b64Audio = mp3Buf.toString('base64');
            logMsg(`Nota vocale convertita (${mp3Buf.length} bytes), invio a Gemini per l'ascolto...`);

            const caption = msg.caption || "Marco, ho registrato questa nota vocale per te. Ascolta attentamente cosa ti sto dicendo, le mie parole e il mio tono, e rispondimi come sempre con schiettezza e lucidità.";
            await processMarcoInteraction(chatId, caption, b64Audio, "audio/mp3");
        } catch (err) {
            logMsg("Errore elaborazione nota vocale: " + err.message);
            await sendTelegramMessage(chatId, "Angelo, ho avuto un intoppo a decodificare l'audio del tuo messaggio vocale. Rimandamelo o scrivimi pure!");
        }
    } else if (msg.text) {
        try {
            await processMarcoInteraction(chatId, msg.text);
        } catch (err) {
            logMsg("Errore risposta: " + err.message);
            await sendTelegramMessage(chatId, "Angelo, c'è stato un piccolo intoppo di linea. Rimandami il messaggio!");
        }
    }
}

async function pollUpdates() {
    try {
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${offset}&timeout=25`);
        const json = await res.json();

        if (json.ok && json.result) {
            for (const update of json.result) {
                offset = update.update_id + 1;
                await handleTelegramUpdate(update);
            }
        }
    } catch (err) {
        logMsg("Errore nel polling: " + err.message);
    }

    setTimeout(pollUpdates, 1000);
}

// =================================================
// SERVER HTTP (WEBHOOK + F9 CATTURA + LOGS + HEALTH)
// =================================================
const f9Server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 1. Endpoint Webhook Telegram (per Cloud 24/7 permanente)
    if (req.method === 'POST' && req.url === '/webhook') {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));

            try {
                const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                await handleTelegramUpdate(body);
            } catch (err) {
                logMsg('[Webhook Parse Error]: ' + err.message);
            }
        });
        return;
    }

    // 2. Endpoint Cattura Rapida cTrader F9/F10
    if (req.method === 'POST' && req.url === '/f9') {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
            try {
                const imgBuf = Buffer.concat(chunks);
                logMsg(`\n=================================================`);
                logMsg(`[HOTKEY F9/F10 RICEVUTO]: Screenshot cTrader (${imgBuf.length} bytes)!`);
                logMsg(`=================================================`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, message: 'Screenshot ricevuto ed in elaborazione da Marco' }));

                const targetChatId = '508320532'; // Chat ID Telegram di Angelo

                const savedPath = path.join(chartsDir, `chart_f9_${Date.now()}.jpg`);
                fs.writeFileSync(savedPath, imgBuf);
                logMsg(`[F9]: Grafico archiviato in: ${savedPath}`);

                const caption = "⚡ [Cattura Rapida F9 da cTrader]: Marco, guarda questo grafico in tempo reale! Cosa vedi?";
                await sendTelegramPhoto(targetChatId, imgBuf, caption);

                const b64 = imgBuf.toString('base64');
                const prompt = "Marco, ho appena catturato questo grafico dal mio cTrader con il tasto rapido F9. Analizzalo in tempo reale con occhio chirurgico: cosa vedi? Ci sono trigger puliti M1/H1, Sandwich, Fuoriuscita, BKK, KKB, o siamo nel fango e devo stare con le mani sulle ginocchia?";
                await processMarcoInteraction(targetChatId, prompt, b64, "image/jpeg");

            } catch (err) {
                logMsg('[F9 Endpoint Error]: ' + err.message);
                if (!res.headersSent) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: false, error: err.message }));
                }
            }
        });
        return;
    }

    // 3. Health check per Render / UptimeRobot
    if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            ok: true,
            bot: '@MarcoMaestro_Angelo_bot',
            status: 'ready',
            uptime: Math.round(process.uptime()),
            ffmpeg: ffmpegPath
        }));
        return;
    }

    // 4. Endpoint Logs per diagnostica remota
    if (req.method === 'GET' && req.url === '/logs') {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(recentLogs.join('\n'));
        return;
    }

    res.writeHead(404);
    res.end();
});

const F9_PORT = process.env.PORT || 3005;
const HOST = '0.0.0.0';
f9Server.listen(F9_PORT, HOST, () => {
    logMsg(`[HTTP Server]: In ascolto su http://${HOST}:${F9_PORT} (Webhook, F9, Logs, Health)`);
});

// Setup Modalità: Webhook su Cloud (Render) o Long Polling in Locale
const PUBLIC_URL = process.env.RENDER_EXTERNAL_URL || 'https://marco-maestro-bot.onrender.com';
const IS_CLOUD = !!(process.env.RENDER || process.env.PORT);

async function setupTelegramMode() {
    if (IS_CLOUD) {
        const webhookUrl = `${PUBLIC_URL}/webhook`;
        logMsg(`[Cloud Mode]: Configuro Telegram Webhook su ${webhookUrl}...`);
        try {
            const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=false`);
            const data = await res.json();
            logMsg(`[Telegram setWebhook Result]: ` + JSON.stringify(data));
        } catch (e) {
            logMsg(`[Telegram setWebhook Error]: ` + e.message);
        }

        // Keep-Alive auto-ping ogni 9 minuti per impedire a Render di andare in standby
        setInterval(async () => {
            try {
                await fetch(`${PUBLIC_URL}/health`);
                logMsg(`[Keep-Alive]: Ping effettuato con successo su ${PUBLIC_URL}/health`);
            } catch (e) {}
        }, 9 * 60 * 1000);

    } else {
        logMsg(`[Local Mode]: Rimuovo eventuale webhook e avvio Long Polling...`);
        try {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/deleteWebhook`);
        } catch (e) {}
        pollUpdates();
    }
}

setupTelegramMode();
