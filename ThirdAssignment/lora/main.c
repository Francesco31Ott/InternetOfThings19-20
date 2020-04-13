#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#ifdef MODULE_SEMTECH_LORAMAC_RX
#include "thread.h"
#include "msg.h"
#endif

#include "shell.h"
#include "semtech_loramac.h"

extern semtech_loramac_t loramac;

// struct that contains sensors
typedef struct sensors{
  int temperature;
  int humidity;
  int windDirection;
  int windIntensity;
  int rainHeight;
}t_sensors;

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
  if (argc < 2) {
      printf("Usage: %s <station_id>\n", argv[0]);
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
                  atoi(argv[1]), datetime, sensors.temperature, sensors.humidity,
                  sensors.windDirection, sensors.windIntensity, sensors.rainHeight);

    puts(json);

    // send a message
    uint8_t res = semtech_loramac_send(&loramac, (uint8_t *)json, strlen(json));
    if (res == SEMTECH_LORAMAC_TX_DONE || res == SEMTECH_LORAMAC_TX_OK) {
        puts("Message sent with success");
    } else {
        printf("Fail to send: %d\n", res);
        xtimer_sleep(10);
        continue;
    }

    // wait for any received data
    // semtech_loramac_recv(&loramac);

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
    puts("All up, running the shell now");
    char line_buf[SHELL_DEFAULT_BUFSIZE];
    shell_run(shell_commands, line_buf, SHELL_DEFAULT_BUFSIZE);
}
