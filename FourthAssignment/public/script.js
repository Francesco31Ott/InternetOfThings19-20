$(document).ready(function () {

  var id = createID();
  var topic = "sensor/test";
  var mqttClient = null;


  // AWS Cognito credentials
  AWS.config.region = 'us-east-1';
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:fc3efd18-fd84-470b-984f-06ea60356f66',
  });

  // AWS credentials
  AWS.config.credentials.get(function () {
    // Credentials will be available when this function is called
    var host = "a3um1mnv6jt2hg-ats.iot.us-east-1.amazonaws.com";
    var requestUrl = SigV4Utils.getSignedUrl(host, AWS.config.region, AWS.config.credentials);
    mqttClient = new PahoMQTTClient(requestUrl, id);
    mqttClient.conn(callbackConnection, callbackReceive);
  });

  // Callback for the MQTT client connection
  function callbackConnection() {
    func();
  }

  // Callback for the MQTT client when receives a message
  function callbackReceive(msg) {
    msg = JSON.parse(msg);
    setMeasureText('x: ' + msg.x + '<br>y: ' + msg.y + '<br>z: ' + msg.z + "<br>" + (msg.isStanding ? "you're standing" : "you're moving"));
  }

  // The MQTT client starts to sending messages only if it is connected 
  function func() {
    if (!mqttClient.isConn()) {
      setMeasureText("Cannot connect to AWS");
      return;
    }
    start();
  }

  function start() {
    try {
      // Create Accelerometer Sensor
      let sensor = new Accelerometer({ frequency: 1 });
      sensor.onerror = event => console.log(event.error.name, event.error.message);

      $('#stop').click(() => { sensor.stop() });
      $('#start').click(() => { sensor.start() });

      sensor.onreading = () => {
        console.log("Acceleration along X-axis: " + sensor.x);
        $('#x').text(sensor.x);
        console.log("Acceleration along Y-axis: " + sensor.y);
        $('#y').text(sensor.y);
        console.log("Acceleration along Z-axis: " + sensor.z);
        $('#z').text(sensor.z);

        sendData(sensor.x, sensor.y, sensor.z);
      }

    } catch (error) {
      console.log('Error creating sensor:')
      console.log(error);
    }

  }

  function sendData(x, y, z, flag) {
    try {
      // Subscribe to the topic
      mqttClient.sub(topic);

      var json = "{ \"id\":\"" + id + "\", \"timestamp\": \"" + getDateTime() + "\"";

      // If the flag is TRUE, we are on the edge side
      // Otherwise we are on the cloud side
      if (flag)
        json += ", \"x\":" + x + ", \"y\":" + y + ", \"z\":" + z + ", \"activity\": " + activity() + "}";
      else
        json += ", \"x\":" + x + ", \"y\":" + y + ", \"z\":" + z + "}";

      mqttClient.pub(json, topic);

    } catch (error) {
      console.log("Error");
    }
  }


  // Function that returns the current date
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

    return dateTime;
  }

  // Function that generates a unique ID
  function createID() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

});
