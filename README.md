# smart-plant

Open Main folder in the terminal and run:

`npm install`

## Run main.js

run:

`node main.js`

or with npm

`npm start`

## Database

This is the units used for each information

| plantID |      date      | temperature | light | ph   |
| ------- | -------------- | ----------- | ----- | ---- |
| integer | timestamp (ms) |     °C      | Lux   | 0-14 |


**JSON object** in firebase db
```json
{
    "plants":[{
            "plantID": int,
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
