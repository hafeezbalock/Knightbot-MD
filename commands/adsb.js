const axios = require('axios');

/**
 * ADSB Command for Knightbot-MD
 * Usage: .adsb [Registration] (e.g., .adsb N12345)
 */
async function adsb(sock, chatId, message, args) {
    const reg = args[0]?.toUpperCase();
    if (!reg) return sock.sendMessage(chatId, { text: "❌ Please provide a registration number.\nUsage: *.adsb AP-BMG*" });

    try {
        // Fetching from Airplanes.live API
        const response = await axios.get(`https://api.airplanes.live/v2/reg/${reg}`);
        const aircraft = response.data.aircraft?.[0];

        if (!aircraft) {
            return sock.sendMessage(chatId, { text: `❌ No live flight found for registration: *${reg}*` });
        }

        const mapLink = `https://airplanes.live/?icao=${aircraft.hex}`;
        const flightInfo = `✈️ *Flight Tracking: ${reg}*\n\n` +
            `🔹 *Callsign:* ${aircraft.flight || 'N/A'}\n` +
            `🔹 *Type:* ${aircraft.t || 'Unknown'}\n` +
            `🔹 *Altitude:* ${aircraft.alt_baro || 0} ft\n` +
            `🔹 *Ground Speed:* ${aircraft.gs || 0} kts\n` +
            `🔹 *Squawk:* ${aircraft.squawk || 'None'}\n\n` +
            `📍 *Location:* ${aircraft.lat}, ${aircraft.lon}\n` +
            `🔗 *Live Map:* ${mapLink}`;

        await sock.sendMessage(chatId, { text: flightInfo }, { quoted: message });
        
    } catch (error) {
        console.error("ADSB Error:", error);
        await sock.sendMessage(chatId, { text: "❌ Error connecting to flight database." });
    }
}

module.exports = adsb;
