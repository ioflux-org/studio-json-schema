#!/usr/bin/env node

import { program } from 'commander';
import express from 'express';
import open from 'open';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program
    .version('0.1.0')
    .argument('<file>', 'Path to JSON/YAML schema file')
    .option('-p, --port <number>', 'Port to run the server on', '3000')
    .action((filePath, options) => {
        const absolutePath = path.resolve(process.cwd(), filePath);

        if (!fs.existsSync(absolutePath)) {
            console.error(`Error: File not found at ${absolutePath}`);
            process.exit(1);
        }

        const app = express();
        const PORT = options.port;

        app.use(cors());

        // Serve static files from the React app build directory
        // Assuming the build is in ../dist relative to this script
        const distPath = path.join(__dirname, '../dist');

        if (!fs.existsSync(distPath)) {
            console.error("Error: Build directory not found. Please run 'npm run build' first.");
            process.exit(1);
        }

        app.use(express.static(distPath));

        // API endpoint to serve the schema content
        app.get('/api/schema', (req, res) => {
            try {
                const content = fs.readFileSync(absolutePath, 'utf-8');
                res.json({
                    content: content,
                    filename: path.basename(absolutePath)
                });
            } catch (err) {
                res.status(500).json({ error: 'Failed to read file' });
            }
        });

        // Handle React routing, return all requests to React app (SPA fallback)
        app.use((req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });

        app.listen(PORT, () => {
            const url = `http://localhost:${PORT}`;
            console.log(`Studio Visualizer running at ${url}`);
            console.log(`Visualizing: ${absolutePath}`);
            open(url);
        });
    });

program.parse(process.argv);
