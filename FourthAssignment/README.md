# Fourth Assignment
In this assignment I built a mobile application to provide a crowd-sensing extension to my application. I built on-top of the cloud-based and edge-based components developed in the first and second assignments.

# Crowd Sensing Application
I developed an HTML5 application using the *Generic Sensor API* that collects data from the *accelerator sensor of the mobile phone*.
These values are transmitted to my Cloud infrastructure using a broker on AWS IoT via MQTT.

# User Activity Recognition
Using the collected data, I developed a simple activity recognition model that detects if the user is standing still, walking or running.
Assuming a movement of at most 0.5 Hz (i.e. 30 steps per minute), a sampling frequency of 1Hz (i.e. 1 message per second) is theoretically sufficient to recognize the pattern.

# Cloud-based Deployment
Deploy the activity recognition model to the cloud. Given the data arriving to the cloud, I executed the model and provided a status for the state of the user whenever new values arrive.

The application provides the following functionalities:
- Display the latest values received from all the sensors and the resulting activity.
- Display the values received during the last hour from all the sensors and the resulting activity.

# Edge-based Deployment
Deploy the activity recognition model to the mobile phone. Given the data collected by the mobile phone, the model is executed locally to provide a status for the state of the user.

In this edge-based deployment the raw sensor data are not transmitted to the cloud. Instead only the outcome of the activity recognition model should be transmitted to the cloud.

The application provides the following functionalities:
- Display the latest activity of the user.
- Display the activities received during the last hour.

# Useful Links
- [Video Tutorial](https://www.youtube.com/watch?v=B7Le8f8re7Y)
- [Blog Post](https://www.hackster.io/francesco-ottaviani/crowdsensing-application-with-generic-sensor-api-and-aws-b5a827)
