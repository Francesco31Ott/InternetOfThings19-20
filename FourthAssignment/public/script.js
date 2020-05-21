$(document).ready(function () {

  // Variables
  var id = createID();
  var topic = "sensor/" + id + "/accelerometer";
  var mqttClient = null;
  var activity;
  
  // Buttons
  var edgeActivated = false;
  var cloudActivated = false;

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

  // Callback (MQTT client is connected)
  function callbackConnection() {
    func();
  }

  // Callback (MQTT client has received a message)
  function callbackReceive(msg) {
    console.log(msg);
  }

  // If the MQTT client is connected, start the process 
  function func() {
    if (!mqttClient.isConn()) {
      setMeasureText("Cannot connect to AWS");
      return;
    }

    start();
  }

  function start() {
    try {
      // Create LinearAccelerometerSensor
      let sensor = new LinearAccelerationSensor({ frequency: 1 });
      sensor.onerror = event => console.log(event.error.name, event.error.message);
      
      // Start the sensor if a button is clicked
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
        $('#x').text(sensor.x);
        $('#y').text(sensor.y);
        $('#z').text(sensor.z);
        
        // Edge side
        if(edgeActivated){
          activity = activityRecognition(sensor.x, sensor.y, sensor.z);
          $('#activity').text(activity);
          sendData(sensor.x, sensor.y, sensor.z, activity);
        }
        
        // Cloud side
        if(cloudActivated)
          sendData(sensor.x, sensor.y, sensor.z, null);
        
        
      }

    } catch (error) {
      console.log('Error creating sensor:')
      console.log(error);
    }

  }

  // Function that computes the length of the vector
  // to predict the activity of the user
  function activityRecognition(x,y,z){
    var state = "";
    var a = Math.sqrt(x*x + y*y + z*z).toFixed(2);
    $('#overall').text(a);
    if(a > 3)
      state = "running";
    else if(a > 0.6)
      state = "walking";
    else
      state = "standing still";
      
    return state;
  }

  function sendData(x, y, z, activityRec) {
    try {
      // Subscribe to the topic
      mqttClient.sub(topic);

      var json = "{ \"id\":\"" + id + "\", \"timestamp\": \"" + getDateTime() + "\"";

      // The additional data of the user's activity will added in the json
      // only if the edge button is activated
      if(edgeActivated)
        json += ", \"x\":" + x + ", \"y\":" + y + ", \"z\":" + z + ", \"activity\":" + activityRec + "}";
      if(cloudActivated)
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
