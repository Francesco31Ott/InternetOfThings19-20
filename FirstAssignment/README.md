# First Assignment
In this assignment I created a cloud-based IoT system that collects information from a set of virtual environmental sensors using the MQTT protocol. I also created a simple website to display the data collected from the sensors.

# Virtual Sensors
Using *Python* language programming I wrote a stand-alone program that represents virtual environmental stations that generate periodically a set of random values for 5 different sensors:
- temperature (-50 ... 50 Celsius)
- humidity (0 ... 100%)
- wind direction (0 ... 360 degrees)
- wind intensity (0 ... 100 m/s)
- rain height (0 ... 50 mm/h)

The virtual environmental station uses a unique ID (identity) to publish these random values on an MQTT channel.
I have created 2 virtual stations that run and publish their values on the MQTT channel.

# Cloud-based IoT Backend
The MQTT is controlled by the cloud-based backend implemented using *AWS IoT*.

# Web-based Dashboard
Using *HTML*, *Javascript* and *CSS* I developed a website that provides the following functionality:
- display the latest values received from all the sensors of a specified environmental station
- display the values received during the last hour from all environmental station of a specified sensor

# HOW TO WORK
I make a summary to explain the correct procedure for the system to work properly:
- Open the scripts *SubscriberClient.py, Station1.py, Station2.py*, in the order of how I listed them and in three different terminals, with Python 3
- Open the Dashboard with your favourite browser going into the repository, under the folder *WebApp/web* and open the file *Dashboard.html*

# Useful Links
- [Video Tutorial](https://www.youtube.com/watch?v=R0GDoEG-xB8)
- [Blog Post](https://www.hackster.io/francesco-ottaviani/aws-cloud-based-iot-system-with-mqtt-3296f1)
