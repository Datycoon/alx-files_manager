import express from 'express';
import AppController from '../controllers/AppController';

const app = express();

app.get('/', (req, res) => { res.send('Hello World!\n'); });

app.get('/status', (req, res) => { res.send(AppController.getStatus()); });

app.get('/stats', (req, res) => { res.send(AppController.getStats()); });

module.exports = app;
