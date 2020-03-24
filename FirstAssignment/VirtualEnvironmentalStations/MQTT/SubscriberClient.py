#!/usr/bin/env python

# importing libraries
import paho.mqtt.client as mqtt
import os
import socket
import ssl
import boto3
import json

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
dynamoTable = dynamodb.Table('EnvironmentalStationDB')
jsonP = ""

def on_connect(client, userdata, flags, rc):                    # function for making connection
    print("Connection returned result: " + str(rc))
    client.subscribe("myIotThing/data" , 0)                     # subscribe to the topic
 
def on_message(client, userdata, msg):                          # function for receiving msgs and inserting them into DB
    payload = str(msg.payload)[2:-1]
    jsonP = json.loads(payload)
    print("topic: "+msg.topic)
    print("payload: "+payload)                          
    dynamoTable.put_item(Item=jsonP)
    
 
#def on_log(client, userdata, level, msg):
#    print(msg.topic+" "+str(msg.payload))
 
mqttc = mqtt.Client()                                           # mqttc object
mqttc.on_connect = on_connect                                   # assign on_connect function
mqttc.on_message = on_message                                   # assign on_message function
#mqttc.on_log = on_log


#### Change following parameters ####  
awshost = "a3um1mnv6jt2hg-ats.iot.us-east-1.amazonaws.com"      # Endpoint
awsport = 8883                                                  # Port no.   
clientId = "myIotThing"                                         # Thing_Name
thingName = "myIotThing"                                        # Thing_Name
caPath = "../certs/root-CA.crt"                                 # Root_CA_Certificate_Name
certPath = "../certs/certificate.pem.crt"                       # <Thing_Name>.cert.pem
keyPath = "../certs/private.pem.key"
 
mqttc.tls_set(caPath, certfile=certPath, keyfile=keyPath, cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2, ciphers=None)  # pass parameters
 
mqttc.connect(awshost, awsport, keepalive=60)                   # connect to aws server
 
mqttc.loop_forever()                                            # Start receiving in loop
