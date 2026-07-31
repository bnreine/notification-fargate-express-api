const {getDbPool} = require('./db-connect')
const Ajv = require("ajv")
const addFormats = require("ajv-formats")
const schema = require("./request-body-schema")
const hal = require('halson')


const ajv = new Ajv()
addFormats(ajv)


const validate = ajv.compile(schema)


class Configuration {
    async list(req, res) {

    }

    async post(req, res) {
        try {
            const userId = req.user.username
            const dbPool = getDbPool();

            console.log('body: ', req.body)

            const valid = validate(req.body)
            if (!valid){
                return res.status(400).json({
                    error: {details : validate.errors, message: "client validation error"}
                });
            }

            const {enabled, config} = req.body;

            const id = crypto.randomUUID();
            const createdAt = new Date().toISOString();

            await dbPool.query(
                'INSERT INTO "NotificationConfig" ("Id", "userId", "config", "enabled", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)',
                [id, userId, config, enabled, createdAt, createdAt]
            );

            const queryString = `select * from  "NotificationConfig" where "Id" = '${id}'`

            const response = await dbPool.query(
                queryString
            );

            const newConfig = response.rows[0]
            console.log(newConfig);
            const location = `${req.protocol}://${req.get("host")}/configurations/${id}`;

            const resource = hal(newConfig).addLink('self', location);
            return res.status(201).location(location).json(resource);
        } catch (err){
            return res.status(500).json({
                error: {details : err.message, message: "internal server error"}
            });
        }
    }

    async get(req, res) {

    }

    async delete(req, res) {
        try {
            const userId = req.user.username
            const id = req.params.configurationId;

            const dbPool = getDbPool();

            const response = await dbPool.query(
                'DELETE from "NotificationConfig" where "Id" = $1 and "userId" = $2',
                [id, userId]
            );

            console.log(response);

            if(response.rowCount === 0){
                return res.status(404).json({
                    error: {
                        code: "NOT_FOUND",
                        message: "Configuration not found."
                    }
                });
            }

            return res.sendStatus(204);
        } catch (err){
            return res.status(500).json({
                error: {details : err.message, message: "internal server error"}
            });
        }
    }

    async put(req,res) {
        // validate the body
    }
}

module.exports = Configuration;