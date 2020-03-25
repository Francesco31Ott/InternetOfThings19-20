AWS.config.region = "us-east-1";
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: "us-east-1:f79208a2-a26f-4c2b-be6d-ec367432dded"
});

/*
  // The endpoint should point to the local or remote computer where DynamoDB (downloadable) is running.
  endpoint: 'https://a3um1mnv6jt2hg-ats.iot.us-east-1.amazonaws.com',
  /*
    accessKeyId and secretAccessKey defaults can be used while using the downloadable version of DynamoDB. 
    For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
  *//*
accessKeyId: "ASIARWJDDJX22HK2QSMC",
secretAccessKey: "1ANToxWyQy0G2W1nN3vfjLSfeHajLf72whxR4rSa"
});*/
/* 
   Uncomment the following code to configure Amazon Cognito and make sure to 
   remove the endpoint, accessKeyId and secretAccessKey specified in the code above. 
   Make sure Cognito is available in the DynamoDB web service region (specified above).
   Finally, modify the IdentityPoolId and the RoleArn with your own.
*/
/*
  // Inizializza il provider di credenziali Amazon Cognito
CognitoCachingCredentialsProvider credentialsProvider = new CognitoCachingCredentialsProvider(
    getApplicationContext(),
    "us-east-1:f79208a2-a26f-4c2b-be6d-ec367432dded", // ID pool di identità
    Regions.US_EAST_1 // Regione
);
*/

/*
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
IdentityPoolId: "us-east-1:f79208a2-a26f-4c2b-be6d-ec367432dded",
RoleArn: "arn:aws:iam::116574604789:role/service-role/IoTDynamo"
});
*/
// set up connection with dynamodb
var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

// list of station in the db
var stations = new Set();

// function that get the last value from the table.
// since that the oldest value is the first of the list,
// I have to reverse this list and take the first tuple
function getLatestValue() {
    var params = {
        ExpressionAttributeNames: {
            "#id": "id"
        },
        ProjectionExpression: '#id',
        TableName: 'EnvironmentalStationDB'
    };

    docClient.scan(params, onScan);

    function onScan(err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            data.Items.forEach(function (element) {
                stations.add(element.id);
            });
            stations = Array.from(stations);
            stations.sort();
            console.log("success", stations);

            var currentDate = new Date();
            currentDate.setHours(currentDate.getHours() - 1);

            console.log("ciao " + currentDate.getTime());

            stations.forEach(function (id) {
                //Parameters of the query.
                var params = {
                    TableName: "EnvironmentalStationDB",
                    ProjectionExpression: "#dtime, temperature, humidity, windDirection, windIntensity, rainHeight",
                    KeyConditionExpression: "id = :stationId",
                    ExpressionAttributeNames: {
                        "#dtime": "datetime"
                    },
                    ExpressionAttributeValues: {
                        ":stationId": id
                    }
                };

                console.log("prova", id);


                //Queries the data from the selected station.
                docClient.query(params, function (err, data) {
                    if (err) {
                        console.log("Error", err);
                    } else {
                        //console.log("success", data.Items.reverse()[0]);
                        //Exploiting the fact that the data is already ordered.
                        var latest = data.Items.reverse()[0];
                        console.log("success", latest);
                        var c;


                        //insert latest value for each sensor
                        document.getElementById('latest-value1').innerHTML = latest.temperature + ' °C';
                        document.getElementById('latest-value2').innerHTML = latest.humidity + '%';
                        document.getElementById('latest-value3').innerHTML = latest.windDirection + '°';
                        document.getElementById('latest-value4').innerHTML = latest.windIntensity + ' m/s';
                        document.getElementById('latest-value5').innerHTML = latest.rainHeight + ' mm/h';

                        //change update on the cards
                        for (c = 1; c < 6; c++) {
                            document.getElementById('update' + c).innerHTML = '<i class="material-icons">update</i> Just Updated by Station ' + id;
                        }

                        //insert latest tuple for each station
                        var sizeList = Object.keys(data.Items).length;
                        console.log(sizeList);
                        var actual = data.Items;
                        for (c = 0; c < sizeList; c++) {
                            document.getElementById('station' + id).innerHTML += '<tr><td>' + actual[c].datetime + '</td><td>' + actual[c].temperature + '</td><td>' + actual[c].humidity + '</td><td>'
                                + actual[c].windDirection + '</td><td>' + actual[c].windIntensity + '</td><td>' + actual[c].rainHeight + '</td></tr> ';
                        }
                    }

                });
            });
        }
    };
}

// function that computes the time one hour ago
function computeDiff(tupleDate) {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds();

    var currentDateTime = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;

    const dateOneObj = new Date(dateOne);
    const dateTwoObj = new Date(currentDateTime);
    const milliseconds = Math.abs(dateTwoObj - dateOneObj);
    const hours = milliseconds / 36e5;

    return hours;
}

// function that returns the actual time
// (it serves for the 'LastHour' query)
function getTimeNow() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds();

    if (month < 10) {
        month = '0' + month;
    }
    if (day < 10) {
        day = '0' + day;
    }
    if (hour < 10) {
        hour = '0' + hour;
    }
    if (minute < 10) {
        minute = '0' + minute;
    }
    if (second < 10) {
        second = '0' + second;
    }

    var currentDateTime = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
    var datetimeOneHour = year + '-' + month + '-' + day + ' ' + (hour - 1) + ':' + minute + ':' + second;
    var dateTimeLast = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + (second - 5);
    return current;
}
/*function insertData(i) {
    console.log("Ecco lo script");
    document.getElementById('latest-value1').innerHTML = i + " °C";
    document.getElementById('latest-value2').innerHTML = i + "%";
    document.getElementById('latest-value3').innerHTML = i + "°";
    document.getElementById('latest-value4').innerHTML = i + " m/s";
    document.getElementById('latest-value5').innerHTML = i + " mm/h";
 
    // sleep time expects milliseconds
    function sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }
}*/

function getLastHourData(sensor) {
    var dateTime = computeDiff();
    var params = {
        TableName: "EnvironmentalStationDB",
        ProjectionExpression: "id, dtime",
        KeyConditionExpression: "#dtime between " + dateTime + " and #dtime",
        FilterExpression: sensor + " = :sensor",
        ExpressionAttributeValues: {
            ":hour": 1,
            ":sensor": sensor
        }
    };

    docClient.query(params, function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            document.getElementById('id' + sensor).innerHTML += '<tr><td>' + '2020-03-25 10:56:37' + '</td><td>' + latest.id + '</td><td>' + latest.sensor + '</td></tr> ';

        }
    });
}
