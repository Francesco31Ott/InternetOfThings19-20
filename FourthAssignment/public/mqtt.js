class PahoMQTTClient {
  constructor(requestUrl, clientId) {
    this.requestUrl  = requestUrl;
    this.clientId    = clientId;
    this.client      = null;
    this.isConnected = false;
  }

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
      onFailure: function() {
        console.log("onFailure: connect failed");
        callback();
      }
    };

    this.client.onConnectionLost = onConnectionLost;
    this.client.onMessageArrived = onMessageArrived;

    this.client.connect(connectOptions);

    function onConnectionLost(responseObject) {
      if (responseObject.errorCode !== 0)
        console.log("onConnectionLost:" + responseObject.errorMessage);
    }

    function onMessageArrived(message) {
      console.log("onMessageArrived:" + message.payloadString);
    }

  }

  sub(topic) {
    console.log("Subscribing on topic " + topic);
    this.client.subscribe(topic);
  }

  pub(message, topic) {
    console.log("Publishing message on topic " + topic);
    this.client.send(topic, message, 0, false);
  }

  unsub(topic) {
    console.log("Unsubscribing on topic " + topic);
    this.client.unsubscribe(topic);
  }

  disc() {
    console.log("Disconnecting the client");
    this.client.disconnect();
    this.isConnected = false;
  }

  isConn() {
    return this.isConnected;
  }

}
