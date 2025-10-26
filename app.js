const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Configuration Block
const CONFIG = {
    port: 1000,
    dbPath: './db.sqlite3',
    staticDir: __dirname
};

// Database Setup Block
const initializeDatabase = () => {
    const db = new sqlite3.Database(CONFIG.dbPath, (err) => {
        if (err) {
            console.error('Error connecting to db.sqlite3:', err.message);
        } else {
            console.log('Connected to db.sqlite3');
        }
    });
    return db;
};

// Application Setup Block
const setupApplication = () => {
    const app = express();
    app.use(express.static(CONFIG.staticDir));
    return app;
};

// Route Handlers Block
const routeHandlers = {
    home: (req, res) => {
        res.sendFile(path.join(CONFIG.staticDir, 'index.html'));
    },

    getCrops: (db) => (req, res) => {
        db.all('SELECT DISTINCT product_name FROM store_product', [], (err, rows) => {
            if (err) {
                console.error('Error fetching crops:', err.message);
                return res.status(500).json({ error: 'Error fetching crops' });
            }
            res.json({ crops: rows.map(row => row.product_name) });
        });
    },

    getDashboard: (db) => (req, res) => {
        const crop = req.query.crop;
        if (!crop) {
            return res.status(400).json({ error: 'Crop name is required' });
        }

        // Debug query to see raw data
        const debugQuery = `
            SELECT up.state, sp.price
            FROM store_product sp
            JOIN app_userprofile up ON sp.farmerID = up.id
            WHERE sp.product_name = ?
            ORDER BY up.state, sp.price
        `;

        // Main aggregation query with additional diagnostics
        const aggregateQuery = `
            SELECT 
                up.state, 
                MIN(sp.price) AS min_price, 
                MAX(sp.price) AS max_price,
                COUNT(*) AS price_count,
                GROUP_CONCAT(sp.price) AS all_prices
            FROM store_product sp
            JOIN app_userprofile up ON sp.farmerID = up.id
            WHERE sp.product_name = ?
            GROUP BY up.state
            ORDER BY up.state
        `;

        // First get raw data for debugging
        db.all(debugQuery, [crop], (err, rawRows) => {
            if (err) {
                console.error('Error in debug query:', err.message);
                return res.status(500).json({ error: 'Database error' });
            }

            console.log(`Raw data for ${crop}:`, rawRows);

            // Then get aggregated data
            db.all(aggregateQuery, [crop], (err, rows) => {
                if (err) {
                    console.error('Error fetching dashboard data:', err.message);
                    return res.status(500).json({ error: 'Error fetching dashboard data' });
                }

                console.log(`Aggregated results for ${crop}:`, rows);

                // Check for equal min/max prices
                rows.forEach(row => {
                    if (row.min_price === row.max_price) {
                        console.warn(`Warning: Min and Max prices are equal for ${row.state}:`,
                            row.all_prices);
                    }
                });

                // Send response with essential data
                res.json(rows.map(row => ({
                    state: row.state,
                    min_price: row.min_price,
                    max_price: row.max_price,
                    price_count: row.price_count
                })));
            });
        });
    }
};

// Server Management Block
const serverManager = {
    start: (app, port) => {
        const server = app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
        return server;
    },

    setupShutdown: (db) => {
        process.on('SIGINT', () => {
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                }
                console.log('Database connection closed');
                process.exit(0);
            });
        });
    }
};

// Main Application Initialization Block
const initializeApp = () => {
    // Initialize components
    const db = initializeDatabase();
    const app = setupApplication();

    // Setup routes
    app.get('/', routeHandlers.home);
    app.get('/crops', routeHandlers.getCrops(db));
    app.get('/dashboard', routeHandlers.getDashboard(db));

    // Start server and setup shutdown
    serverManager.start(app, CONFIG.port);
    serverManager.setupShutdown(db);

    return { app, db };
};

// Start the application
initializeApp();