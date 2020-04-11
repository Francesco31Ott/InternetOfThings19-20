/*
 * Copyright (C) 2017 Inria
 *               2017 Inria Chile
 *
 * This file is subject to the terms and conditions of the GNU Lesser
 * General Public License v2.1. See the file LICENSE in the top level
 * directory for more details.
 */

/**
 * @ingroup     tests
 *
 * @file
 * @brief       Semtech LoRaMAC test application
 *
 * @author      Alexandre Abadie <alexandre.abadie@inria.fr>
 * @author      Jose Alamos <jose.alamos@inria.cl>
 */

#include <stdio.h>
#include <string.h>
#include <time.h>

#ifdef MODULE_SEMTECH_LORAMAC_RX
#include "thread.h"
#include "msg.h"
#endif

#include "shell.h"
#include "semtech_loramac.h"

extern semtech_loramac_t loramac;

#ifdef MODULE_SEMTECH_LORAMAC_RX
#define LORAMAC_RECV_MSG_QUEUE                   (4U)
static msg_t _loramac_recv_queue[LORAMAC_RECV_MSG_QUEUE];
static char _recv_stack[THREAD_STACKSIZE_DEFAULT];

static void *_wait_recv(void *arg)
{
    msg_init_queue(_loramac_recv_queue, LORAMAC_RECV_MSG_QUEUE);

    (void)arg;
    while (1) {
        /* blocks until something is received */
        switch (semtech_loramac_recv(&loramac)) {
            case SEMTECH_LORAMAC_RX_DATA:
                loramac.rx_data.payload[loramac.rx_data.payload_len] = 0;
                printf("Data received: %s, port: %d\n",
                (char *)loramac.rx_data.payload, loramac.rx_data.port);
                break;

            case SEMTECH_LORAMAC_RX_LINK_CHECK:
                printf("Link check information:\n"
                   "  - Demodulation margin: %d\n"
                   "  - Number of gateways: %d\n",
                   loramac.link_chk.demod_margin,
                   loramac.link_chk.nb_gateways);
                break;

            case SEMTECH_LORAMAC_RX_CONFIRMED:
                puts("Received ACK from network");
                break;

            default:
                break;
        }
    }
    return NULL;
}
#endif

// struct that contains sensors
typedef struct sensors{
  int temperature;
  int humidity;
  int windDirection;
  int windIntensity;
  int rainHeight;
}t_sensors;

static int loramac_tx_handler(int argc, char **argv) {
    if (argc < 3) {
        puts("Usage: loramac tx <payload> [<cnf|uncnf>] [port]");
        return 1;
    }

    uint8_t cnf = LORAMAC_DEFAULT_TX_MODE;  /* Default: confirmable */
    uint8_t port = LORAMAC_DEFAULT_TX_PORT; /* Default: 2 */
    /* handle optional parameters */
    if (argc > 3) {
        if (strcmp(argv[3], "cnf") == 0) {
            cnf = LORAMAC_TX_CNF;
        }
        else if (strcmp(argv[3], "uncnf") == 0) {
            cnf = LORAMAC_TX_UNCNF;
        }
        else {
            puts("Usage: loramac tx <payload> [<cnf|uncnf>] [port]");
            return 1;
        }

        if (argc > 4) {
            port = atoi(argv[4]);
            if (port == 0 || port >= 224) {
                printf("error: invalid port given '%d', "
                       "port can only be between 1 and 223\n", port);
                return 1;
            }
        }
    }

    semtech_loramac_set_tx_mode(&loramac, cnf);
    semtech_loramac_set_tx_port(&loramac, port);

    switch (semtech_loramac_send(&loramac,(uint8_t *)argv[2], strlen(argv[2]))) {
      case SEMTECH_LORAMAC_NOT_JOINED:
        puts("Cannot send: not joined");
        return 1;

      case SEMTECH_LORAMAC_DUTYCYCLE_RESTRICTED:
        puts("Cannot send: dutycycle restriction");
        return -1;   // Duty cycle limitations are set by authorities, don't stop to send, retry

      case SEMTECH_LORAMAC_BUSY:
        puts("Cannot send: MAC is busy");
        return 1;

      case SEMTECH_LORAMAC_TX_ERROR:
        puts("Cannot send: error");
        return 1;

      case SEMTECH_LORAMAC_TX_CNF_FAILED:
        puts("Fail to send: no ACK received");
        return -1;
    }

    puts("Message sent with success");
    return 0;
}

// function that computes random values in the specified range
int rand_val(int min, int max){
  srand(time(NULL));
  return (rand() % (int)((max-min+1) * 100)) / 100 + min;
}

// function that generate sensor values
static void gen_sensors_values(t_sensors* sensors){
  sensors->temperature = rand_val(-50,50);
  sensors->humidity = rand_val(0, 100);
  sensors->windDirection = rand_val(0, 360);
  sensors->windIntensity = rand_val(0, 100);
  sensors->rainHeight = rand_val(0, 50);
}

// new shell command: start the station
// the function takes in input ip address and port of the gateway,
// and the id of the specified station
// every five seconds it generates new sensor values and publish them to
// sensor/station + station id
static int cmd_start(int argc, char **argv){
  if (argc < 1) {
      printf("usage: %s\n", argv[0]);
      return 1;
  }
  // sensors struct
  t_sensors sensors;

  // json that it will published
  char json[128];

  while(1) {
    // takes the current date and time
    char datetime[20];
    time_t current;
    time(&current);
    struct tm* t = localtime(&current);
    int c = strftime(datetime, sizeof(datetime), "%Y-%m-%d %T", t);
    if(c == 0) {
      printf("Error! Invalid format\n");
      return 0;
    }

    // updates sensor values
    gen_sensors_values(&sensors);

    // fills the json document
    sprintf(json, "{\"id\": \"%d\", \"datetime\": \"%s\", \"temperature\": "
                  "\"%d\", \"humidity\": \"%d\", \"windDirection\": \"%d\", "
                  "\"windIntensity\": \"%d\", \"rainHeight\": \"%d\"}",
                  atoi(argv[3]), datetime, sensors.temperature, sensors.humidity,
                  sensors.windDirection, sensors.windIntensity, sensors.rainHeight);

    // parameters for sending a message with loramac tx
    char* params[3] = {"loramac", "tx", json};

    while(1) {
      // try to send a message
      if(loramac_tx_handler(3, params) > 0){
        printf("Error! Send failed\n");
        return 0;
      }
    }

    // it sleeps for five seconds
    xtimer_sleep(5);
  }

  return 0;
}

static const shell_command_t shell_commands[] = {
    { "start", "start a station", cmd_start },
    { NULL, NULL, NULL }
};

/* loramac shell command handler is implemented in
   sys/shell/commands/sc_loramac.c */

int main(void)
{
#ifdef MODULE_SEMTECH_LORAMAC_RX
    thread_create(_recv_stack, sizeof(_recv_stack),
                  THREAD_PRIORITY_MAIN - 1, 0, _wait_recv, NULL, "recv thread");
#endif

    puts("All up, running the shell now");
    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(shell_commands, line_buf, SHELL_DEFAULT_BUFSIZE);
}
