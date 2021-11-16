require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');


class Server {

    constructor(){
        this.app = express();
        this.port = process.env.PORT || 4000;
        this.middlewares();
        this.routes();
    }

    middlewares(){
        this.app.use( cors() );
        this.app.use(express.json());
        this.app.use(fileUpload({
            useTempFiles: true,
            tempFileDir: '/tmp/',
            createParentPath: true
        }));
    }

    routes(){
        this.app.use('/api-wc', require('../routes/api-wc'));
    }
    

    listen(){
        this.app.listen(this.port, () => {
            console.log(`APP Runnig in port ${this.port}`);
        });
    }

}

module.exports = Server;