// Include the Servo library
#include <Servo.h>
// Declare the Servo pin
int servoPin = 3;
bool moving = false;
// Create a servo object
Servo Servo1;
void setup() {
  // We need to attach the servo to the used pin number
  Servo1.attach(servoPin);
  Serial.begin(9600);
  pinMode(2, INPUT);
  Servo1.write(180);
}

void moveServo()  {
  if (! moving) {
    moving = true;
    int val = digitalRead(2);
    Serial.print(val);

    //apro
    Servo1.write(0);
    //aspetto che scorre l'acqua
    delay(7000);
    //chiudo
    Servo1.write(70);
    moving = false;
  }
}

void loop() {
  int val = digitalRead(2);
  if (val)  {
    moveServo();
  }
  delay(50);
  // Make servo go to 0 degrees
  /*Servo1.write(0);
    delay(3000);
    // Make servo go to 180 degrees
    Servo1.write(180);
    delay(3000); */
}
