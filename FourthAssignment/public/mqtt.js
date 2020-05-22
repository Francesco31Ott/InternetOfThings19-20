class PahoMQTTClient {
  constructor(requestUrl, clientId) {
    this.requestUrl = requestUrl;
    this.clientId = clientId;
    this.client = null;
    this.isConnected = false;
  }

  // Function that makes a connection to the server.
  conn(callback) {
    this.client = new Paho.MQTT.Client(this.requestUrl, this.clientId);

    var connectOptions = {
      onSuccess: () => {
        console.log("onConnect: connect succeeded");
        this.isConnected = true;
        callback();
      },
      useSSL: true,
      timeout: 3,
      mqttVersion: 4,
      onFailure: function () {
        console.log("onFailure: connect failed");
        callback();
      }
    };

    // Callbacks
    this.client.onConnectionLost = onConnectionLost;
    this.client.onMessageArrived = onMessageArrived;

    // Client connection
    this.client.connect(connectOptions);

    // Function called when the connection is lost.
    function onConnectionLost(responseObject) {
      if (responseObject.errorCode !== 0)
        console.log("onConnectionLost:" + responseObject.errorMessage);
    }

    // Function called when there is an incoming message.
    function onMessageArrived(message) {
      console.log("onMessageArrived:" + message.payloadString);
    }

  }

  // Function that makes a subscription on a topic.
  sub(topic) {
    console.log("Subscribing on topic " + topic);
    this.client.subscribe(topic);
  }

  // Function that makes a publish on a topic.
  pub(message, topic) {
    console.log("Publishing message on topic " + topic);
    this.client.send(topic, message, 0, false);
  }

  // Function that checks if the client is connected or not.
  isConn() {
    return this.isConnected;
  }

}
