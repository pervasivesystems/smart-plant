# Smart Plant
Automate the process of plants irrigation based on the environment using sensors.

The plant will be perfectly fed accordingly to the surroundings variables and the user will be always kept up to date.

## Main Features
1. **Auto Water**: Smart Plant waters the plant or flower automatically based on the type of plant.
2. **Alert Notification**: Smart Plant Bot sends you a Telegram message when some parameter is not good.
3. **Check Status**: In every moment you can check the current and the previous statuses of the plant/flower.



## Hardware
// TODO



## Software
The core of the project is the Telegram Bot running on a Raspberry pi and manages the plant.

### Structure
![Stack](https://raw.githubusercontent.com/pervasivesystems/smart-plant/master/structure.jpg)

### Tools
* **Firebase**: Is a database where all the data are stored.
* **Woody Plant Database**: Database from which the Telegram Bot retrieve the information about a plant or flower.
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
![setplant](https://raw.githubusercontent.com/pervasivesystems/smart-plant/master/setplant.jpg)
![status](https://raw.githubusercontent.com/pervasivesystems/smart-plant/master/status.jpg)
![graph](https://raw.githubusercontent.com/pervasivesystems/smart-plant/master/graph.jpg)
![info](https://raw.githubusercontent.com/pervasivesystems/smart-plant/master/info.jpg)

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

### Final Prototype
// some photos here


## Presentation
You can find a presentation [here](https://github.com/pervasivesystems/smart-plant/blob/master/presentation.pdf)

## Authors
* **Jacopo Carlini**  [LinkIn](https://www.linkedin.com/in/jacopo-carlini/)
* **Giacomo Ceribelli**  [LinkIn](https://www.linkedin.com/in/giacomo-ceribelli/)
