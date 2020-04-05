import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import "./styles.css";

// States of the application
const MENU = 0; // Displays the menu
const SETTING_PASSWORD = 1; // Displays the password
const TEST_PASSWORD = 2; // Users can test to see if they have memorized the password 
const ENTER_PASSWORD = 3; // The actual password test

// Information related to the carpet
const SQUARE_COUNT = [4, 1, 1]; // How many sqaures the user has to choose on each level
const LEVELS = [1, 2, 3]; // The total number of levels
const MATCHES = SQUARE_COUNT.reduce((acc, curr) => acc + curr); // How many squares the user has to choose in total
const MAX_ATTMEPTS = 3; // The maximum attempts that the user has
const CARPET_HEIGHT = 810; // The height of the carpet

// Modes for the carpet 
const CREATE = 0; // This mdoe means that user is in create password mode
const TEST = 1; // This mode means that user is in test password mode
const ENTER = 2; // This mode means that user is doing the actual test

const userId = uuidv4(); // Assigns a unique user id to each user

// Sends the log to the server
function sendLog(log) {
  fetch("http://134.117.128.144/logs", {
    method: "post",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify(log)
  });
}

// Returns a random integer bewteen 0 and max
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

// Check the given square is in the carpet
function inCarpet(x, y) {
  return !x || !y
    ? true
    : !(x % 3 === 1 && y % 3 === 1) && inCarpet((x / 3) | 0, (y / 3) | 0);
}

// Generates a password
function getPassword(levels) {
  const password = [];

  for (let level = 1; level <= levels; level++) {
    for (let sq = 0; sq < SQUARE_COUNT[level - 1]; sq++) {
      let numOfSquare = 3 ** level; // The number of squares in each level depends on the level
      let row, col;
      do {
        row = getRandomInt(numOfSquare);
        col = getRandomInt(numOfSquare);
      } while (
        !inCarpet(row, col) ||
        password.filter(p => p[0] === level && p[1] === row && p[2] === col)
          .length > 0
      ); // If the square is not in carpet or if the current (row, col) combination exists already
      password.push([level, row, col]);
    }
  }

  return password;
}

// The entry point of the application
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

// A logical container that will toggle between the different views.
function Main() {
  const [state, setState] = useState(); // The state of the application
  const [passwordType, setPasswordType] = useState(); // The type of password that the user is operating on
  const [passwords, setPasswords] = useState({
    email: [],
    banking: [],
    shopping: []
  }); // The actual passwords for each category
  const [attempts, setAttempts] = useState({
    email: MAX_ATTMEPTS,
    banking: MAX_ATTMEPTS,
    shopping: MAX_ATTMEPTS
  }); // The attempets for each category
  const [confirm, setConfirm] = useState({
    email: false,
    bank: false,
    shopping: false
  }); // A record of if the user has correctly entered the password in test mode (To see if they have memorized the password or not). 

  // Password creatation view
  if (state === SETTING_PASSWORD) {
    return (
      <CarpAuth
        mode={CREATE}
        passwordType={passwordType}
        actualPassword={passwords[passwordType]}
        setState={setState}
      />
    );
  } 
  // Password tesing view
  else if (state === TEST_PASSWORD) {
    return (
      <CarpAuth
        mode={TEST}
        setState={setState}
        actualPassword={passwords[passwordType]}
        passwordType={passwordType}
        setConfirm={() => setConfirm({ ...confirm, [passwordType]: true })}
      />
    );
  } 
  // Actual password entering view
  else if (state === ENTER_PASSWORD) {
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
  } 
  // The menu view. By default this view is rendered
  else {
    return (
      <Menu
        optionsEnabled={Object.entries(passwords).map(p => {
          if (p[1].length > 1) {
            return p[0];
          }

          return "";
        })}
        setPass={(password, passwordType) =>
          setPasswords({ ...passwords, [passwordType]: password })
        }
        setPasswordType={setPasswordType}
        setState={setState}
        resetPassword={type => setPasswords({ ...passwords, [type]: [] })}
        attempts={attempts}
        resetAttempts={type =>
          setAttempts({ ...attempts, [type]: MAX_ATTMEPTS })
        }
        confirm={Object.entries(confirm).map(p => p[1])}
      />
    );
  }
}

const entities = ["Email", "Banking", "Shopping"]; // Available password category
const buttons = ["Create", "Test"]; // Available operations for each password category 

// The menu
function Menu({
  optionsEnabled,
  setPasswordType,
  setState,
  attempts,
  setPass,
  confirm
}) {
  return (
    <>
      {/* Renders each password category*/}
      {entities.map((e, i) => (
        <div
          style={{
            backgroundColor: optionsEnabled.includes(e.toLocaleLowerCase()) // Change background color 
              ? "#90EE90"
              : "lavender"
          }}
          key={i}
          className="menuOption"
        >
          Create Password for: <b>{e}</b>
          <div>
            {buttons.map((b, i) => (
              <button
                disabled={(() => {
                  // Disable the create option if the user has generated a password already
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

                  // Generates the password
                  if (b === "Create") {
                    setPasswordType(e.toLocaleLowerCase());
                    setPass(getPassword(LEVELS.length), e.toLocaleLowerCase());
                    setState(SETTING_PASSWORD);
                    sendLog({
                      time: new Date(),
                      type: e,
                      event: "Create",
                      action: "Start",
                      user: userId
                    });
                  } 
                  // Change to test view 
                  else if (b === "Test") {
                    setPasswordType(e.toLocaleLowerCase());
                    setState(TEST_PASSWORD);
                    sendLog({
                      time: new Date(),
                      event: "Create",
                      type: e,
                      action: "Test",
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
            backgroundColor: // Change background color
              !(confirm.filter(c => c).length === entities.length) ||
              attempts[e.toLocaleLowerCase()] < MAX_ATTMEPTS
                ? "gray"
                : "lavender"
          }}
        >
          Enter Password for: <b>{e}</b> (Attempts left:{" "}
          {attempts[e.toLocaleLowerCase()]})
          <div>
            <button
              onClick={ev => {
                ev.preventDefault();
                ev.stopPropagation();

                // Switches to actual test mdoe
                setState(ENTER_PASSWORD);
                setPasswordType(e.toLocaleLowerCase());
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
              disabled={
                /* The option is disabled if the user has not confirmed that 
                    they memorized the password */
                !(confirm.filter(c => c).length === entities.length) || 
                attempts[e.toLocaleLowerCase()] < MAX_ATTMEPTS
              }
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

// The authentication component
function CarpAuth({
  actualPassword = [],
  setState,
  mode,
  attempts,
  setAttempts,
  passwordType,
  setConfirm
}) {
  const [level, setLevel] = useState(1); // The current level in the carpet
  const [password, setPassword] = useState([]); // The password that the user has entered
  const [squareCount, setSquareCount] = useState(SQUARE_COUNT.map(l => l)); // How many squares did the user click
  const [done, setDone] = useState(false); // Has the user done entering the password
  const [success, setSuccess] = useState(false); // Wether or not the user has entered the password successfully  
  const [show, setShow] = useState(mode === CREATE); // Wether or not to show the correct password. Not enabled when doing actual test

  return (
    <>
    {/* If done then notify the user */}
      {done && (
        <div className="carpet-header">
          {success ? (
            <p>Authentication success</p>
          ) : (
            <>
              {/* The user can retry if the failed given that the number of attempts is not yet 0*/}
              <p className="right-margin">Authentication failed</p>
              {attempts > 0 && (
                <button
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Resets the states which lets the user to try again
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
      {/* The back button is only enabled if the user is not doing the actual test */}
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

                setState(MENU);
              }}
            >
              Back
            </button>
          );
        })()}
        {/* Display different information depending which mode the user is in */}
        {mode === ENTER && (
          <h4 className="right-margin">Attempts left: {attempts}</h4>
        )}
        <h4 className="right-margin">Current Level: {level}</h4>
        {mode !== CREATE && (
          <h4 className="right-margin">
            Square left to choose: {squareCount[level - 1]}
          </h4>
        )}
        {/* The show correct password option is only enabled if the user is not doing the actual test*/}
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
        {/* Allow the user to go back to the previous level */}
        <button
          id="next-button"
          className="right-margin"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();

            setLevel(level - 1);
          }}
          disabled={(mode !== CREATE && done) || level === 1} // Can only go back if not at the first level and not done entering
        >
          Previous
        </button>
        {/* Allows the user to go to the next level */}
        <button
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setLevel(level + 1);
          }}
          id="next-button"
          className="right-margin"
          disabled={(() => {
            // Can only go to the next level if not at the last level and not done entering the password
            if (mode === CREATE) {
              return level === LEVELS.length;
            } else {
              return squareCount[level - 1] > 0 || level === LEVELS.length;
            }
          })()}
        >
          Next
        </button>
        {/* Button to comfirm that password has been entered */}
        {mode !== CREATE && (
          <button
            id="next-button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();

              // Performs password checking
              let count = 0;
              for (let p of password) {
                for (let ap of actualPassword) {
                  if (p[0] === ap[0] && p[1] === ap[1] && p[2] === ap[2]) {
                    count++;
                  }
                }
              }
              if (count === MATCHES) {
                // The user has entered the correct password
                setSuccess(true);
                if (mode === ENTER) {
                  sendLog({
                    time: new Date(),
                    event: "Enter",
                    action: "Success",
                    type: passwordType,
                    user: userId
                  });
                }
                setConfirm(passwordType);
              } else {
                setSuccess(false);
                if (mode === ENTER) {
                  sendLog({
                    time: new Date(),
                    event: "Enter",
                    action: "Failure",
                    type: passwordType,
                    user: userId
                  });
                }
              }
              if (mode === ENTER) {
                sendLog({
                  time: new Date(),
                  event: "Enter",
                  action: "End",
                  type: passwordType,
                  user: userId
                });
              }

              if (mode === ENTER) {
                // Decreases attempts if in actual testing mode
                setAttempts(attempts - 1);
              }
              setDone(true);
            }}
            disabled={
              done || squareCount[level - 1] > 0 || level !== LEVELS.length // The user can't comfirm if password has not been entered
            }
          >
            Confirm
          </button>
        )}
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

          if (mode === CREATE) {
            return;
          }

          //If this square is selected already you can deselect by clicking it again
          if (
            password.filter(p => p[0] === level && p[1] === row && p[2] === col)
              .length > 0
          ) {
            // Decrease square count
            setSquareCount(
              squareCount.map((c, i) => {
                if (i === level - 1) {
                  return c + 1;
                }

                return c;
              })
            );
            // Deselects the square
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
            // Can's select more squares if the square count has been met in each level
            return;
          }

          // Increase the square count if a square is selected
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

// This component renders the carpet
function Carpet({ password, onClick, level, actualPassword, show }) {
  let squareSize = CARPET_HEIGHT / 3 ** level; // The size of the square
  // Generates the coordinates for the carpet
  let range = (m, n) =>
    Array.from(
      {
        length: Math.floor(n - m) + 1
      },
      (_, i) => m + i
    );

  // Generates the carpet
  let carpet = n => {
    let xs = range(0, Math.pow(3, n) - 1);
    return xs.map(x => xs.map(y => inCarpet(x, y)));
  };

  return (
    <div>
      {carpet(level).map((line, row) =>
        line.map((bool, col) => {
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

// Renders a single square. The color changes depending on the state
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
