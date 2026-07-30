const express = require('express')
const authMiddleware = require('./auth-middleware')

const app = express();

app.use("/configurations", authMiddleware);  // cognito authentication protects all the configuration endpoints
app.get('/configurations', (req, res) => {
    res.send('Some configs')
})
app.get(`/configurations/:configurationId`, (req, res) => {
    const { configurationId } = req.params;

    res.json({
        id: configurationId,
    });
})

app.post('/configurations', (req, res) => {
    res.send('new configId')
})

app.put(`/configurations/:configurationId`, (req, res) => {
    const { configurationId } = req.params;

    res.json({
        id: configurationId,
    });
})

app.delete(`/configurations/:configurationId`, (req, res) => {
    const { configurationId } = req.params;

    res.json({
        deleted: true
    });
})






app.listen(3030, () => {
    console.log("Listening on port 3030");
});