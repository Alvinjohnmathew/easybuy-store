const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from the current directory
app.use(express.static(__dirname));

const dbPath = path.join(__dirname, 'database.json');

// Initialize database if not exists
if (!fs.existsSync(dbPath)) {
  const initialData = {
    products: null, // Let frontend initialize
    orders: [],
    paymentSettings: { payeeName: 'EasyBuy Store', upiId: 'easybuy@okaxis' }
  };
  fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
}

// GET all data
app.get('/api/db', (req, res) => {
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  res.json(data);
});

// POST all data
app.post('/api/db', (req, res) => {
  fs.writeFileSync(dbPath, JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
