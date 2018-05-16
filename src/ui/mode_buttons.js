import React from "react";
import { Subscribe } from "unstated";
import StateContainer from "../state";

const buttons = [
  {
    mode: "code",
    title: "JSON"
  },
  {
    mode: "table",
    title: "Table"
  },
  {
    mode: "help",
    title: "Help"
  }
];

export default () => (
  <Subscribe to={[StateContainer]}>
    {({ state: { mode }, setMode }) => (
      <div>
        {buttons.map((button, i) => (
          <button
            key={i}
            className={`bn pv1 ph2 br2 br--top outline-0
                  ${
                    mode == button.mode
                      ? "bg-light-gray black"
                      : "bg-white black-50"
                  }`}
            onClick={() => setMode(button.mode)}
          >
            {button.title}
          </button>
        ))}
      </div>
    )}
  </Subscribe>
);
