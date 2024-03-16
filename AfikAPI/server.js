const express = require('express');
const usersHanlder = require('./handlers/users');

// Configurations.
const config = require('./config');
const apiPort = config.apiPort;

const PORT = process.env.PORT || apiPort;

const app = express();
app.use(express.json());

app.post('/createUser', usersHanlder.createUser);
app.get('/getId', usersHanlder.getId);
app.get('/healthCheck', (req, res) => {
    res.send('OK');
  });


app.listen(PORT, () => {
    console.log(`Service is running on port ${PORT}`);
});

