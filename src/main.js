const express = require('express')
const authMiddleware = require('./auth-middleware')
const Configuration = require('./configuration')
const {connectDB} = require('./db-connect')

const start = async ()=>{
    await connectDB()

    const app = express();

    app.set("trust proxy", 1);
    app.use("/configurations", authMiddleware);  // cognito authentication protects all the configuration endpoints

    app.use(express.json());

    const configurationInstance = new Configuration();

    app.get('/configurations', (req, res) => {
        // console.log('userId', req.user.username)
        res.send('Some configs')
    })
    app.get(`/configurations/:configurationId`, (req, res) => {
        const { configurationId } = req.params;

        res.json({
            id: configurationId,
        });
    })

    app.post('/configurations', configurationInstance.post)

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
}





start().then(()=>{},
    (err) => {
    console.error('ERROR: ' + err)
},)