/* eslint-disable prettier/prettier */



export default {
    "db": {
        "user": process.env.DB_USER,
        "pass": process.env.DB_PASS,
        "host": process.env.DB_HOST,
        "port": process.env.DB_PORT,
        "database": process.env.DB_DATABASE,
        "authSource": process.env.DB_AUTH_SOURCE
    },
    "host": {
        "url": "localhost",
        "port": 3000 
    },
    "jwt": {
        "secretOrKey": "secret",
        "expiresIn": 36000000
    },
    "mail":{
        "service":process.env.MAIL_SERVICE,
        "host": "smtp.gmail.com",
        "port": "587",
        "secure": false,
        "auth": {
            "user": "hiddenbookings58@gmail.com",
            "pass": "rxjfhcpgtxjisoxo",
        }
      
    }
};
