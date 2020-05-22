$(document).ready(function () {

  // Variables
  var id = createID();
  var topic = "sensor/" + id + "/accelerometer";
  var mqttClient = null;
  var activity;

  // Buttons
  var edgeActivated = false;
  var cloudActivated = false;

  // Configuration with AWS Cognito Identity Credentials.
  AWS.config.region = 'us-east-1';
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:fc3efd18-fd84-470b-984f-06ea60356f66',
  });

  // Set up connection with DynamoDB.
  var docClient = new AWS.DynamoDB.DocumentClient();

  // Configuration with AWS credentials.
  AWS.config.credentials.get(function () {
    // Credentials will be available when this function is called.
    var host = "a3um1mnv6jt2hg-ats.iot.us-east-1.amazonaws.com";
    var requestUrl = SigV4Utils.getSignedUrl(host, AWS.config.region, AWS.config.credentials);
    mqttClient = new PahoMQTTClient(requestUrl, id);
    mqttClient.conn(callbackConnection, callbackReceive);
  });

  // Callback (MQTT client is connected).
  function callbackConnection() {
    func();
  }

  // Callback (MQTT client has received a message).
  function callbackReceive(msg) {
    console.log(msg);
  }

  // If the MQTT client is connected, start the process.
  function func() {
    if (!mqttClient.isConn()) {
      setMeasureText("Cannot connect to AWS");
      return;
    }

    start();
  }

  function start() {
    try {
      // Create a LinearAccelerometerSensor.
      let sensor = new LinearAccelerationSensor({ frequency: 1 });
      sensor.onerror = event => console.log(event.error.name, event.error.message);

      // Start the sensor if a button is clicked.
      $('#edge').click(() => {
        edgeActivated = true;
        cloudActivated = false;
        sensor.start()
      });
      $('#cloud').click(() => {
        cloudActivated = true;
        edgeActivated = false;
        sensor.start()
      });


      sensor.onreading = () => {
        $('#x').text("x: " + sensor.x);
        $('#y').text("y: " + sensor.y);
        $('#z').text("z: " + sensor.z);

        // Edge side
        if (edgeActivated) {
          activity = activityRecognition(sensor.x, sensor.y, sensor.z);
          sendData(sensor.x, sensor.y, sensor.z);
          updateActivity(activity);
        }

        // Cloud side
        if (cloudActivated)
          sendData(sensor.x, sensor.y, sensor.z);

        getLastHourData();
      }

    } catch (error) {
      console.log('Error creating sensor:')
      console.log(error);
    }

  }

  // Function that computes the length of the vector
  // to predict the activity of the user.
  function activityRecognition(x, y, z) {
    var a = Math.sqrt(x * x + y * y + z * z).toFixed(2);
    //$('#overall').text(a);
    if (a > 3)
      return "running";
    else if (a > 0.6)
      return "walking";
    else
      return "standing still";
  }

  // Function that updates the activity just recognized.
  // For the edge computation, the values are taken directly from here,
  // for the cloud computation, the function retrieves data from the DynamoDB table.
  function updateActivity(a) {
    document.getElementById('latest-value').innerHTML = a;
    if (a == "standing still")
      document.getElementById('image').className = "fas fa-male fa-2x";
    else if (a == "walking")
      document.getElementById('image').className = "fas fa-walking fa-2x";
    else
      document.getElementById('image').className = "fas fa-running fa-2x";
    if (edgeActivated)
      document.getElementById('update').innerHTML = '<i>Just computed by the Edge</i>';
    else
      document.getElementById('update').innerHTML = '<i>Just computed by the Cloud</i>';
  }

  function sendData(x, y, z) {
    try {

      // Variable that contains the current time.
      var datetime = getDateTime();

      // Subscribe to the topic.
      mqttClient.sub(topic);

      var json = "{ \"id\":\"" + id + "\", \"timestamp\": \"" + datetime[0] + "\"";

      // The additional data of the user's activity will added in the json
      // only if the edge button is activated.
      if (edgeActivated)
        json += ", \"x\":" + x + ", \"y\":" + y + ", \"z\":" + z + ", \"activity\": \"" + activity + "\"}";
      if (cloudActivated)
        json += ", \"x\":" + x + ", \"y\":" + y + ", \"z\":" + z + "}";

      mqttClient.pub(json, topic);

    } catch (error) {
      console.log("Error");
    }
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

    var dateTime = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
    var dateTimeOneHour = year + '-' + month + '-' + day + ' ' + (hour - 1) + ':' + minute + ':' + second;

    return [dateTime, dateTimeOneHour];
  }

  // Insert the user ID for the history table.
  document.getElementById('table-desc').innerHTML = "From the user with ID:<br>" + id;

  // Function that returns all the tuples inserted
  // at most one hour ago. 
  function getLastHourData() {

    document.getElementById('table-title').innerHTML = "Values received during the last hour " + (edgeActivated ? "on the edge side" : "on the cloud side");
    var side = edgeActivated ? "edge" : "cloud";

    // Variable that contains the time, one hour ago.
    var lastHour = getDateTime();

    // Parameters for the scan of the DB.
    var params = {
      TableName: "CrowdSensingDB",
      ProjectionExpression: "#id, #ts, x, y, z, activity, side",
      FilterExpression: "#id = :userid and #ts >= :lastHour and side = :side",
      ExpressionAttributeNames: {
        "#id": "id",
        "#ts": "timestamp"

      },
      ExpressionAttributeValues: {
        ":userid": id,
        ":lastHour": lastHour[1],
        ":side": side
      }
    };
    //document.getElementById('overall').innerHTML = "ok2";
    docClient.scan(params, onScan);

    function onScan(err, data) {
      if (err) {
        console.log("Error", err);
      } else {
        document.getElementById('lh-table').innerHTML = "";

        var c;
        var items = data.Items.reverse();
        var sizeList = Object.keys(items).length;

        for (c = 0; c < sizeList; c++) {
          document.getElementById('lh-table').innerHTML += '<tr><td>' + items[c].timestamp + '</td><td>' + (items[c].x).substring(0, 7) + '</td><td>' + (items[c].y).substring(0, 7) + '</td><td>' + (items[c].z).substring(0, 7) + '</td><td class="text-primary">' + items[c].activity + '</td></tr> ';
        }

        // If we are on the cloud side, retrieve data from AWS.
        if (cloudActivated)
          updateActivity(items[0].activity);
      }
    };
  }

  // Function that generates a unique ID
  function createID() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

});
