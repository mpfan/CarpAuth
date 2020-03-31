import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import "./styles.css";

const MENU = 0;
const SETTING_PASSWORD = 1;
const TEST_PASSWORD = 2;
const ENTER_PASSWORD = 3;
const CARPET_HEIGHT = 810;
const SQUARE_COUNT = [4, 1, 1];
const LEVELS = [1, 2, 3];
const MATCHES = LEVELS.reduce((acc, curr) => acc + curr);
const MAX_ATTMEPTS = 3;
const CREATE = 0;
const TEST = 1;
const ENTER = 2;

const userId = uuidv4();

function sendLog(log) {
  fetch("http://134.117.128.144/logs", {
    method: "post",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify(log)
  });
}

export default function App() {
  return (
    <div className="App">
      <div className="header">
        <h1>CarpAuth</h1>
        <hr />
      </div>
      <Main />
    </div>
  );
}

function Main() {
  const [state, setState] = useState();
  const [passwordType, setPasswordType] = useState();
  const [passwords, setPasswords] = useState({
    email: [],
    banking: [],
    shopping: []
  });
  const [attempts, setAttempts] = useState({
    email: MAX_ATTMEPTS,
    banking: MAX_ATTMEPTS,
    shopping: MAX_ATTMEPTS
  });

  if (state === SETTING_PASSWORD) {
    return (
      <CarpAuth
        mode={CREATE}
        passwordType={passwordType}
        setState={setState}
        setPass={password =>
          setPasswords({ ...passwords, [passwordType]: password })
        }
      />
    );
  } else if (state === TEST_PASSWORD) {
    return (
      <CarpAuth
        mode={TEST}
        setState={setState}
        actualPassword={passwords[passwordType]}
        passwordType={passwordType}
      />
    );
  } else if (state === ENTER_PASSWORD) {
    return (
      <CarpAuth
        mode={ENTER}
        passwordType={passwordType}
        setState={setState}
        actualPassword={passwords[passwordType]}
        attempts={attempts[passwordType]}
        setAttempts={a => setAttempts({ ...attempts, [passwordType]: a })}
        resetAttempts={() =>
          setAttempts({ ...attempts, [passwordType]: MAX_ATTMEPTS })
        }
        resetPassword={() => setPasswords({ ...passwords, [passwordType]: [] })}
      />
    );
  } else {
    return (
      <Menu
        optionsEnabled={Object.entries(passwords).map(p => {
          if (p[1].length > 1) {
            return p[0];
          }

          return "";
        })}
        setPasswordType={setPasswordType}
        setState={setState}
        resetPassword={type => setPasswords({ ...passwords, [type]: [] })}
        attempts={attempts}
        resetAttempts={type =>
          setAttempts({ ...attempts, [type]: MAX_ATTMEPTS })
        }
      />
    );
  }
}

const entities = ["Email", "Banking", "Shopping"];
const buttons = ["Create", "Test", "Reset"];

function Menu({
  optionsEnabled,
  setPasswordType,
  setState,
  resetPassword,
  attempts,
  resetAttempts
}) {
  return (
    <>
      {entities.map((e, i) => (
        <div key={i} className="menuOption">
          Create Password for: <b>{e}</b>
          <div>
            {buttons.map((b, i) => (
              <button
                disabled={(() => {
                  if (b === "Create") {
                    return optionsEnabled.includes(e.toLocaleLowerCase());
                  } else {
                    return !optionsEnabled.includes(e.toLocaleLowerCase());
                  }
                })()}
                key={i}
                className="button"
                onClick={event => {
                  event.preventDefault();
                  event.stopPropagation();

                  if (b === "Create") {
                    setPasswordType(e.toLocaleLowerCase());
                    setState(SETTING_PASSWORD);
                    sendLog({
                      time: new Date(),
                      type: e,
                      event: "Create",
                      action: "Start",
                      user: userId
                    });
                  } else if (b === "Test") {
                    setPasswordType(e.toLocaleLowerCase());
                    setState(TEST_PASSWORD);
                    sendLog({
                      time: new Date(),
                      event: "Create",
                      type: e,
                      action: "Test",
                      user: userId
                    });
                  } else if (b === "Reset") {
                    resetAttempts(e.toLocaleLowerCase());
                    resetPassword(e.toLocaleLowerCase());
                    sendLog({
                      time: new Date(),
                      event: "Create",
                      type: e,
                      action: "Reset",
                      user: userId
                    });
                  }
                }}
              >
                {b}
              </button>
            ))}
          </div>
          <div />
        </div>
      ))}
      <hr className="divider" />
      {entities.map((e, i) => (
        <div
          key={i}
          className="menuOption"
          style={{
            backgroundColor: optionsEnabled.includes(e.toLocaleLowerCase())
              ? "lavender"
              : "gray"
          }}
        >
          Enter Password for: <b>{e}</b> (Attempts left:{" "}
          {attempts[e.toLocaleLowerCase()]})
          <div>
            <button
              onClick={ev => {
                ev.preventDefault();
                ev.stopPropagation();

                setState(ENTER_PASSWORD);
                sendLog({
                  time: new Date(),
                  event: "Create",
                  type: e,
                  action: "Test End",
                  user: userId
                });
                sendLog({
                  time: new Date(),
                  event: "Enter",
                  type: e,
                  action: "Start",
                  user: userId
                });
              }}
              disabled={!optionsEnabled.includes(e.toLocaleLowerCase())}
            >
              Enter
            </button>
          </div>
          <div />
        </div>
      ))}
    </>
  );
}

function CarpAuth({
  setPass = () => {},
  actualPassword = [],
  setState,
  mode,
  attempts,
  setAttempts,
  resetAttempts,
  resetPassword,
  passwordType
}) {
  const [level, setLevel] = useState(1);
  const [password, setPassword] = useState([]);
  const [squareCount, setSquareCount] = useState(SQUARE_COUNT.map(l => l));
  const [done, setDone] = useState(false);
  const [success, setSuccess] = useState(false);
  const [show, setShow] = useState(false);

  return (
    <>
      {done && (
        <div className="carpet-header">
          {success ? (
            <p>Authentication success</p>
          ) : (
            <>
              <p className="right-margin">Authentication failed</p>
              {attempts > 0 && (
                <button
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();

                    setSquareCount(SQUARE_COUNT.map(l => l));
                    setPassword([]);
                    setLevel(1);
                    setDone(false);
                    sendLog({
                      time: new Date(),
                      event: "Enter",
                      action: "Start",
                      type: passwordType,
                      user: userId
                    });
                  }}
                  id="next-button"
                >
                  Retry
                </button>
              )}
            </>
          )}
        </div>
      )}
      <div className="carpet-header">
        {(() => {
          if (
            mode === ENTER &&
            !((done && success) || (done && attempts === 0))
          ) {
            return null;
          }

          return (
            <button
              id="next-button"
              className="right-margin"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();

                if (mode === ENTER) {
                  resetAttempts();
                  resetPassword();
                }
                setState(MENU);
              }}
            >
              Back
            </button>
          );
        })()}
        {mode === ENTER && (
          <h4 className="right-margin">Attempts left: {attempts}</h4>
        )}
        <h4 className="right-margin">Current Level: {level}</h4>
        <h4 className="right-margin">
          Square left to choose: {squareCount[level - 1]}
        </h4>
        {mode === TEST && (
          <button
            disabled={done}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();

              setShow(!show);
            }}
            id="next-button"
            className="right-margin"
          >
            Show Correct Password
          </button>
        )}
        <button
          id="next-button"
          className="right-margin"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();

            setLevel(level - 1);
          }}
          disabled={(mode !== CREATE && done) || level === 1}
        >
          Previous
        </button>
        <button
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setLevel(level + 1);
          }}
          id="next-button"
          className="right-margin"
          disabled={
            (mode !== CREATE && done) ||
            level === LEVELS.length ||
            squareCount[level - 1] > 0
          }
        >
          Next
        </button>
        <button
          id="next-button"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();

            if (mode === CREATE) {
              setPass(password);
              setState(MENU);
              sendLog({
                time: new Date(),
                event: "Create",
                action: "Done Create",
                type: passwordType,
                user: userId
              });
            } else {
              let count = 0;
              for (let p of password) {
                for (let ap of actualPassword) {
                  if (p[0] === ap[0] && p[1] === ap[1] && p[2] === ap[2]) {
                    count++;
                  }
                }
              }

              if (count === MATCHES) {
                setSuccess(true);
                sendLog({
                  time: new Date(),
                  event: "Enter",
                  action: "Success",
                  type: passwordType,
                  user: userId
                });
              } else {
                setSuccess(false);
                sendLog({
                  time: new Date(),
                  event: "Enter",
                  action: "Failure",
                  type: passwordType,
                  user: userId
                });
              }
              sendLog({
                time: new Date(),
                event: "Enter",
                action: "End",
                type: passwordType,
                user: userId
              });

              if (mode === ENTER) {
                setAttempts(attempts - 1);
              }
              setDone(true);
            }
          }}
          disabled={
            done || squareCount[level - 1] > 0 || level !== LEVELS.length
          }
        >
          Confirm
        </button>
      </div>
      <Carpet
        className="carpet"
        show={show}
        actualPassword={actualPassword}
        level={level}
        password={password}
        onClick={(e, row, col) => {
          e.preventDefault();
          e.stopPropagation();

          //If this square is selected already you can deslect by clicking it again
          if (
            password.filter(p => p[0] === level && p[1] === row && p[2] === col)
              .length > 0
          ) {
            setSquareCount(
              squareCount.map((c, i) => {
                if (i === level - 1) {
                  return c + 1;
                }

                return c;
              })
            );
            setPassword([
              ...password.filter(p => {
                if (p[0] === level) {
                  return p[0] === level && !(p[1] === row && p[2] === col);
                }
                return true;
              })
            ]);
            return;
          } else if (squareCount[level - 1] === 0) {
            return;
          }

          setSquareCount(
            squareCount.map((c, i) => {
              if (i === level - 1) {
                return c - 1;
              }

              return c;
            })
          );
          setPassword([...password, [level, row, col]]);
        }}
      />
    </>
  );
}

// https://rosettacode.org/wiki/Sierpinski_carpet#
function Carpet({ password, onClick, level, actualPassword, show }) {
  let squareSize = CARPET_HEIGHT / 3 ** level;
  let numberOfRows = CARPET_HEIGHT / squareSize; // rows and columns should be the same
  let range = (m, n) =>
    Array.from(
      {
        length: Math.floor(n - m) + 1
      },
      (_, i) => m + i
    );

  let carpet = n => {
      let xs = range(0, Math.pow(3, n) - 1);
      return xs.map(x => xs.map(y => inCarpet(x, y)));
    },
    // https://en.wikipedia.org/wiki/Sierpinski_carpet#Construction

    // inCarpet :: Int -> Int -> Bool
    inCarpet = (x, y) =>
      !x || !y
        ? true
        : !(x % 3 === 1 && y % 3 === 1) && inCarpet((x / 3) | 0, (y / 3) | 0);

  let currentRow = 0;
  return (
    <div>
      {carpet(level).map(line =>
        line.map((bool, i) => {
          const row = currentRow;
          const col = i % numberOfRows;
          if (col === 0) {
            currentRow++;
          }

          return (
            <>
              {col === 0 && <br />}
              <Square
                key={row + col}
                show={
                  show &&
                  actualPassword.filter(
                    p => p[0] === level && p[1] === row && p[2] === col
                  ).length > 0
                }
                selected={
                  password.filter(
                    p => p[0] === level && p[1] === row && p[2] === col
                  ).length > 0
                }
                squareSize={squareSize}
                filled={bool}
                onClick={e => onClick(e, row, col)}
              />
            </>
          );
        })
      )}
    </div>
  );
}
function Square({ onClick, squareSize, filled, selected, show }) {
  let color = "lavender";
  if (!filled) {
    color = "white";
  } else if (show) {
    color = "green";
  } else if (selected) {
    color = "black";
  }
  return (
    <div
      onClick={e => {
        if (!filled) return;
        onClick(e);
      }}
      style={{
        display: "inline-block",
        width: squareSize,
        height: squareSize,
        background: color,
        border: "1px solid #123",
        marginRight: -1,
        marginBottom: -5
      }}
    />
  );
}
