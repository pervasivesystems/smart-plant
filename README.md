# Smart Plant
Automate the process of plants irrigation based on the environment using sensors.

The plant will be perfectly fed accordingly to the surroundings variables and the user will be always kept up to date.

## Main Features
1. **Auto Water**: Smart Plant waters the plant or flower automatically based on the type of plant.
2. **Alert Notification**: Smart Plant Bot sends you a Telegram message when some parameter is not good.
3. **Check Status**: In every moment you can check the current and the previous statuses of the plant/flower.

## Presentation
* [**First Presentation**](https://www.slideshare.net/ceribbo/smart-plant-first-presentation)
* [**Second Presentation**](https://www.slideshare.net/ceribbo/smart-plant-second-presentation)
* [**Final Presentation**](https://www.slideshare.net/ceribbo/smart-plant-final-presentation)


## Architecture
![Stack](https://raw.githubusercontent.com/pervasivesystems/smart-plant/master/structure.jpg)


## Hardware
### Tools
* **Arduino Board**: Board which controls only the Servo to open the valve.
* **2 * DISCO-L072CZ-LRWAN1 Board**: Board to manage Lora communication.
* **Components**: Soil, temperature, light Sensors and a Servo.

### Commands
The Lora Server can receive the commands "1" and "3" via Serial. Then it sends The command with Lora to the Plant Receiver which is always listening and activate the sensor or the servo on the Arduino

### Hardware Code implementation
* Lora Server: 
    * [Main](https://github.com/pervasivesystems/smart-plant/blob/master/Lora-Server/main.cpp)
    * [Lora](https://github.com/pervasivesystems/smart-plant/blob/master/Lora-Server/SX1276ServerLora/ServerLora.cpp)
* Lora Receiver (Plant):
    * [Main](https://github.com/pervasivesystems/smart-plant/blob/master/Lora-Plant/main.cpp)
    * [Lora](https://github.com/pervasivesystems/smart-plant/blob/master/Lora-Plant/SX1276PlantLora/PlantLora.cpp)
* Arduino:
    * [Servo](https://github.com/pervasivesystems/smart-plant/blob/master/Arduino-Servo/sketch_may31a.ino)

### Hardware Schemas
Coming Soon
### Hardware Pictures
Coming Soon

## Software
The core of the project is the Telegram Bot running on a Raspberry pi and manages the plant.

### Tools
* **Firebase**: Is a database where all the data are stored.
* **Woody Plant Database**: Database from which the Telegram Bot retrieves the information about a plant or flower.
* **Telgraf**: It is a Nodejs library used to do the Telegram Bot.
* **Lora**: It is the wireless communication used between the two STM Board.
* **Arduino**: Hardware Platform to manage the step motor.  
* **Mbed**: Platform used to program STM32 Boards

### Database

This is the units used for each information:

| plantID |      date      | temperature | light | ph   |
| ------- | -------------- | ----------- | ----- | ---- |
| integer | timestamp (ms) |     °C      | Lux   | 0-14 |


**JSON object** in Firebase db
```json
{
    "plants":[{
            "plantID": int,
            "plant": string,
            "info":[{
                    "date": int,
                    "temperature": int,
                    "light": int,
                    "ph": int
                    },
                ...
            ]
        },
        ...
    ]
}
```



## Interface
This is some screenshots of the Telegram Bot:

| | |
|:-------------------------:|:-------------------------:|
|<img alt="setplant" src="https://raw.githubusercontent.com/pervasivesystems/smart-plant/master/setplant.png">|<img alt="graph" src="https://raw.githubusercontent.com/pervasivesystems/smart-plant/master/graph.png">|
|<img alt="status" src="https://raw.githubusercontent.com/pervasivesystems/smart-plant/master/status.png">|<img alt="graph" src="https://raw.githubusercontent.com/pervasivesystems/smart-plant/master/info.png">|

### Telegram Commands

- **/setplant** _select which plant you want to manage_
- **/water** _water manually the plant_
- **/startsensor** _perform a sensors reading_
- **/status** _show you the status of the plant_
- **/info** _show you information of the plant_

## How to Run

### Step 1
Compile the code in *Plant* folder on one STM Board and the code in *Server* folder on the other STM Board.

### Step 2
On Raspberry pi download the *Main* folder and run:

`npm install`

and then:

`npm start`

### Step 3
Search on Telegram Client the bot: `smart_plant_gj_bot` and start the conversation.



## Project Members
* **Jacopo Carlini**  [LinkedIn](https://www.linkedin.com/in/jacopo-carlini/)
* **Giacomo Ceribelli**  [LinkedIn](https://www.linkedin.com/in/giacomo-ceribelli/)

 ##
 ![Logo](https://github.com/pervasivesystems/smart-plant/blob/master/Sapienza_Universit___di_Roma-logo-C9225434E8-seeklogo.com%20(1).png "Sapienza")
