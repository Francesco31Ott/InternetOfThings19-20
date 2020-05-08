import paho.mqtt.client as mqtt
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
import json
import boto3
import base64
import time
import datetime

# connection to DynamoDB and access to the table EnvironmentalStationDB
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
dynamoTable = dynamodb.Table('EnvironmentalStationDB')

# clients for TTN and AWS
TTNClient = mqtt.Client()
AWSClient = AWSIoTMQTTClient("TTNbridge")

def on_connect(client, userdata, flags, rc):
    print("Connected with result code "+str(rc))

    # subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed
    client.subscribe("+/devices/+/up")

# the callback for when a PUBLISH message is received from the server
def on_message(client, userdata, msg):
    jsonP = json.loads(str(msg.payload)[2:-1])
    print("Uplink received from", jsonP['dev_id'])
    new_payload = base64.b64decode(jsonP['payload_raw'])
    new_msg = json.loads(str(new_payload)[2:-1])
    new_msg['datetime'] = datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S')
    print(new_msg,"\n")
    AWSClient.publish("sensor/station"+new_msg['id'], json.dumps(new_msg), 0)
    dynamoTable.put_item(Item=new_msg)
    
# path that indicates the certificates position
path = "../certs/"

# configure the access with the AWS MQTT broker
AWSClient.configureEndpoint("a3um1mnv6jt2hg-ats.iot.us-east-1.amazonaws.com", 8883)
AWSClient.configureCredentials(path+"root-CA.crt",
                                path+"private.pem.key",
                                path+"certificate.pem.crt")

# configure the MQTT broker
AWSClient.configureOfflinePublishQueueing(-1)  # Infinite offline Publish queueing
AWSClient.configureDrainingFrequency(2)  # Draining: 2 Hz
AWSClient.configureConnectDisconnectTimeout(10)  # 10 sec
AWSClient.configureMQTTOperationTimeout(5)  # 5 sec

# configure the TTN client
TTNClient = mqtt.Client()
TTNClient.on_connect = on_connect
TTNClient.on_message = on_message
# you have to insert your parameters here
TTNClient.username_pw_set("<application_id>", "<access_key>")

# connect the clients
TTNClient.connect("eu.thethings.network", 1883, 60)
AWSClient.connect()

# start the loop for the TTN client
TTNClient.loop_start()

# cycle that wait for a command to close the program
while True:
    if input("Enter 'quit' to exit from the program.\n")=="quit":
        break

# disconnect from the clients
TTNClient.loop_stop()
TTNClient.disconnect()
AWSClient.disconnect()
