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



var slaveConfig = {

    userName: 'jpidbuser',

    password: 'Chandan@123',

    server: 'jpi.database.windows.net',

    options: {

        database: 'jpil_Slave',

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



// HMMM>>>>>

// setInterval(async () => {

//     var date = new Date();

//     var data = Math.random();

//     var addDataResult = await addData(date, data);

//     console.log(addDataResult);

// }, 1000);

// setInterval(async () => {

//     var date = new Date();

//     var data = Math.random();


//     console.log(date, data);

// }, 3000);





var insertCounter = 0;
setInterval(async () => {
    
     var dataCount = checkTotalRows();
     

}, 8000);

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
    // console.log(JSON.stringify(masterData));
    // console.log(masterData.length);
    console.log("Entered into checkTotalRows")
    var selectCountQuery = `SELECT COUNT(*) FROM dbo.slovnaft_data`;
    var selectCount = await selectQuery(selectCountQuery);
    var totalCountData=selectCount[0];
    console.log(totalCountData[0].value);
    if(totalCountData[0].value>500){
        deleteRecords();
    }
    console.log("End of checkTotalRows")
}

async function deleteRecords() {
    
    console.log("Entered into deleteRecords")
    var selectCountQuery = `DELETE TOP(500) FROM dbo.slovnaft_data`;
    var selectCount = await deleteQuery(selectCountQuery);
    console.log("End of deleteRecords")
}

async function ingestDatatoSalveTBO(masterData) {
    // console.log(JSON.stringify(masterData));
    // console.log(masterData.length);
    var insertQuery = `INSERT INTO dbo.slovnaft_data (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit,TAG_REF_ID) VALUES `;
    var lastIndex = masterData.length - 1;
    var lastData = masterData[lastIndex];
    masterData.splice(lastIndex, 1);
    // console.log(masterData.length);
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

// setInterval(async () => {

//     // get data from master

//     var masterData = await getData();

//     //  console.log(masterData);

//     //var masterDataTI025 = await  (getData)TI025();



//     for (data of masterData) {

//         // console.log(data);

//         var massterData = await addDataToSalve(data);

//         insertCounter += 1;

//         console.log('insert' + insertCounter, massterData);

//     }















//     //console.log('masterData',masterData);

//     // var date = masterData[0].value;

//     // // console.log('converted date', date.;

//     // var data  = masterData[1].value;

//     // // add data to slave

//     //var addtoSalveResult = await addDataToSalve(masterData);

//     // var addtoSalveResultTI025 = await addDataToSalveTI025(masterDataTI025);

























//     //  console.log(addtoSalveResult);

//     // ingestData(date, data);





// }, 3000000);



// simulate

// setInterval(() => {

//     var date = new Date();

//     var data = Math.random();

//     console.log(date, data);

//     ingestData(date, data);

// }, 8000);



// Master data streaming Bottom temperature

var masterDataTime = moment('2017-11-20T16:00:00.000', 'YYYY-MM-DDTHH:mm:ss.SSS');

// setInterval(async () => {

//     var measureDate = masterDataTime.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');
//     console.log("check");
//     const masterDataResult = await queryData(queryModel.getFirstReactorBottom(measureDate));

//      console.log('master delta', masterDataResult[0].value);

//     var date = new Date();

//     ingestMasterData(masterDataResult[0].value, masterDataResult[1].value, queryModel.url.firstReactorBottom);

// }, 8000);


// // Master data streaming second Bottom temperature

// var masterDataTime = moment('2017-11-20T16:00:00.000', 'YYYY-MM-DDTHH:mm:ss.SSS');

// setInterval(async () => {

//     var measureDate = masterDataTime.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');
//     console.log("check");
//     const masterDataResult = await queryData(queryModel.getSecondReactorBottom(measureDate));

//      console.log('master delta', masterDataResult[0].value);

//     var date = new Date();

//     ingestMasterData(masterDataResult[0].value, masterDataResult[1].value, queryModel.url.secondReactorBottom);

// }, 8000);


// // Master data streaming third Bottom temperature

// var masterDataTime = moment('2017-11-20T16:00:00.000', 'YYYY-MM-DDTHH:mm:ss.SSS');

// setInterval(async () => {

//     var measureDate = masterDataTime.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');
//     console.log("check");
//     const masterDataResult = await queryData(queryModel.getThirdReactorBottom(measureDate));

//      console.log('master delta', masterDataResult[0].value);

//     var date = new Date();

//     ingestMasterData(masterDataResult[0].value, masterDataResult[1].value, queryModel.url.thirdReactorBottom);

// }, 8000);



// // streaming Top Temperature

// setInterval(async () => {

//     var measureDate = masterDataTime.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

//     const masterDataResult = await queryData(queryModel.getFirstReactorTop(measureDate));

//     // console.log('master delta', masterDataResult[0].value);

//     var date = new Date();

//     ingestMasterData(masterDataResult[0].value, masterDataResult[1].value, queryModel.url.firstReactorTop);

// }, 8000);



// // Streaming Middle Temperature

// setInterval(async () => {

//     var measureDate = masterDataTime.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

//     const masterDataResult = await queryData(queryModel.getFirstReactorMiddle(measureDate));

//     // console.log('master delta', masterDataResult[0].value);

//     var date = new Date();

//     ingestMasterData(masterDataResult[0].value, masterDataResult[1].value, queryModel.url.firstReactorMidde);

// }, 8000);



// // streaming first reactor top metrics

// setInterval(async () => {

//     var measureDate = masterDataTime.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

//     const masterDataResult = await queryData(queryModel.getFirstReactorTopMetric(measureDate));

//     // console.log('master delta', masterDataResult);

//     var date = new Date();

//     ingestMasterData(masterDataResult[0].value, masterDataResult[1].value, queryModel.url.firstReactorTopMetrics);

// }, 8000);



// // streaming first reactor middle metrics

// setInterval(async () => {

//     var measureDate = masterDataTime.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

//     const masterDataResult = await queryData(queryModel.getFirstReactorMiddleMetric(measureDate));

//     // console.log('master delta', masterDataResult);

//     var date = new Date();

//     ingestMasterData(masterDataResult[0].value, masterDataResult[1].value, queryModel.url.firstReactorMiddleMetrics);

// }, 8000);



// // streaming first reactor middle metrics

// setInterval(async () => {

//     var measureDate = masterDataTime.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

//     const masterDataResult = await queryData(queryModel.getFirstReactorBottomMetric(measureDate));

//     // console.log('master delta', masterDataResult);

//     var date = new Date();

//     ingestMasterData(masterDataResult[0].value, masterDataResult[1].value, queryModel.url.firstReactorBottomMetrics);

// }, 8000);



var logData = moment('2014-10-01T04:00:00.000', 'YYYY-MM-DDTHH:mm:ss.SSS');


function ingestData(date, data) {

    var options = {

        method: 'POST',

        uri: 'https://api.powerbi.com/beta/f66fae02-5d36-495b-bfe0-78a6ff9f8e6e/datasets/52d556af-135b-4cf5-9a6a-a30cc5de2900/rows?key=AJTqn2bjqUQIoXTyYU1U5TnZ8dbh3cKBasD2kjp84xqiCXOQayAMlp07PxOPsBdm4r%2FnsGwYCu26LBMsY3alEA%3D%3D',

        body: [{

            time: date.toJSON(),

            flawdata: data

        }],

        json: true // Automatically stringifies the body to JSON

    };
    rp(options)

        .then(function (parsedBody) {

            // POST succeeded...

            console.log('Data ingested');

        })

        .catch(function (err) {

            // POST Sfailed...

        });

}



function ingestMasterData(mesureDate, delta, url) {

    var convertedDate = moment();

    convertedDate = convertedDate.toJSON();

    // console.log(typeof(convertedDate));

    var options = {

        method: 'POST',

        uri: url,

        body: [{

            MeasureDate: convertedDate,

            MeasureValue: delta

        }],

        json: true // Automatically stringifies the body to JSON

    };



    rp(options)

        .then(function (parsedBody) {

            // POST succeeded...

            console.log('Data ingested');

        })

        .catch(function (err) {

            // POST Sfailed...

        });

}



function addData(date, data) {

    return new Promise((resolve, reject) => {

        var connection = new Connection(config);

        connection.on('connect', function (err) {

            if (err) {

                console.log(err);

                reject(err);

            } else {

                var request = new Request(

                    `

                    INSERT INTO MachineFlawMaster (date, data) VALUES ('${date.toJSON()}', ${data})

                    `,

                    function (err, rowCount) {

                        if (err) {

                            reject(err);

                        } else {

                            // console.log(rowCount);

                            resolve(rowCount);

                        }

                    }

                );

                connection.execSql(request);

            }

        });

    })

}



var insertCounter = 0;

async function addDataToSalve(insertquery) {

    // console.log(data[1].value);

    return new Promise((resolve, reject) => {

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                console.log(err);

                connection.close();

                reject(err);

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

                                connection.close();

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

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                console.log(err);

                connection.close();

                reject(err);

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
                                console.log("query working");
                                 console.log(rowCount);
                                 console.log(rows);
                                connection.close();

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

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                console.log(err);

                connection.close();

                reject(err);

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
                                 console.log(rowCount);
                                
                                connection.close();

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


var insertCounterTI025 = 0;

async function addDataToSalveTI025(data) {

    // console.log(data[1].value);

    return new Promise((resolve, reject) => {

        var connection = new Connection(slaveConfig);

        connection.on('connect', function (err) {

            if (err) {

                console.log(err);

                reject(err);

            } else {

                // console.log('date',date);

                var tagNumber, measureDate, measureValue, id;



                if (insertCounterTI025 <= 5000) {

                    var request = new Request(

                        `

                     INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')

                     `,

                        function (err, rowCount) {

                            if (err) {

                                reject(err);

                            } else {

                                // console.log(rowCount);

                                insertCounterTI025 += 1;
                                connection.close();
                                resolve(rowCount);

                            }

                        }

                    );

                    connection.execSql(request);

                }

            }

        });

    })

    // console.log('recv', typeof(date));

}











var insertCounterAI033 = 0;



async function addDataToSalveAI033(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterAI033 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterAI033 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterAI034 = 0;


async function addDataToSalveAI034(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterAI034 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterAI034 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterAI035 = 0;


async function addDataToSalveAI035(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterAI035 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterAI035 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}




var insertCounterAI061 = 0;


async function addDataToSalveAI061(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterAI061 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterAI061 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}


var insertCounterAI062 = 0;


async function addDataToSalveAI062(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterAI062 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterAI062 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}


var insertCounterAI063 = 0;


async function addDataToSalveAI063(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterAI063 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterAI063 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}




var insertCounterAI064 = 0;


async function addDataToSalveAI064(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterAI064 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterAI064 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}


var insertCounterAI065 = 0;


async function addDataToSalveAI065(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterAI065 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterAI065 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}




var insertCounterFI003 = 0;


async function addDataToSalveFI003(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterFI003 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterFI003 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}


var insertCounterFI004 = 0;


async function addDataToSalveFI004(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterFI004 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterFI004 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterFI005 = 0;


async function addDataToSalveFI005(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterFI005 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterFI005 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterFI006 = 0;


async function addDataToSalveFI006(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterFI006 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterFI006 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterFI008 = 0;


async function addDataToSalveFI008(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterFI008 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterFI008 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterFI013 = 0;


async function addDataToSalveFI013(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterFI013 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterFI013 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterFI014 = 0;


async function addDataToSalveFI014(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterFI014 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterFI014 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterFI020 = 0;


async function addDataToSalveFI020(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterFI020 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterFI020 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterFI021 = 0;


async function addDataToSalveFI021(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterFI021 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterFI021 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterFI027 = 0;


async function addDataToSalveFI027(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterFI027 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterFI027 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterFI028 = 0;


async function addDataToSalveFI028(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterFI028 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterFI028 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterFI036 = 0;


async function addDataToSalveFI036(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterFI036 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterFI036 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterFI037 = 0;


async function addDataToSalveFI037(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterFI037 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterFI037 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterFI046 = 0;


async function addDataToSalveFI046(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterFI046 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterFI046 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterFI048 = 0;


async function addDataToSalveFI048(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterFI048 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterFI048 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterFI049 = 0;


async function addDataToSalveFI049(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterFI049 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterFI049 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterFI052 = 0;


async function addDataToSalveFI052(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterFI052 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterFI052 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterFI053 = 0;


async function addDataToSalveFI053(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterFI053 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterFI053 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterFI054 = 0;


async function addDataToSalveFI054(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterFI054 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterFI054 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterLI001 = 0;


async function addDataToSalveLI001(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterLI001 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterLI001 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterLI002 = 0;


async function addDataToSalveLI002(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterLI002 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterLI002 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterPI007 = 0;


async function addDataToSalvePI007(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterPI007 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterPI007 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterPI047 = 0;


async function addDataToSalvePI047(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterPI047 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterPI047 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterPI060 = 0;


async function addDataToSalvePI060(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterPI060 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterPI060 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI009 = 0;


async function addDataToSalveTI009(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI009 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI009 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI010 = 0;


async function addDataToSalveTI010(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI010 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI010 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI011 = 0;


async function addDataToSalveTI011(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI011 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI011 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI012 = 0;


async function addDataToSalveTI012(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI012 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI012 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI015 = 0;


async function addDataToSalveTI015(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI015 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI015 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI016 = 0;


async function addDataToSalveTI016(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI016 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI016 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI017 = 0;


async function addDataToSalveTI017(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI017 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI017 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI019 = 0;


async function addDataToSalveTI019(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI019 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI019 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}




var insertCounterTI022 = 0;


async function addDataToSalveTI022(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI022 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI022 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI023 = 0;


async function addDataToSalveTI023(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI023 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI023 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI024 = 0;


async function addDataToSalveTI024(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI024 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI024 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI026 = 0;


async function addDataToSalveTI026(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI026 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI026 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI029 = 0;


async function addDataToSalveTI029(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI029 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI029 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI030 = 0;


async function addDataToSalveTI030(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI030 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI030 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI031 = 0;


async function addDataToSalveTI031(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI031 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI031 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI032 = 0;


async function addDataToSalveTI032(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI032 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI032 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI038 = 0;


async function addDataToSalveTI038(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI038 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI038 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI039 = 0;


async function addDataToSalveTI039(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI039 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI039 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI040 = 0;


async function addDataToSalveTI040(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI040 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI040 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI041 = 0;


async function addDataToSalveTI041(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI041 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI041 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI042 = 0;


async function addDataToSalveTI042(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI042 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI042 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI043 = 0;


async function addDataToSalveTI043(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI043 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI043 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI044 = 0;


async function addDataToSalveTI044(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI044 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI044 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI045 = 0;


async function addDataToSalveTI045(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI045 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI045 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI050 = 0;


async function addDataToSalveTI050(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI050 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI050 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI051 = 0;


async function addDataToSalveTI051(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI051 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI051 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI055 = 0;


async function addDataToSalveTI055(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI055 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI055 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI056 = 0;


async function addDataToSalveTI056(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI056 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI056 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI057 = 0;


async function addDataToSalveTI057(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI057 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI057 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI058 = 0;


async function addDataToSalveTI058(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI058 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI058 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI059 = 0;


async function addDataToSalveTI059(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI059 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI059 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI066 = 0;


async function addDataToSalveTI066(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI066 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI066 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI067 = 0;


async function addDataToSalveTI067(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI067 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI067 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


            }


        });


    })


    // console.log('recv', typeof(date));


}






var insertCounterTI068 = 0;


async function addDataToSalveTI068(data) {


    // console.log(data[1].value);


    return new Promise((resolve, reject) => {


        var connection = new Connection(slaveConfig);


        connection.on('connect', function (err) {


            if (err) {


                console.log(err);


                reject(err);


            } else {


                // console.log('date',date);


                var tagNumber, measureDate, measureValue, id;






                if (insertCounterTI068 <= 5000) {


                    var request = new Request(


                        `


                      INSERT INTO dbo.slovnaft_data2 (Tag_Number_ID, Measure_Date, Measure_Value, Company, Unit) VALUES ('${data[0].value}', '${data[1].value.toJSON()}', '${data[2].value}', '${data[3].value}', '${data[4].value}')


                      `,


                        function (err, rowCount) {


                            if (err) {


                                reject(err);


                            } else {


                                // console.log(rowCount);


                                insertCounterTI068 += 1;


                                resolve(rowCount);


                            }


                        }


                    );


                    connection.execSql(request);


                }


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

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT  Tag_Number_ID, Measure_Date, Measure_Value, Company,Unit,TAG_REF_ID from dbo.slovnaft_data2 WHERE Measure_Date =  '${measureDate}'

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



function getDataTI025() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI025'

                    `,

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







function getDataLI001() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'LI001'

                    `,

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











function getDataLI002() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'LI002'

                    `,

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















function getDataFI003() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'FI003'

                    `,

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





function getDataFI004() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'FI004'

                    `,

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





function getDataFI005() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'FI005'

                    `,

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





function getDataFI006() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'FI006'

                    `,

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





function getDataPI007() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'PI007'

                    `,

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





function getDataFI008() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'FI008'

                    `,

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





function getDataPI008() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'PI008'

                    `,

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



function getDataTI009() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI009'

                    `,

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



function getDataTI010() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI010'

                    `,

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









function getDataTI011() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI011'

                    `,

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





function getDataTI012() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI012'

                    `,

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





function getDataFI013() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'FI013'

                    `,

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





function getDataFI014() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'FI014'

                    `,

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





function getDataTI015() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI015'

                    `,

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





function getDataTI016() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI016'

                    `,

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







function getDataTI017() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI017'

                    `,

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





function getDataTI018() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI018'

                    `,

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







function getDataTI019() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI019'

                    `,

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







function getDataFI020() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'FI020'

                    `,

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







function getDataFI021() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'FI021'

                    `,

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





function getDataTI022() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI022'

                    `,

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







function getDataTI023() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI023'

                    `,

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







function getDataTI024() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI024'

                    `,

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









function getDataTI026() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI026'

                    `,

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







function getDataFI027() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'FI027'

                    `,

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









function getDataFI028() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'FI028'

                    `,

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







function getDataTI029() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI029'

                    `,

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







function getDataTI030() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI030'

                    `,

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









function getDataTI031() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI031'

                    `,

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







function getDataTI032() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI032'

                    `,

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







function getDataAI033() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'AI033'

                    `,

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







function getDataAI034() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'AI034'

                    `,

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







function getDataAI035() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'AI035'

                    `,

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







function getDataFI036() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'FI036'

                    `,

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





function getDataFI037() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'FI037'

                    `,

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







function getDataTI038() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI038'

                    `,

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







function getDataTI039() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI039'

                    `,

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









function getDataTI040() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI040'

                    `,

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









function getDataTI041() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI041'

                    `,

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









function getDataTI042() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI042'

                    `,

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







function getDataTI043() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI043'

                    `,

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







function getDataTI044() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI044'

                    `,

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











function getDataTI045() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI045'

                    `,

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









function getDataFI046() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'FI046'

                    `,

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







function getDataPI047() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'PI047'

                    `,

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









function getDataPI060() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'PI060'

                    `,

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







function getDataFI049() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'FI049'

                    `,

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









function getDataTI050() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'FI050'

                    `,

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







function getDataTI051() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI051'

                    `,

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







function getDataFI052() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'FI052'

                    `,

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









function getDataFI053() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'FI053'

                    `,

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







function getDataFI054() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'FI054'

                    `,

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









function getDataTI055() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI055'

                    `,

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









function getDataTI056() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI056'

                    `,

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







function getDataTI057() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI057'

                    `,

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





function getDataTI058() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI058'

                    `,

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







function getDataTI059() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI059'

                    `,

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















function getDataAI061() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'AI061'

                    `,

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





function getDataAI062() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'AI062'

                    `,

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











function getDataAI063() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'AI063'

                    `,

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











function getDataAI064() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'AI064'

                    `,

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













function getDataAI065() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'AI065'

                    `,

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















function getDataTI066() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI066'

                    `,

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







function getDataTI067() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI067'

                    `,

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









function getDataTI068() {

    return new Promise((resolve, reject) => {

        var measureDate = masterDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss.SSS');

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

            } else {

                var request = new Request(

                    `

                    SELECT TOP 1 A.Tag_Number_ID, A.Measure_Date, A.Measure_Value, B.Company,B.Unit from dbo.slovnaft_data_backup A INNER JOIN dbo.TAG_REF2 B on A.Tag_Number_ID=B.Tag_Number_ID WHERE A.Measure_Date = '${measureDate}' and A.Tag_Number_ID = 'TI068'

                    `,

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































// listen to incomming requests

server.listen(port, function () {

    console.log('Server started on *: ' + port);

});



// capture server start errors

server.on('error', function (error) {

    console.log("Error in start", error);

})



function insertData(query) {

    return new Promise((resolve, reject) => {

        var connection = new Connection(slaveConfig);

        connection.on('connect', function (err) {

            if (err) {

                console.log(err);

                reject(err);

            } else {

                // console.log('date',date);

                var request = new Request(

                    query,

                    function (err, rowCount) {

                        if (err) {

                            reject(err);

                        } else {

                            // console.log(rowCount);

                            resolve(rowCount);

                        }

                    }

                );

                connection.execSql(request);

            }

        });

    })

}



function queryData(query) {

    return new Promise((resolve, reject) => {

        var connection = new Connection(configMaster);

        connection.on('connect', function (err) {

            if (err) {

                reject(err);

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
