#!/usr/bin/env python

# This script works as a Subscriber Client, so it will be subscribed
# to a topic, it will receive all the messages on that topic and
# eventually inserts every message into a table on DynamoDB.

# importing libraries
import paho.mqtt.client as mqtt
import os
import socket
import ssl
import boto3
import json


dynamodb = boto3.resource('dynamodb', region_name='us-east-1')      # connection to DynamoDB and access
dynamoTable = dynamodb.Table('EnvironmentalStationDB')              # to the table EnvironmentalStationDB
jsonP = '';

def on_connect(client, userdata, flags, rc):                        # function for making connection with the broker
    print("Connection returned result: " + str(rc))
    client.subscribe("sensor/data", 1)                              # subscribe to the MQTT channel with QoS 1
 
def on_message(client, userdata, msg):                              # function for receiving msgs and inserting them into DB
    payload = str(msg.payload)[2:-1]                                # and inserting them into the database
    jsonP = json.loads(payload)
    print("topic: "+msg.topic)                                      # for each message, the function reads the topic
    print("payload: "+payload)                                      # on which the message arrived and its payload,
    dynamoTable.put_item(Item=jsonP)                                # then puts into the DB a json file
 
#def on_log(client, userdata, level, msg):
#    print(msg.topic+" "+str(msg.payload))
 
mqttc = mqtt.Client()                                               # MQTT Client object
mqttc.on_connect = on_connect                                       # assign on_connect function
mqttc.on_message = on_message                                       # assign on_message function
#mqttc.on_log = on_log


#### Change following parameters #### 
awshost = "a3um1mnv6jt2hg-ats.iot.us-east-1.amazonaws.com"          # endpoint
awsport = 8883                                                      # port no.   
clientId = "sensor"                                                 # client id
thingName = "sensor"                                                # thing name
caPath = "../certs/root-CA.crt"                                     # rootCA certificate
certPath = "../certs/certificate.pem.crt"                           # client certificate
keyPath = "../certs/private.pem.key"                                # private key
 
mqttc.tls_set(caPath, certfile=certPath, keyfile=keyPath, cert_reqs=ssl.CERT_REQUIRED,
              tls_version=ssl.PROTOCOL_TLSv1_2, ciphers=None)       # pass parameters
 
mqttc.connect(awshost, awsport, keepalive=60)                       # connect to AWS server
 
mqttc.loop_forever()                                                # start receiving messages in loop
