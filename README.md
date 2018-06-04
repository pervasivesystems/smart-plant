# Smart Plant
Automate the process of plants irrigation based on the environment using sensors.

The plant will be perfectly fed accordingly to the surroundings variables and the user will be always kept up to date.

## Client
// TODO


## Server
The Server is a Telegram Bot that running on a Raspberry pi.

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


## Prototype
// some photos here

## Interface
// some photos here

## How to Use

### Step 1
Compile the code in *Plant* folder on one STM Board and the code in *Server* folder on the other STM Board.

### Step 2
On Raspberry pi download the *Main* folder and run:

`npm install`

and then:

`npm start`

### Step 3
Search on Telegram Client the bot: `smart_plant_gj_bot` and start the conversation.



## Presentation
You find a presentation here.
[LinkIn](https://github.com/pervasivesystems/smart-plant/blob/master/presentation.pdf)

## Authors
* **Jacopo Carlini**  [LinkIn](https://www.linkedin.com/in/jacopo-carlini/)
* **Giacomo Ceribelli**  [LinkIn](https://www.linkedin.com/in/giacomo-ceribelli/)
