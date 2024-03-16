const mysql = require('mysql');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Configurations.
const config = require('../config');
const region = config.region;
const secretName = config.secretName;
const tableName = config.dbTableName;
const connectionPoolLimit = config.dbConnectionPoolLimit;
const usernameMinLength = config.usernameMinLength;
const usernameMaxLength = config.usernameMaxLength;
const idMinLength = config.idMinLength;
const idMaxLength = config.idMaxLength;
const ipMinLength = config.ipMinLength;
const ipMaxLength = config.ipMaxLength

// AWS Secret Manager client.
const client = new SecretsManagerClient({
    region
});

// DB Connection pool variable.
let pool;

/**
 * The function 'getSecret' gets as an argument the secret name.
 * It returns the secret object from AWS Secrets Manager.
 */
async function getSecret(AwsSecretName) {
    try {
        const input = {
            SecretId: AwsSecretName
        };
        const command = new GetSecretValueCommand(input);
        const res = await client.send(command);
        
        console.log(`Secret [${AwsSecretName}] retrieved successfully.`);
        return JSON.parse(res.SecretString);
    } catch (err) {
        console.error(`Failed to retreive secret with the name [${AwsSecretName}]:`, err);
        throw new Error(err);
    }
}

/**
 * The function 'createConnectionPool' creates a rds connection pool.
 */
(async function createConnectionPool(){
    // Retrieve secret.
    const rdsSecret = await getSecret(secretName);
    const rdsEndpoint = rdsSecret.endpoint;
    const dbUsername = rdsSecret.username;
    const dbPwd = rdsSecret.pwd;
    const dbPort = rdsSecret.port;
    const dbName = rdsSecret.dbName;

    try {
        console.log('Creating connection pool.');
        pool = mysql.createPool({
            connectionLimit: connectionPoolLimit,
            host: rdsEndpoint,
            user: dbUsername,
            password: dbPwd,
            database: dbName,
            port: dbPort
        });
    } catch (err) {
        console.error('RDS connection pool creation failed:', err);
        throw new Error(err);
    }
}());


/**
 * The function 'executeQuery' gets as arguments the query string and the query's values.
 * Its gets a connection from the db connection pool and runs the query.
 * It returns a promise of the query's results/error.
 */
function executeQuery(query, values) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error connection to db:', err);
                reject(err);
                return;
            }

            connection.query(query, values, (err, results) => {
                connection.release();
                if (err) {
                    console.error('Query execution failed:', err);
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    });
}

/**
 * The function 'isIdExists' gets as an argument an id.
 * It returns true if this id already exists in the DB, false otherwise.
 */
async function isIdExists(id) {
    // const selectQuery = `SELECT username FROM ${tableName} WHERE id = ?`;
    const selectQuery = `SELECT 1 FROM ${tableName} WHERE id = ?`;
    const values = [id];

    try {
        const results = await executeQuery(selectQuery, values);
        if (results.length > 0) {
            return true;
        }
        return false;
    } catch (err) {
        console.error('Failed to check for id existance:', err);
        throw new Error(err);
    }
}


// Assuming all inputs are strings.
/**
 * The function 'validateInput' gets as arguments the input, its min and max length and the regex validation.
 * It return 'false' if the input invalid, or 'true' otherwise.
 * 
 * (Assuming all inputs are strings.)
 */
function validateInput(input, minLength, maxLength, regex) {
    if (typeof(input) !== 'string') {
        console.log('Input is not a string type.');
        return false;
    }
    if (input.length < minLength || input.length > maxLength) {
        console.log('Input invalid length.');
        return false;
    }
    if (!regex.test(input)) {
        console.log('Input contains invalid characters.');
        return false;
    }

    return true;

}

/**
 * The function 'validateUsername' gets as an argument the username input.
 * It return 'false' if the input invalid, or 'true' otherwise.
 */
function validateUsername(username) {
    // Starts and ends with [a-z] or [A-Z], and can contain also numbers and '-'.
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9-]*[a-zA-Z]$/;
    return validateInput(username, usernameMinLength, usernameMaxLength, usernameRegex);
}

/**
 * The function 'validateId' gets as an argument the id input.
 * It return 'false' if the input invalid, or 'true' otherwise.
 */
function validateId(id) {
    // Only digits.
    const idRegex = /^\d+$/;
    return validateInput(id, idMinLength, idMaxLength, idRegex);
}

/**
 * The function 'validateUsername' gets as an argument the ip.
 * It return 'false' if the ip invalid, or 'true' otherwise.
 */
function validateIp(ip) {
    // Contains [a-f], [A-f], digits, '.' or ':'.
    const ipRegex = /^[a-fA-F0-9.:]+$/;
    return validateInput(ip, ipMinLength, ipMaxLength, ipRegex);
}

/**
 * The function 'createUser' gets in the request body a username and an id.
 * It adds a new record in the db with the user details.
 */
async function createUser(req, res) {
    const { username, id } = req.body;
    const usernameLowCase = username.toLowerCase();
    const ip = req.ip;

    // Input and arguments validation.
    if (!validateUsername(username) || !validateId(id)) {
        console.error("Input invalidation.");
        return res.status(400).json({ error: 'Input invalidation.' });
    }
    if (!validateIp(ip)) {
        console.error(`Couldn't retrieve the IP.`);
        return res.status(500).json({ error: 'Failed retrieving the IP.' });
    }

    // Verifying id uniqueness.
    if (await isIdExists(id)) {
        console.error('ID already exists.');
        return res.status(409).json({ error: 'ID already exists.' });
    }

    // User creation.
    const insertQuery = `INSERT INTO ${tableName} (username, id, ip) VALUES (?, ?, ?)`;
    const values = [usernameLowCase, id, ip];
    try {
        console.log(`Creating user [${usernameLowCase}].`);
        await executeQuery(insertQuery, values);
        res.json({ message: 'User created successfully.' });
    } catch (err) {
        console.error('Failed to create user:', err);
        res.status(500).json({ error: 'Failed to create user.' });
    }
}

/**
 * The function 'getId' gets as a query param the username.
 * It returns the username id.
 */
async function getId(req, res) {
    const { username } = req.query;
    const ip = req.ip;
    
    // Input and arguments validation.
    if (!validateUsername(username)) {
        console.error("Input invalidation.");
        return res.status(400).json({ error: 'Input invalidation.' });
    }
    if (!validateIp(ip)) {
        console.error(`Couldn't retrieve the IP.`);
        return res.status(500).json({ error: 'Failed retrieving the IP.' });
    }
    
    // Retrieving id.
    // Case insensitive search.
    const selectQuery = `SELECT id, ip FROM ${tableName} WHERE username = ?`;
    const values = [username];
    try {
        console.log(`Retrieving ID(s).`);
        const results = await executeQuery(selectQuery, values);
        if (results.length > 0) {
            // Only ids corresponds to the requester ip.
            const ids = results.filter(obj => obj.ip === ip).map(obj => obj.id);

            if (ids.length) {
                console.log(`ID(s) rerieved successfully.`);
                res.json({ id: ids });
            } else {
                console.error(`Unauthorized.`);
                res.status(401).json({ message: 'Unauthorized.' });
            }
        } else {
            console.log(`User not found.`);
            res.status(404).json({ message: 'User not found.' });
        }
    } catch(err) {
        console.error('Failed to retrieve ID:', err);
        res.status(500).json({ error: 'Failed to retrieve ID.' });
    }
}


module.exports = {
    createUser,
    getId,
};