/*
 * This file contains a copy of the master content sx1276PingPong
 * with adaption for the SX1276Generic environment
 * (c) 2017 Helmut Tschemernjak
 * 30826 Garbsen (Hannover) Germany
 */

#include "mbed.h"
#include "PinMap.h"
#include "sx1276-mbed-hal.h"
#include "main.h"
#include <string>

#ifdef FEATURE_LORA

/* Set this flag to '1' to display debug messages on the console */
#define DEBUG_MESSAGE   1

/* Set this flag to '1' to use the LoRa modulation or to '0' to use FSK modulation */
#define USE_MODEM_LORA  1
#define USE_MODEM_FSK   !USE_MODEM_LORA
#define RF_FREQUENCY            RF_FREQUENCY_868_1  // Hz
#define TX_OUTPUT_POWER         14                  // 14 dBm

#if USE_MODEM_LORA == 1

#define LORA_BANDWIDTH          125000  // LoRa default, details in SX1276::BandwidthMap
#define LORA_SPREADING_FACTOR   LORA_SF7
#define LORA_CODINGRATE         LORA_ERROR_CODING_RATE_4_5

#define LORA_PREAMBLE_LENGTH    8       // Same for Tx and Rx
#define LORA_SYMBOL_TIMEOUT     5       // Symbols
#define LORA_FIX_LENGTH_PAYLOAD_ON  false
#define LORA_FHSS_ENABLED       false
#define LORA_NB_SYMB_HOP        4
#define LORA_IQ_INVERSION_ON    false
#define LORA_CRC_ENABLED        true

#elif USE_MODEM_FSK == 1

#define FSK_FDEV                25000     // Hz
#define FSK_DATARATE            19200     // bps
#define FSK_BANDWIDTH           50000     // Hz
#define FSK_AFC_BANDWIDTH       83333     // Hz
#define FSK_PREAMBLE_LENGTH     5         // Same for Tx and Rx
#define FSK_FIX_LENGTH_PAYLOAD_ON   false
#define FSK_CRC_ENABLED         true

#else
    #error "Please define a modem in the compiler options."
#endif

#define RX_TIMEOUT_VALUE    10000    // in ms

//#define BUFFER_SIZE       32        // Define the payload size here
#define BUFFER_SIZE         64        // Define the payload size here

AnalogIn analog_value(A0);
/*
 *  Global variables declarations
 */
typedef enum
{
    LOWPOWER = 0,
    IDLE,

    RX,
    RX_TIMEOUT,

    TX,
    TX_TIMEOUT,
    DO_TX,

    CAD,
    CAD_DONE
} AppStates_t;

volatile AppStates_t State = LOWPOWER;

/*!
 * Radio events function pointer
 */
static RadioEvents_t RadioEvents;

/*
 *  Global variables declarations
 */
SX1276Generic *Radio;

uint16_t BufferSize = BUFFER_SIZE;
uint8_t *Buffer;
//const uint8_t sensor[] = { 'S', 'E', 'N', 'S', '_', 'V', 'A', 'L'};// "PING";

DigitalOut *led3;
void print_stuff(){
    dprintf("Smart Plant Application" );
    dprintf("Freqency: %.1f", (double)RF_FREQUENCY/1000000.0);
    dprintf("TXPower: %d dBm",  TX_OUTPUT_POWER);
#if USE_MODEM_LORA == 1
    dprintf("Bandwidth: %d Hz", LORA_BANDWIDTH);
    dprintf("Spreading factor: SF%d", LORA_SPREADING_FACTOR);
#elif USE_MODEM_FSK == 1
    dprintf("Bandwidth: %d kHz",  FSK_BANDWIDTH);
    dprintf("Baudrate: %d", FSK_DATARATE);
#endif
}


const uint8_t water[] = { 'F', 'A', 'T', 'T', 'O', '!', '!', '!'};// "SEND WATER MESSAGE";
const uint8_t initial[] = { '!', 'E', 'R', 'R', 'o', 'R', 'E', '!'};// "SEND WATER MESSAGE";
void setWaterMessage(){
    uint8_t i;
    memcpy(Buffer, water, sizeof(water));
    // We fill the buffer with numbers for the payload
    for( i = sizeof(water); i < BufferSize; i++ )
    {
        Buffer[i] = i - sizeof(water);
    }
}

void setSensorMessage(){
    float light;
    light = analog_value.read() *10; // Read the analog input value (value from 0.0 to 1.0 = full ADC conversion range)
    char message[8];//Message to be sent
    sprintf(message, "%f", light);
        
    uint8_t i;
    memcpy(Buffer, (uint8_t*)message, sizeof((uint8_t*)message));
    // We fill the buffer with numbers for the payload
    for( i = sizeof((uint8_t*)message); i < BufferSize; i++ )
    {
        Buffer[i] = i - sizeof((uint8_t*)message);
    }
}

void setInitialMessage(){
        
    uint8_t i;
    memcpy(Buffer, initial, sizeof(initial));
    // We fill the buffer with numbers for the payload
    for( i = sizeof(initial); i < BufferSize; i++ )
    {
        Buffer[i] = i - sizeof(initial);
    }
}


void PlantLora(void)
{
#if( defined ( TARGET_KL25Z ) || defined ( TARGET_LPC11U6X ) )
    DigitalOut *led = new DigitalOut(LED2);
#elif defined(TARGET_NUCLEO_L073RZ) || defined(TARGET_DISCO_L072CZ_LRWAN1)
    DigitalOut *led = new DigitalOut(LED4);   // RX red
    led3 = new DigitalOut(LED3);  // TX blue
#else
    DigitalOut *led = new DigitalOut(LED1);
    led3 = led;
#endif

    Buffer = new  uint8_t[BUFFER_SIZE];
    *led3 = 1;

#ifdef B_L072Z_LRWAN1_LORA
    Radio = new SX1276Generic(NULL, MURATA_SX1276,
            LORA_SPI_MOSI, LORA_SPI_MISO, LORA_SPI_SCLK, LORA_CS, LORA_RESET,
            LORA_DIO0, LORA_DIO1, LORA_DIO2, LORA_DIO3, LORA_DIO4, LORA_DIO5,
            LORA_ANT_RX, LORA_ANT_TX, LORA_ANT_BOOST, LORA_TCXO);
#else // RFM95
    Radio = new SX1276Generic(NULL, RFM95_SX1276,
            LORA_SPI_MOSI, LORA_SPI_MISO, LORA_SPI_SCLK, LORA_CS, LORA_RESET,
            LORA_DIO0, LORA_DIO1, LORA_DIO2, LORA_DIO3, LORA_DIO4, LORA_DIO5);

#endif
    // Initialize Radio driver
    RadioEvents.TxDone = OnTxDone;
    RadioEvents.RxDone = OnRxDone;
    RadioEvents.RxError = OnRxError;
    RadioEvents.TxTimeout = OnTxTimeout;
    RadioEvents.RxTimeout = OnRxTimeout;
    if (Radio->Init( &RadioEvents ) == false) {
        while(1) {
            dprintf("Radio could not be detected!");
            wait( 1 );
        }
    }


    switch(Radio->DetectBoardType()) {
        case SX1276MB1LAS:
            if (DEBUG_MESSAGE)
                dprintf(" > Board Type: SX1276MB1LAS <");
            break;
        case SX1276MB1MAS:
            if (DEBUG_MESSAGE)
                dprintf(" > Board Type: SX1276MB1LAS <");
        case MURATA_SX1276:
            if (DEBUG_MESSAGE)
                dprintf(" > Board Type: MURATA_SX1276_STM32L0 <");
            break;
        case RFM95_SX1276:
            if (DEBUG_MESSAGE)
                dprintf(" > HopeRF RFM95xx <");
            break;
        default:
            dprintf(" > Board Type: unknown <");
    }

    Radio->SetChannel(RF_FREQUENCY );

#if USE_MODEM_LORA == 1

    if (LORA_FHSS_ENABLED)
        dprintf("             > LORA FHSS Mode <");
    if (!LORA_FHSS_ENABLED)
        dprintf("             > LORA Mode <");

    Radio->SetTxConfig( MODEM_LORA, TX_OUTPUT_POWER, 0, LORA_BANDWIDTH,
                         LORA_SPREADING_FACTOR, LORA_CODINGRATE,
                         LORA_PREAMBLE_LENGTH, LORA_FIX_LENGTH_PAYLOAD_ON,
                         LORA_CRC_ENABLED, LORA_FHSS_ENABLED, LORA_NB_SYMB_HOP,
                         LORA_IQ_INVERSION_ON, 2000 );

    Radio->SetRxConfig( MODEM_LORA, LORA_BANDWIDTH, LORA_SPREADING_FACTOR,
                         LORA_CODINGRATE, 0, LORA_PREAMBLE_LENGTH,
                         LORA_SYMBOL_TIMEOUT, LORA_FIX_LENGTH_PAYLOAD_ON, 0,
                         LORA_CRC_ENABLED, LORA_FHSS_ENABLED, LORA_NB_SYMB_HOP,
                         LORA_IQ_INVERSION_ON, true );

#elif USE_MODEM_FSK == 1

    dprintf("              > FSK Mode <");
    Radio->SetTxConfig( MODEM_FSK, TX_OUTPUT_POWER, FSK_FDEV, 0,
                         FSK_DATARATE, 0,
                         FSK_PREAMBLE_LENGTH, FSK_FIX_LENGTH_PAYLOAD_ON,
                         FSK_CRC_ENABLED, 0, 0, 0, 2000 );

    Radio->SetRxConfig( MODEM_FSK, FSK_BANDWIDTH, FSK_DATARATE,
                         0, FSK_AFC_BANDWIDTH, FSK_PREAMBLE_LENGTH,
                         0, FSK_FIX_LENGTH_PAYLOAD_ON, 0, FSK_CRC_ENABLED,
                         0, 0, false, true );

#else

#error "Please define a modem in the compiler options."

#endif

    if (DEBUG_MESSAGE)
        dprintf("Plant Ready to Receive Orders");

    State = RX;
    //Radio->Rx( RX_TIMEOUT_VALUE ); //CHIAMERà il timeout rx da cui poi chiamo DO_TX case.

#ifdef TARGET_STM32L4
    //     WatchDogUpdate();
#endif

    while (1){
        switch( State )
        {
        case TX:
            *led3 = 1;
            wait(1);
            wait_ms( 10 );
            Radio->Send( Buffer, BufferSize );
            State = LOWPOWER;
            break;
        case RX:
            *led3 = 0;
            State = LOWPOWER;
            Radio->Rx( RX_TIMEOUT_VALUE );
            break;
        case RX_TIMEOUT:
            Radio->Rx( RX_TIMEOUT_VALUE );
            State = LOWPOWER;
            break;
        case LOWPOWER:
            sleep();
            break;
        default:
            State = LOWPOWER;
            break;
        }
    }
}

void OnTxDone(void *radio, void *userThisPtr, void *userData)
{
    Radio->Sleep( );
    setInitialMessage();
    State = RX;
    if (DEBUG_MESSAGE)
        dprintf("> OnTxDone");

}

void OnRxDone(void *radio, void *userThisPtr, void *userData, uint8_t *payload, uint16_t size, int16_t rssi, int8_t snr)
{
    Radio->Sleep( );
    BufferSize = size;
    memcpy( Buffer, payload, BufferSize );
    if (DEBUG_MESSAGE)
        dprintf("> OnRxDone: RssiValue=%d dBm, SnrValue=%d", rssi, snr);
    char res[8];
    memcpy(res, payload, 8);
    dprintf("ORDER RECEIVED: %s", res);
    switch (res[0])
    {
        //ricevo 1 quindi devo annaffiare
        case '1':
            //funzione che aziona il server
            setWaterMessage();
            break;
        //ricevo 3 quindi devo mandare indietro i
        case '3':
            setSensorMessage();
            break;
        default:
            break;
    }
    State = TX;
}

void OnTxTimeout(void *radio, void *userThisPtr, void *userData)
{
    *led3 = 0;
    Radio->Sleep( );
    State = TX_TIMEOUT;
    if(DEBUG_MESSAGE)
        dprintf("> OnTxTimeout");
}

void OnRxTimeout(void *radio, void *userThisPtr, void *userData)
{
    *led3 = 0;
    Radio->Sleep( );
    State = RX_TIMEOUT;
    dprintf("> OnRxTimout");
}

void OnRxError(void *radio, void *userThisPtr, void *userData)
{
    Radio->Sleep( );
    if(DEBUG_MESSAGE)
        dprintf("> OnRxError");
    State = RX_TIMEOUT;

}
void OnTxError(void *radio, void *userThisPtr, void *userData)
{
    Radio->Sleep( );
    if(DEBUG_MESSAGE)
        dprintf("> OnTXError");
    State = TX;

}
#endif
