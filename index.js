const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// Create public directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'public'));
}

if (!fs.existsSync(path.join(__dirname, 'recordings'))) {
  fs.mkdirSync(path.join(__dirname, 'recordings'));
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Save recording
app.post('/api/save-recording', (req, res) => {
  const { blob, filename } = req.body;
  const buffer = Buffer.from(blob, 'base64');
  const filepath = path.join(__dirname, 'recordings', filename || `recording-${Date.now()}.webm`);
  
  fs.writeFile(filepath, buffer, (err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to save recording' });
      return;
    }
    res.json({ success: true, filename: path.basename(filepath) });
  });
});

// Serve recordings list
app.get('/api/recordings', (req, res) => {
  const recordingsDir = path.join(__dirname, 'recordings');
  fs.readdir(recordingsDir, (err, files) => {
    if (err) {
      res.status(500).json({ error: 'Failed to read recordings' });
      return;
    }
    const recordings = files.filter(f => f.endsWith('.webm')).map(f => ({
      name: f,
      url: `/recordings/${f}`
    }));
    res.json(recordings);
  });
});

// Serve recordings
app.use('/recordings', express.static(path.join(__dirname, 'recordings')));

app.listen(port, () => {
  console.log(`Screen Recorder running at http://localhost:${port}`);
  console.log(`Press Ctrl+C to stop the server`);
});
