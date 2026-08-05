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

    app.get("/health", (req, res) => {
        res.sendStatus(200);
    });

    app.get('/configurations', configurationInstance.list)

    app.get(`/configurations/:configurationId`, configurationInstance.get)

    app.post('/configurations', configurationInstance.post)

    app.put(`/configurations/:configurationId`, configurationInstance.put)

    app.delete(`/configurations/:configurationId`, configurationInstance.delete)

    app.listen(3030, () => {
        console.log("Listening on port 3030");
    });
}





start().then(()=>{},
    (err) => {
    console.error('ERROR: ' + err)
},)