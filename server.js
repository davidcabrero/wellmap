const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api/search', async (req, res) => {
    const { query } = req.query;
    const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
    res.json(response.data);
});

app.get('/api/route', async (req, res) => {
    const { start, end } = req.query;
    const response = await axios.get(`http://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full`);
    res.json(response.data);
});

app.listen(3001, () => console.log('Backend en http://localhost:3001'));