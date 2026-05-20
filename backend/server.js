const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS so your frontend can grab this data safely
app.use(cors());
app.use(express.json());

// A quick test route to make sure it works!
app.get('/api/test', (req, res) => {
  res.json({ message: "Express is initialized and running!" });
});

// Start the server on port 5000
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
