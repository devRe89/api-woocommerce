const fs = require('fs');
const csv = require('csvtojson');

const readAllFiles = dirname => {

    return new Promise((res, rej) => {
      fs.readdir(dirname, (error, filenames) => {
        if (error) {
          rej(error);
        } else {
          if ( filenames[0].split('.').pop() === 'csv' ) {
              res(filenames);
          } else {
              rej(false);
          } 
        }
      });
    });

};

const convertCsvToJson = (currentDir , [...arrayFiles]) => {

    return new Promise ((res, rej) => {
        let resCsv = [];
        arrayFiles.map( ( file ) => {
            const fullUrl = currentDir + file;
            csv()
                .fromFile(fullUrl)
                .subscribe( jsonCsv => {
                    resCsv.push(jsonCsv);
                })
                .then(() => {
                    res(resCsv);
                });
        });
    }).catch(err =>{ throw err} );

}

module.exports = {
    readAllFiles,
    convertCsvToJson
}