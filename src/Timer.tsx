import React from "react";
import { Machine, assign } from "xstate";
import { useMachine } from "@xstate/react";
import {
  Typography,
  Button as MaterialButton,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell
} from "@material-ui/core";
import styled from "@emotion/styled";

const StopwatchWrapper = styled.div`
  display: flex;
  min-height: 100vh;
  align-items: center;
  flex-direction: column;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Button = styled(MaterialButton)`
  && {
    margin: 10px 5px;
  }
`;

const LapTable = styled(Table)`
  && {
    max-width: 50%;
    text-align: center;
  }
  && th {
    font-weight: bold;
  }
  && th,
  td {
    text-align: center;
  }
`;

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

const StopWatch: React.FC = () => {
  const [current, send] = useMachine(timerMachine);

  return (
    <StopwatchWrapper>
      <Typography variant="h1" component="h1">
        {current.context.timeElapsed.toFixed(2)}
      </Typography>
      <ButtonRow>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => send("RESET")}
        >
          Reset
        </Button>
        {current.matches("running") && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => send("PAUSE")}
          >
            Pause
          </Button>
        )}
        {current.matches("paused") && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => send("START")}
          >
            Play
          </Button>
        )}
        <Button
          onClick={() => send("LAP")}
          disabled={!current.matches("running")}
          variant="contained"
        >
          Lap
        </Button>
      </ButtonRow>
      <LapTable>
        <TableHead>
          <TableRow>
            <TableCell>Lap:</TableCell>
            <TableCell>Time:</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(current.context.laps as Array<ILap>).map((lap: ILap) => (
            <TableRow key={lap.lap}>
              <TableCell>{lap.lap}</TableCell>
              <TableCell>{lap.time.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </LapTable>
    </StopwatchWrapper>
  );
};

export default StopWatch;
