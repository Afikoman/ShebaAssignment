const config = {
    // AWS config.
    region: 'us-east-1',
    secretName: 'rds-sheba-assignment',
    
    // API general config.
    apiPort: 3000,
    
    // DB config.
    dbTableName: 'afikusers',
    dbConnectionPoolLimit: 5,
    
    // Input validation config.
    usernameMinLength: 1,
    usernameMaxLength: 45,
    idMinLength: 1,
    idMaxLength: 9,
    ipMinLength: 1,
    ipMaxLength: 39
  };
  
  module.exports = config;