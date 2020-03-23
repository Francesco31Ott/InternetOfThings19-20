#!/usr/bin/env python

# importing libraries
import paho.mqtt.client as mqtt
import os
import socket
import ssl
from time import sleep
from random import randint
 
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
clientId = "myThing"                                                # Thing_Name
thingName = "myThing"                                               # Thing_Name
caPath = "../../certs/root-CA.crt"                                  # Root_CA_Certificate_Name.crt
certPath = "../../certs/certificate.pem.crt"                        # <Thing_Name>.cert.pem.crt
keyPath = "../../certs/private.pem.key"                             # <Thing_Name>.private.pem.key
 
mqttc.tls_set(caPath, certfile=certPath, keyfile=keyPath, cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2, ciphers=None)  # pass parameters
 
mqttc.connect(awshost, awsport, keepalive=60)                       # connect to aws server
 
mqttc.loop_start()                                                  # Start the loop
 
while(1):
    sleep(5)
    if connflag == True:
        temp = randint(-50,51)                                      # Generating Multiple Readings
        hum = randint(0, 101)
        wind_dir = randint(0, 361)
        wind_int = randint(0, 101)
        rain = randint(0, 51)                                   
        mqttc.publish("temperature", temp, qos=1)                   # topic: <TopicName> # Publishing Topics values
        mqttc.publish("humidity", hum, qos=1)        
        mqttc.publish("windDirection", wind_dir, qos=1)        
        mqttc.publish("windIntensity", wind_int, qos=1)        
        mqttc.publish("rainHeight", rain, qos=1)        
        
        print("Message sent: temperature ",temp," Celsius")         # Print sent <TopicName> msg on console
        print("Message sent: humidity ",hum," %")
        print("Message sent: windDirection ",wind_dir," Degrees")
        print("Message sent: windIntensity ",wind_int," m/s")
        print("Message sent: rainHeight ",rain," mm/h\n")
    else:
        print("waiting for connection...")
