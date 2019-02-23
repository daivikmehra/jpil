const express = require('express');

const cors = require('cors');

const app = express();

const bodyParser = require('body-parser');

const appConfig = require('./config/app.config');

const rp = require('request-promise');

var tedious = require('tedious');

var moment = require('moment');

var Connection = tedious.Connection;

var Request = tedious.Request;

const queryModel = require('./models/query.model');



console.log('description', 'APP init');





var configMaster = {

    userName: 'jpidbuser',

    password: 'Chandan@123',

    server: 'jpi.database.windows.net',

    options: {

        database: 'jpil',

        encrypt: true,

        rowCollectionOnRequestCompletion: true

    }

}

// enable cors

app.use(cors(appConfig.corsOptions));

// support json payload requests

app.use(bodyParser.json());

// support encoded bodies

app.use(bodyParser.urlencoded({ extended: true }));



// init server

const server = require('http').createServer(app);

// pick port from env or use user defined & normalize port number

const port = normalizePort(process.env.PORT || '4000');



// set port to the app instance

app.set('port', port);



// routes for API

const router = express.Router();

// All APIs will start with / then the endpoint name

app.use('/', router);



// Register all routes here

require('./routes/test.route')(router);



/**

* Normalize a port into a number, string, or false.

*/

function normalizePort(portNumber) {

    var port = parseInt(portNumber, 10);

    if (isNaN(port)) {

        // named pipe

        return portNumber;

    }

    if (port >= 0) {

        // port number

        return port;

    }
    
    return false;

}

console.log('description', "started");

/*Set connection to the database */

var connection = new Connection(configMaster);

/*
 This method runs every 15 mins Check the records in the slovnaft2 data. If count increases from
 150000 delete 50000 records.
*/

var insertCounter = 0;
setInterval(async () => {
    
     var dataCount = checkTotalRows();
     
}, 900000);

/*
 This method runs every 8 secs fetches all the record for a particular time for all tags.
  Inserts into slovnaft_data2. If the total records have been inserted to the slovnaft_data2 
  then restart the total insertion process from start.
*/

setInterval(async () => {
    // get data from master
   var masterData = await getData();
     console.log('master data', masterData.length);
     if(masterData.length==0){
        masterDate = moment('2017-02-15T00:00:00.000', 'YYYY-MM-DDTHH:mm:ss.SSS');
     }
   ingestDatatoSalveTBO(masterData);
}, 8000);

async function checkTotalRows() {
    var selectCountQuery = `SELECT COUNT(*) FROM dbo.slovnaft_data2`;
    var selectCount = await selectQuery(selectCountQuery);
    var totalCountData=selectCount[0];
    console.log(totalCountData[0].value);
    if(totalCountData[0].value>100000){
        deleteRecords();
    }
   // console.log("End of checkTotalRows")
}

async function deleteRecords() {
    var datareqForDelete=masterDate;
    var measureDate1 = datareqForDelete.subtract(100, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');
   // console.log("Entered into deleteRecords")
    var deleteDataFromTableQuery = `DELETE  FROM dbo.slovnaft_data2 WHERE Measure_Date <  '${measureDate1}'`;
    var DeleteDataFromTable = await deleteQuery(deleteDataFromTableQuery);
   // console.log("End of deleteRecords")
}

async function ingestDatatoSalveTBO(masterData) {
    
    var insertQuery = `INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit,TAG_REF_ID) VALUES `;
    var lastIndex = masterData.length - 1;
    var lastData = masterData[lastIndex];
    masterData.splice(lastIndex, 1);
     console.log(masterData.length);
    for (data of masterData) {
        // console.log('In slave', data);
        insertQuery += `('${data[0].value}', '${data[1].value.toJSON()}', ${data[2].value}, '${data[3].value}', ${data[4].value}, ${data[5].value}),`
       
        insertCounter += 1;
       
    }
    // add the last one without trailing comma
    insertQuery += `('${data[0].value}', '${data[1].value.toJSON()}', ${data[2].value}, '${data[3].value}', ${data[4].value}, ${data[5].value})`;
    // console.log('insert query', insertQuery);
    var slaveInsertResult = await addDataToSalve(insertQuery);
    console.log('insert' + insertCounter, slaveInsertResult);
}




// Master data streaming Bottom temperature

var masterDataTime = moment('2017-11-20T16:00:00.000', 'YYYY-MM-DDTHH:mm:ss.SSS');





var logData = moment('2014-10-01T04:00:00.000', 'YYYY-MM-DDTHH:mm:ss.SSS');



var insertCounter = 0;

async function addDataToSalve(insertquery) {

    // console.log(data[1].value);

    return new Promise((resolve, reject) => {

        

        connection.on('connect', function (err) {

            if (err) {

                console.log(err);

                //connection.close();
                connection = new Connection(configMaster);
                //reject(err);

            } else {

                // console.log('date',date);

                var tagNumber, measureDate, measureValue, id;

               

                // if (insertCounter <= 5000) {

                    var request = new Request(
                        insertquery
                      ,

                        function (err, rowCount) {

                            if (err) {

                                reject(err);

                            } else {

                                // console.log(rowCount);

                               // connection.close();

                                insertCounter += 1;

                                resolve(rowCount);

                            }

                        }

                    );

                    connection.execSql(request);

                // }

            }

        });

    })

    // console.log('recv', typeof(date));

}


async function selectQuery(insertquery) {

    // console.log(data[1].value);
    console.log("Entered into selectQuery")
    return new Promise((resolve, reject) => {

        connection.on('connect', function (err) {

            if (err) {

                console.log(err);

                connection = new Connection(configMaster);

                //reject(err);

            } else {

                // console.log('date',date);

                var tagNumber, measureDate, measureValue, id;

               

                // if (insertCounter <= 5000) {

                    var request = new Request(
                        insertquery
                      ,

                        function (err, rowCount, rows) {

                            if (err) {

                                reject(err);

                            } else {
                                //console.log("query working");
                                // console.log(rowCount);
                                // console.log(rows);
                               // connection.close();

                               // insertCounter += 1;

                                resolve(rows);

                            }

                        }

                    );

                    connection.execSql(request);

                // }

            }

        });

    })

    // console.log('recv', typeof(date));

}


async function deleteQuery(deleteDataquery) {

    // console.log(data[1].value);
    console.log("Entered into deleteQuery")
    return new Promise((resolve, reject) => {

       

        connection.on('connect', function (err) {

            if (err) {

                console.log(err);
                
                connection = new Connection(configMaster);
                

                //reject(err);

            } else {

                // console.log('date',date);

                var tagNumber, measureDate, measureValue, id;

               

                // if (insertCounter <= 5000) {

                    var request = new Request(
                        deleteDataquery
                      ,

                        function (err, rowCount) {

                            if (err) {

                                reject(err);

                            } else {
                                console.log("delete query working");
                               //  console.log(rowCount);
                                
                               

                               // insertCounter += 1;

                                resolve(rowCount);

                            }

                        }

                    );

                    connection.execSql(request);

                // }

            }

        });

    })

    // console.log('recv', typeof(date));

}


var masterDate = moment('2017-02-15T00:00:00.000', 'YYYY-MM-DDTHH:mm:ss.SSS');

function getData() {

    return new Promise((resolve, reject) => {
        console.log(masterDate);
        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        connection.on('connect', function (err) {

            if (err) {
              console.log(err);
              connection = new Connection(configMaster);
               // reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT  Tag_Number_ID, Measure_Date, Measure_Value, Company,Unit,TAG_REF_ID from dbo.slovnaft_data WHERE Measure_Date =  '${measureDate}'

                    `,

                    function (err, rowCount, rows) {

                        if (err) {

                            reject(err)

                        } else {

                            resolve(rows);

                        }

                    }

                );

                connection.execSql(request);

            }

        });

    })

}



// listen to incomming requests

server.listen(port, function () {

    console.log('Server started on *: ' + port);

});


// capture server start errors

server.on('error', function (error) {

    console.log("Error in start", error);

})


function queryData(query) {

    return new Promise((resolve, reject) => {

        connection.on('connect', function (err) {

            if (err) {
                console.log(err);
                connection = new Connection(configMaster);
                //reject(err);

            } else {

                var request = new Request(query,

                    function (err, rowCount, rows) {

                        if (err) {

                            reject(err)

                        } else {

                            resolve(rows[0]);

                        }

                    }
                );
                connection.execSql(request);
            }
        });
    })
}
