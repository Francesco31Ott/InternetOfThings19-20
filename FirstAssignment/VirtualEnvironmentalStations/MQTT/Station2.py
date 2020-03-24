#!/usr/bin/env python

# importing libraries
import paho.mqtt.client as mqtt
import os
import socket
import ssl
from time import sleep
from random import randint
import json
import datetime
 
connflag = False
 
def on_connect(client, userdata, flags, rc):                        # function for making connection
    global connflag
    print("Connected to AWS")
    connflag = True
    print("Connection returned result: " + str(rc) )
 
def on_message(client, userdata, msg):                              # function for ending msg
    print(msg.topic+" "+str(msg.payload))
 
#def on_log(client, userdata, level, buf):
#    print(msg.topic+" "+str(msg.payload))
 
mqttc = mqtt.Client()                                               # mqttc object
mqttc.on_connect = on_connect                                       # assign on_connect function
mqttc.on_message = on_message                                       # assign on_message function
#mqttc.on_log = on_log

#### Change following parameters #### 
awshost = "a3um1mnv6jt2hg-ats.iot.us-east-1.amazonaws.com"          # Endpoint
awsport = 8883                                                      # Port no.   
clientId = "myIotThing"                                                # Thing_Name
thingName = "myIotThing"                                               # Thing_Name
caPath = "../certs/root-CA.crt"                                  # Root_CA_Certificate_Name.crt
certPath = "../certs/certificate.pem.crt"                        # <Thing_Name>.cert.pem.crt
keyPath = "../certs/private.pem.key"                             # <Thing_Name>.private.pem.key
 
mqttc.tls_set(caPath, certfile=certPath, keyfile=keyPath, cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2, ciphers=None)  # pass parameters
 
mqttc.connect(awshost, awsport, keepalive=60)                       # connect to aws server
 
mqttc.loop_start()                                                  # Start the loop
 
while(1):
    sleep(5)
    if connflag == True:
        temp = str(randint(-50,50))                                      # Generating Multiple Readings
        hum = str(randint(0, 100))
        wind_dir = str(randint(0, 360))
        wind_int = str(randint(0, 100))
        rain = str(randint(0, 50))
        time = str(datetime.datetime.now())[:19]
        
        data ={"id":"2", "datetime":time, "temperature":temp, "humidity":hum, "windDirection":wind_dir, "windIntensity":wind_int, "rainHeight":rain}
        jsonData = json.dumps(data)
        mqttc.publish("myIotThing/data", jsonData, 0)                   # topic: <TopicName> # Publishing Topics values

        print("Message sent: time ",time)
        print("Message sent: temperature ",temp," Celsius")         # Print sent <TopicName> msg on console
        print("Message sent: humidity ",hum," %")
        print("Message sent: windDirection ",wind_dir," Degrees")
        print("Message sent: windIntensity ",wind_int," m/s")
        print("Message sent: rainHeight ",rain," mm/h\n")
    else:
        print("waiting for connection...")
