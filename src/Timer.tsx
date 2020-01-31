import React from "react";
import { Machine, assign } from "xstate";
import { useMachine } from "@xstate/react";
import { Typography } from "@material-ui/core";

interface ITimerSchema {
  states: {
    running: {};
    paused: {};
  };
}
interface ILap {
  lap: number;
  time: number;
}
interface ITimerContext {
  timeElapsed: number;
  interval: number;
  currentLap: number;
  laps: [] | ILap[];
}

const timerMachine = Machine<ITimerContext, ITimerSchema>({
  id: "timer",
  initial: "paused",
  context: {
    timeElapsed: 0.0,
    interval: 0.01,
    currentLap: 0,
    laps: []
  },
  states: {
    running: {
      invoke: {
        src: context => cb => {
          const interval = setInterval(() => {
            cb("TICK");
          }, 1000 * context.interval);

          return () => {
            clearInterval(interval);
          };
        }
      },
      on: {
        PAUSE: {
          target: "paused"
        },
        TICK: {
          actions: assign<ITimerContext>({
            timeElapsed: context => +(context.timeElapsed + context.interval)
          })
        },
        LAP: {
          actions: assign((context: ITimerContext) => {
            const lap = {
              lap: context.currentLap + 1,
              time: context.timeElapsed
            };
            return {
              laps: [...context.laps, lap],
              currentLap: context.currentLap + 1,
              timeElapsed: 0
            };
          })
        }
      }
    },
    paused: {
      on: {
        START: {
          target: "running"
        }
      }
    }
  },
  on: {
    RESET: {
      actions: assign<ITimerContext>({
        timeElapsed: 0,
        laps: [],
        currentLap: 0
      })
    }
  }
});

function getShowTime(time: number) {
  // var days = Math.floor(difference / (1000 * 60 * 60 * 24));
  let hours: string | number = Math.floor(
    (time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  let minutes: string | number = Math.floor(
    (time % (1000 * 60 * 60)) / (1000 * 60)
  );
  let seconds: string | number = Math.floor((time % (1000 * 60)) / 1000);
  let milliseconds: string | number = Math.floor((time % (1000 * 60)) / 100);
  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;
  milliseconds =
    milliseconds < 100
      ? milliseconds < 10
        ? "00" + milliseconds
        : "0" + milliseconds
      : milliseconds;
  return hours + ":" + minutes + ":" + seconds + ":" + milliseconds;
}

const StopWatch: React.FC = () => {
  const [current, send] = useMachine(timerMachine);

  return (
    <>
      <Typography variant='h1' component='h1'>
        {current.context.timeElapsed.toFixed(2)}
      </Typography>
      <button onClick={() => send("RESET")}>Reset</button>
      {current.matches("running") && (
        <button onClick={() => send("PAUSE")}>Pause</button>
      )}
      {current.matches("paused") && (
        <button onClick={() => send("START")}>Play</button>
      )}
      <button
        onClick={() => send("LAP")}
        disabled={!current.matches("running")}
      >
        Lap
      </button>

      {(current.context.laps as Array<ILap>).map((lap: ILap) => (
        <p key={lap.lap}>
          Lap: {lap.lap}, Time: {lap.time}
        </p>
      ))}
    </>
  );
};

export default StopWatch;
