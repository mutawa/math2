import React from "react";
import { convertToArabicNumerals } from "./utils";
const {
  MAX_LIVES,
  NUMBER_OF_CORRECT_IN_SEQUENCE_ANSWERS_TO_GAIN_LIFE,
  LEVEL_NAMES,
} = __GAME__CONFIG__;

const Hud = ({
  score,
  lives,
  correctInSequence,
  level,
  columns,
  colWidth,
  propLength,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        padding: "0 10px",
        marginBottom: "10px",
        fontFamily: "monospace",
      }}
    >
      <div style={{ color: "white" }}>
        {" "}
        إجابات صحيحة {convertToArabicNumerals(score)}
        {"("}
        {columns}
        {")"}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <div style={{ color: "#e94560" }}>
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <span key={i} style={{ opacity: i < lives ? 1 : 0.3 }}>
              ❤️
            </span>
          ))}
        </div>
        <div>
          {Array.from({
            length: NUMBER_OF_CORRECT_IN_SEQUENCE_ANSWERS_TO_GAIN_LIFE,
          }).map((_, i) => (
            // bar indicators for correct answers in sequence
            <span
              key={i}
              style={{
                display: "inline-block",
                width: "10px",
                height: "6px",
                margin: "0 2px",
                background:
                  i < correctInSequence ? "#f9d71c" : "rgba(249, 215, 28, 0.3)",
                borderRadius: "2px",
              }}
            ></span>
          ))}
        </div>
      </div>

      <div style={{ color: "#4cc9f0" }}> المستوى {LEVEL_NAMES[level - 1]}</div>
    </div>
  );
};

export default Hud;
