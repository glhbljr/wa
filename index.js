const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Inisialisasi client WhatsApp
const client = new Client();

client.on('qr', (qr) => {
    console.log('QR Code received, scan it with your phone:');
    qrcode.generate(qr, { small: true });
});

client.once('ready', () => {
    console.log('WhatsApp client is ready!');
});

client.initialize();

/**
 * Helper untuk jeda antar pengiriman pesan
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Endpoint untuk mengirim pesan tunggal
 */
app.post('/send-message', async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ status: false, message: 'Nomor dan pesan diperlukan!' });
    }

    try {
        const formattedNumber = `${number}@c.us`;
        await client.sendMessage(formattedNumber, message);
        return res.status(200).json({ status: true, message: 'Pesan berhasil dikirim!' });
    } catch (error) {
        console.error('Error saat mengirim pesan:', error);
        return res.status(500).json({ status: false, message: 'Gagal mengirim pesan.' });
    }
});

/**
 * Endpoint untuk mengirim pesan berbeda ke banyak nomor
 */
app.post('/send-bulk-message', async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
            status: false,
            message: 'Daftar pesan (messages) diperlukan dan harus berupa array!'
        });
    }

    const results = [];

    for (const item of messages) {
        const { number, message } = item;

        if (!number || !message) {
            results.push({ number, status: 'failed', error: 'Nomor atau pesan kosong.' });
            continue;
        }

        try {
            const formattedNumber = `${number}@c.us`;
            await client.sendMessage(formattedNumber, message);
            results.push({ number, status: 'success' });
        } catch (error) {
            console.error(`Gagal mengirim pesan ke ${number}:`, error);
            results.push({ number, status: 'failed', error: error.message });
        }

        // Jeda acak antara 0.5 detik hingga 3 detik
        const randomDelay = Math.random() * (3000 - 500) + 500;
        await delay(randomDelay);
    }

    return res.status(200).json({
        status: true,
        message: 'Proses pengiriman selesai.',
        results
    });
});

// Jalankan server Express
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
