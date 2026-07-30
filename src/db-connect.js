const { Pool } = require('pg');
const {
    SecretsManagerClient,
    GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');
const fs = require('fs')

let dbPool

const connectDB = async () => {
    try {
    const secretClient = new SecretsManagerClient({});

    const response = await secretClient.send(
        new GetSecretValueCommand({
            SecretId: 'write_read_rds_db',
        })
    );

    const secret = JSON.parse(response.SecretString);

    const baseConfig = {
        port: secret.port,
        database: secret.dbname,
        user: secret.username,
        password: secret.password,
        max: 5,
        idleTimeoutMillis: 30000,
    }

    const poolConfig = process.env.NODE_ENV === 'dev' ? {
        host: 'localhost',
        ...baseConfig,
            ssl: {

                rejectUnauthorized: false
            }
        } :
        {
            host: secret.host,
            ...baseConfig,
            ssl: {
                ca: fs.readFileSync(`${__dirname}/../certs/global-bundle.pem`, 'utf-8'),
                rejectUnauthorized: true
            }
        }

        dbPool = new Pool({
            ...poolConfig,
        })


        await dbPool.query('SELECT 1');
        console.log('Database connected');
    } catch (err){
        console.log(err)
        throw new Error('Database connection failed');
    }
}


process.on('SIGTERM', async () => {
    console.log('Closing database pool...');

    dbPool && await dbPool.end();

    process.exit(0);
});

const getDbPool = () => dbPool;

module.exports = {
    getDbPool,
    connectDB,
}






