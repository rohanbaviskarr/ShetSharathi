const express = require('express');
const fs = require('fs').promises;
const { parse } = require('csv-parse/sync');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const port = 9000;

let data = [];
async function loadData() {
    const fileContent = await fs.readFile('dataset.csv', 'utf8');
    data = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
    });
    data.forEach(row => {
        row.Arrival_Date = new Date(row.Arrival_Date.split('/').reverse().join('-'));
        row.Modal_x0020_Price = parseFloat(row.Modal_x0020_Price);
    });
}

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/options', async (req, res) => {
    await loadData();
    const commodities = [...new Set(data.map(row => row.Commodity))];
    const states = [...new Set(data.map(row => row.State))];
    res.json({ commodities, states });
});

app.get('/forecast', async (req, res) => {
    const { commodity, state } = req.query;
    let filteredData = data
        .filter(row => row.Commodity === commodity && row.State === state)
        .sort((a, b) => a.Arrival_Date - b.Arrival_Date);

    const prices = filteredData.map(row => row.Modal_x0020_Price);
    const lastDate = filteredData[filteredData.length - 1].Arrival_Date;

    const pythonProcess = spawn('python', ['forecast.py', JSON.stringify({ prices, last_date: lastDate.toISOString() })]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: 'Forecast failed', details: errorOutput });
        }
        try {
            const result = JSON.parse(output);
            res.json(result);
        } catch (e) {
            res.status(500).json({ error: 'Invalid forecast output', details: e.message });
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
