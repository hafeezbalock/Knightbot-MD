const axios = require('axios');

async function adsb(sock, message, args) {
    const chatId = message.key.remoteJid;
    let query = args.join('').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    if (!query) {
        return sock.sendMessage(chatId, { 
            text: '✈️ *USAGE:* `.adsb [Callsign/Reg]`\nExample: `.adsb SVA737`' 
        });
    }

    try {
        await sock.sendMessage(chatId, { text: `🔎 Deep scanning radar for *${query}*...` });

        const endpoints = [
            `https://api.adsb.lol/v2/callsign/${query}`,
            `https://api.adsb.lol/v2/registration/${query}`,
            `https://api.adsb.lol/v2/icao/${query}`
        ];

        let aircraft = null;

        for (let url of endpoints) {
            try {
                const res = await axios.get(url, { 
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 5000 
                });
                if (res.data?.ac?.length > 0) {
                    aircraft = res.data.ac[0];
                    break; 
                }
            } catch (err) { continue; }
        }

        if (aircraft) {
            const p = aircraft;
            const flight = p.flight?.trim() || p.callsign?.trim() || query;
            
            // THE FIX: Official Google Maps Search URL
            // This avoids using commas directly, so WhatsApp won't break the link.
            const mapLink = (p.lat && p.lon) 
                ? `https://www.google.com/maps/search/?api=1&query=${p.lat}%2C${p.lon}` 
                : null;

            const report = `✈️ *LIVE FLIGHT DATA*
━━━━━━━━━━━━━━━━━━
🆔 *Callsign:* ${flight}
🚩 *Registration:* ${p.r || 'N/A'}
🏗️ *Model:* ${p.t || 'Unknown'}
🔢 *Squawk:* ${p.squawk || 'None'}

📊 *PERFORMANCE:*
⛰️ *Altitude:* ${p.alt_baro === 'ground' ? 'On Ground' : (p.alt_baro ? p.alt_baro + ' ft' : 'N/A')}
🚀 *Ground Speed:* ${p.gs ? p.gs + ' knots' : 'N/A'}
🧭 *Heading:* ${p.track ? p.track + '°' : 'N/A'}

📍 *LOCATION:*
${mapLink ? `📌 *View Position on Maps:* \n${mapLink}` : '📡 Position Not Available'}
━━━━━━━━━━━━━━━━━━
🛰️ *Radar:* ADSB.lol`;

            await sock.sendMessage(chatId, { text: report });
        } else {
            await sock.sendMessage(chatId, { 
                text: `❌ *No data found for ${query}.*\n\n_Aircraft may be out of range or landed._` 
            });
        }
    } catch (error) {
        console.error("ADSB Command Error:", error.message);
        await sock.sendMessage(chatId, { text: '⚠️ *Radar Offline:* Try again in a minute.' });
    }
}

module.exports = { adsb };
