const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API to get data
app.get('/api/data/:site/:year/:month', (req, res) => {
    // The 'site' parameter is already decoded by Express from the URL encoding
    const { site, year, month } = req.params;
    const fileName = `${site}_${year}-${String(month).padStart(2, '0')}.json`;
    const filePath = path.join(DATA_DIR, fileName);

    if (fs.existsSync(filePath)) {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                return res.status(500).send('Error reading data file.');
            }
            res.json(JSON.parse(data));
        });
    } else {
        res.status(404).json({ message: 'No data for this period. A new file will be created on save.' });
    }
});

// API to save data
app.post('/api/data/:site/:year/:month', (req, res) => {
    // The 'site' parameter is already decoded by Express
    const { site, year, month } = req.params;
    const fileName = `${site}_${year}-${String(month).padStart(2, '0')}.json`;
    const filePath = path.join(DATA_DIR, fileName);
    const dataToSave = JSON.stringify(req.body, null, 2);

    fs.writeFile(filePath, dataToSave, 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return res.status(500).send('Error saving data.');
        }
        res.status(200).send({ message: 'Data saved successfully.' });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});