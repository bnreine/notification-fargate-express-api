const {getDbPool} = require('./db-connect')
const Ajv = require("ajv")
const addFormats = require("ajv-formats")
const schema = require("./request-body-schema")
const hal = require('halson')


const ajv = new Ajv()
addFormats(ajv)


const validate = ajv.compile(schema)

const api2NotificationHost = 'api2.notifications.benjaminreinecke.click'

class Configuration {
    async list(req, res) {
        try {
            const userId = req.user.username
            const dbPool = getDbPool();

            const DEFAULT_LIMIT = 20;
            const MAX_LIMIT = 100;

            const parsedLimit = parseInt(req.query.limit, 10);
            const parsedOffset = parseInt(req.query.offset, 10);
            const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
                ? Math.min(parsedLimit, MAX_LIMIT)
                : DEFAULT_LIMIT;
            const offset = Number.isFinite(parsedOffset) && parsedOffset >= 0
                ? parsedOffset
                : 0;

            const response = await dbPool.query(
                'SELECT * FROM "NotificationConfig" WHERE "userId" = $1 ORDER BY "updatedAt" DESC, "Id" DESC LIMIT $2 OFFSET $3',
                [userId, limit + 1, offset]
            );

            const hasMore = response.rows.length > limit;
            const rows = hasMore ? response.rows.slice(0, limit) : response.rows;

            const baseUrl = `${req.protocol}://${req.get("host")}/configurations`;
            const preferencesBaseUrl = `${req.protocol}://${api2NotificationHost}/configurations`;
            const configurations = rows.map((row) => {
                const location = `${baseUrl}/${row.Id}`;
                const preferencesLocation = `${preferencesBaseUrl}/${row.Id}/preferences`;
                return hal(row).addLink('self', location).addLink('configurationPreferences', preferencesLocation);
            });

            const selfUrl = `${baseUrl}?limit=${limit}&offset=${offset}`;
            const collection = hal({ count: configurations.length, hasMore })
                .addLink('self', selfUrl)
                .addEmbed('configurations', configurations);

            if (hasMore) {
                collection.addLink('next', `${baseUrl}?limit=${limit}&offset=${offset + limit}`);
            }
            if (offset > 0) {
                const prevOffset = Math.max(offset - limit, 0);
                collection.addLink('prev', `${baseUrl}?limit=${limit}&offset=${prevOffset}`);
            }

            return res.json(collection);
        } catch (err) {
            return res.status(500).json({
                error: {details : err.message, message: "internal server error"}
            });
        }
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

            const response = await dbPool.query(
                'INSERT INTO "NotificationConfig" ("Id", "userId", "config", "enabled", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [id, userId, config, enabled, createdAt, createdAt]
            );

            const newConfig = response.rows[0]
            console.log(newConfig);
            const location = `${req.protocol}://${req.get("host")}/configurations/${id}`;
            const preferencesLocation = `${req.protocol}://${api2NotificationHost}/configurations/${id}/preferences`;

            const resource = hal(newConfig).addLink('self', location).addLink('configurationPreferences', preferencesLocation);
            return res.status(201).location(location).json(resource);
        } catch (err){
            return res.status(500).json({
                error: {details : err.message, message: "internal server error"}
            });
        }
    }

    async get(req, res) {
        try {
            const userId = req.user.username
            const id = req.params.configurationId;
            const dbPool = getDbPool();

            const response = await dbPool.query(
                'SELECT * FROM "NotificationConfig" WHERE "Id" = $1 AND "userId" = $2',
                [id, userId]
            );

            if (response.rowCount === 0) {
                return res.status(404).json({
                    error: {
                        code: "NOT_FOUND",
                        message: "Configuration not found."
                    }
                });
            }

            const config = response.rows[0];
            const location = `${req.protocol}://${req.get("host")}/configurations/${id}`;
            const preferencesLocation = `${req.protocol}://${api2NotificationHost}/configurations/${id}/preferences`;
            const resource = hal(config).addLink('self', location).addLink('configurationPreferences', preferencesLocation);
            return res.json(resource);
        } catch (err) {
            return res.status(500).json({
                error: {details : err.message, message: "internal server error"}
            });
        }
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
        try {
            const userId = req.user.username
            const id = req.params.configurationId;
            const dbPool = getDbPool();

            console.log('body: ', req.body)

            const valid = validate(req.body)
            if (!valid){
                return res.status(400).json({
                    error: {details : validate.errors, message: "client validation error"}
                });
            }

            const {enabled, config} = req.body;

            const updatedAt = new Date().toISOString();

            const response = await dbPool.query(
                'UPDATE "NotificationConfig" SET "config" = $1, "enabled" = $2, "updatedAt" = $3 where "Id" = $4 and "userId" = $5 RETURNING *',
                [config, enabled, updatedAt, id, userId]
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


            const newConfig = response.rows[0]
            console.log(newConfig);
            const location = `${req.protocol}://${req.get("host")}/configurations/${id}`;
            const preferencesLocation = `${req.protocol}://${api2NotificationHost}/configurations/${id}/preferences`;

            const resource = hal(newConfig).addLink('self', location).addLink('configurationPreferences', preferencesLocation);
            return res.status(200).json(resource);
        } catch (err){
            return res.status(500).json({
                error: {details : err.message, message: "internal server error"}
            });
        }
    }
}

module.exports = Configuration;