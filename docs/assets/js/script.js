// Configuration with AWS Cognito Identity Credentials.
AWS.config.region = "us-east-1";
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: "us-east-1:f79208a2-a26f-4c2b-be6d-ec367432dded"
});

// Set up connection with DynamoDB.
var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

// List of stations in the Database.
var stations = new Set();

// Function that get the last value from the table.
// Since that the oldest value is the first of the list,
// I have to reverse this list and take the first tuple.
function getLatestValue() {

    // Parameters for the scan of the DB.
    var params = {
        ExpressionAttributeNames: {
            "#id": "id"
        },
        ProjectionExpression: '#id',
        TableName: 'EnvironmentalStationDB'
    };

    docClient.scan(params, onScan);

    // Function that scans the table EnvironmentalStationDB,
    // then adds the ID of the stations in the list 'stations'
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


                //Query from each station.
                docClient.query(params, function (err, data) {
                    if (err) {
                        console.log("Error", err);
                    } else {

                        // In the variable 'latest' there will be the
                        // last value inserted in the DB.
                        // Since that the list is ordered from the oldest to
                        // the newest value, I have to reverse it.
                        var latest = data.Items.reverse()[0];
                        console.log("success");

                        // Insert latest value for each sensor.
                        document.getElementById('latest-value1').innerHTML = latest.temperature + ' °C';
                        document.getElementById('latest-value2').innerHTML = latest.humidity + '%';
                        document.getElementById('latest-value3').innerHTML = latest.windDirection + '°';
                        document.getElementById('latest-value4').innerHTML = latest.windIntensity + ' m/s';
                        document.getElementById('latest-value5').innerHTML = latest.rainHeight + ' mm/h';

                        var c;
                        // Change update on the cards.
                        for (c = 1; c < 6; c++) {
                            document.getElementById('update' + c).innerHTML = '<i class="material-icons">update</i> Just Updated by Station ' + id;
                        }

                        // Compute the size of the table EnvironmentalStationDB
                        // (this variable serves for the next step)
                        //var sizeList = Object.keys(data.Items).length;
                        //console.log(sizeList);

                        // In the variable 'actual' there will be, for
                        // each iteration of the cycle, all the tuples
                        // from the newest to the oldest.
                        var actual = data.Items;

                        // Insert the latest 5 tuples for each station.
                        for (c = 0; c < 5; c++) {
                            document.getElementById('station' + id).innerHTML += '<tr><td>' + actual[c].datetime + '</td><td>' + actual[c].temperature + '</td><td>' + actual[c].humidity +
                                '</td><td>' + actual[c].windDirection + '</td><td>' + actual[c].windIntensity + '</td><td>' + actual[c].rainHeight + '</td></tr> ';
                        }
                    }

                });
            });
        }
    };
}

// Function that returns the one hour ago from now.
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

// Function that returns the current time.
// (it serves for the 'LastHour' query)
function getDateTime() {
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

    var dateTimeOneHour = year + '-' + month + '-' + day + ' ' + (hour - 1) + ':' + minute + ':' + second;

    return dateTimeOneHour;
}

// Function that returns all the tuples inserted
// at most one hour ago. For each sensor will
// be filled its own table.
function getLastHourData(sensor) {

    // Variable that contains the time, one hour ago.
    var lastHour = getDateTime();

    // Parameters for the scan of the DB.
    var params = {
        TableName: "EnvironmentalStationDB",
        ProjectionExpression: "#dtime, #id, " + sensor,
        FilterExpression: "#dtime >= :lastHour",
        ExpressionAttributeNames: {
            "#id": "id",
            "#dtime": "datetime"

        },
        ExpressionAttributeValues: {
            ":lastHour": lastHour
        }
    };
    docClient.scan(params, onScan);

    function onScan(err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            var c;
            var items = data.Items;
            var sizeList = Object.keys(items).length;
            for (c = 0; c < sizeList; c++) {
                if (sensor === "temperature")
                    document.getElementById('id' + sensor).innerHTML += '<tr><td>' + items[c].datetime + '</td><td>' + items[c].id + '</td><td class="text-primary">' + items[c].temperature + '</td></tr> ';
                else if (sensor === "humidity")
                    document.getElementById('id' + sensor).innerHTML += '<tr><td>' + items[c].datetime + '</td><td>' + items[c].id + '</td><td class="text-primary">' + items[c].humidity + '</td></tr> ';
                else if (sensor === "windDirection")
                    document.getElementById('id' + sensor).innerHTML += '<tr><td>' + items[c].datetime + '</td><td>' + items[c].id + '</td><td class="text-primary">' + items[c].windDirection + '</td></tr> ';
                else if (sensor === "windIntensity")
                    document.getElementById('id' + sensor).innerHTML += '<tr><td>' + items[c].datetime + '</td><td>' + items[c].id + '</td><td class="text-primary">' + items[c].windIntensity + '</td></tr> ';
                else if (sensor === "rainHeight")
                    document.getElementById('id' + sensor).innerHTML += '<tr><td>' + items[c].datetime + '</td><td>' + items[c].id + '</td><td class="text-primary">' + items[c].rainHeight + '</td></tr> ';
            }
        }
    };
}
