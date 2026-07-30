const express = require('express')
const authMiddleware = require('./auth-middleware')

const app = express();

app.use("/configurations", authMiddleware);  // cognito authentication protects all the configuration endpoints
app.get('/configurations', (req, res) => {
    res.send('Some configs')
})

app.listen(3030, () => {
    console.log("Listening on port 3030");
});