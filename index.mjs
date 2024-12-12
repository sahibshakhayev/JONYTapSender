import express from 'express';
import bodyParser from 'body-parser';
import TapSender from './tap_sender.mjs'; // Import the TapSender class

const app = express();
const port = 5000;

let tapSender = null; // Instance of TapSender

app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded form data
app.use(bodyParser.json());

// Serve HTML page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tap Sender</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        form {
          margin-bottom: 20px;
        }
        button {
          padding: 10px 15px;
          font-size: 16px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <h1>Tap Sender</h1>
      <form id="start-form" action="/start-tapping" method="POST">
        <label for="phpsessid">PHPSESSID:</label><br>
        <input type="text" id="phpsessid" name="phpsessid" required><br><br>
        <label for="jony_position">JONY's position:</label><br>
        <input type="text" id="jony_position" name="jony_position" required><br><br>
        <label for="maxTaps">Max Taps:</label><br>
        <input type="number" id="maxTaps" name="maxTaps" min="30" step="30" required><br><br>
        <button type="submit">Start Tapping</button>
      </form>
      <form id="stop-form" action="/stop-tapping" method="POST">
        <button type="submit">Stop Tapping</button>
      </form>
      <h2>Status</h2>
      <div id="status">
        <p>Tap Count: <span id="tap-count">0</span></p>
        <p>Status: <span id="tap-status">Stopped</span></p>
      </div>
      <script>
        async function fetchStatus() {
          const response = await fetch('/tapping-status');
          const data = await response.json();
          document.getElementById('tap-count').innerText = data.currentTapCount || 0;
          document.getElementById('tap-status').innerText = data.running ? 'Running' : 'Stopped';
        }

        setInterval(fetchStatus, 1000); // Update status every second
        fetchStatus();
      </script>
    </body>
    </html>
  `);
});

// Start the tapping process
app.post('/start-tapping', (req, res) => {
  const { phpsessid, maxTaps, jony_position} = req.body;

  if (!phpsessid || !maxTaps || maxTaps <= 0) {
    return res.status(400).send('Invalid input. Please provide a valid PHPSESSID and maxTaps.');
  }

  if (tapSender && tapSender.running) {
    return res.status(400).send('Tapping process is already running.');
  }

  const tapURL = 'https://muzbattle.ru/webapp/add_taps.php';

  try {
    tapSender = new TapSender(tapURL, Number(maxTaps));
    tapSender.setSessionId(phpsessid); // Set the PHPSESSID for the TapSender
    tapSender.SetPosition(jony_position);
    tapSender.start();
    res.redirect('/');
  } catch (error) {
    console.error('Error starting TapSender:', error.message);
    res.status(500).send('Failed to start tapping process.');
  }
});

// Stop the tapping process
app.post('/stop-tapping', (req, res) => {
  if (!tapSender || !tapSender.running) {
    return res.status(400).send('No active tapping process to stop.');
  }

  try {
    tapSender.stop();
    tapSender = null;
    res.redirect('/');
  } catch (error) {
    console.error('Error stopping TapSender:', error.message);
    res.status(500).send('Failed to stop tapping process.');
  }
});

// Endpoint to check tapping status
app.get('/tapping-status', (req, res) => {
  if (!tapSender) {
    return res.json({ running: false, currentTapCount: 0 });
  }

  res.json({
    running: tapSender.running,
    currentTapCount: tapSender.currentTapCount,
    maxTaps: tapSender.maxTaps,
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
