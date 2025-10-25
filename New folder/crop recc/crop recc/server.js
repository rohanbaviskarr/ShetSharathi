const express = require('express');
const fs = require('fs').promises;
const { parse } = require('csv-parse/sync');
const { spawn } = require('child_process');
const app = express();
const port = 7000;

let data = [];
let options = {};

async function loadData() {
    const fileContent = await fs.readFile('best_crop_recommendation.csv', 'utf8');
    data = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
    });
    options.states = [...new Set(data.map(row => row.State))];
    options.seasons = [...new Set(data.map(row => row.Season))];
    options.soilTypes = [...new Set(data.map(row => row["Soil Type"]))];
}

app.use(express.static('public'));
app.use(express.json());

app.get('/options', async (req, res) => {
    await loadData();
    res.json(options);
});

app.post('/recommend', async (req, res) => {
    const { state, season, soilType, rainfall, temperature, marketPrice, demandFactor } = req.body;

    const pythonProcess = spawn('python', [
        'recommend.py',
        JSON.stringify({ state, season, soilType, rainfall, temperature, marketPrice, demandFactor })
    ]);

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
            return res.status(500).json({ error: 'Recommendation failed', details: errorOutput });
        }
        try {
            const result = JSON.parse(output);
            res.json(result);
        } catch (e) {
            res.status(500).json({ error: 'Invalid recommendation output', details: e.message });
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});