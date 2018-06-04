/*
 * Copyright (c) 2017 Helmut Tschemernjak
 * 30826 Garbsen (Hannover) Germany
 * Licensed under the Apache License, Version 2.0);
 */

#include "mbed.h"
#include "PinMap.h"
//#include "BufferedSerial.h"
#include "PlantLora.h"
#include <Serial.h>

void SystemClock_Config(void);

extern Serial *ser;
extern void dump(const char *title, const void *data, int len, bool dwords = false);

#define dprintf(...) { ser->printf(__VA_ARGS__); ser->printf("\r\n"); }