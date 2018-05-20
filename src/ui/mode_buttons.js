import React from "react";

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

export default ({ mode, setMode }) => (
  <div className="inline-flex">
    {buttons.map((button, i) => (
      <button
        key={i}
        className={`db bn pv1 ph2 br2 br--top f6 outline-0 pointer
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
);
