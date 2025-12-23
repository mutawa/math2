import React from "react";
import { motion } from "framer-motion";
const baseUrl = import.meta.env.BASE_URL;
import { convertToArabicNumerals } from "./utils";

const Ufo = ({ ufo, isShaking, isGameOver, colWidth, handleInteraction }) => {
  const { y, col, spriteIndex, val } = ufo;
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: 1,
        scale: 1,
        y,
        x: isShaking ? [-8, 8, -8, 8, 0] : 0,
      }}
      exit={{
        opacity: 0,
        scale: 4,
        filter: "brightness(3) blur(2px)",
      }}
      transition={{
        y: { type: "spring", stiffness: 100 },
        x: { duration: 0.3 },
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        handleInteraction(col, true);
      }}
      style={{ cursor: isGameOver ? "default" : "pointer" }}
    >
      <image
        href={`${baseUrl}/images/${spriteIndex}.png`}
        x={ufo.col * colWidth + colWidth / 2 - 35}
        y={-60}
        width="70"
        height="40"
      />
      <ellipse
        cx={ufo.col * colWidth + colWidth / 2}
        cy={0}
        rx="35"
        ry="14"
        fill="#ffffffff"
        stroke="#000"
      />
      <text
        x={col * colWidth + colWidth / 2}
        y={7}
        textAnchor="middle"
        fill="black"
        fontSize="20"
        fontWeight="900"
        style={{ pointerEvents: "none" }}
      >
        {convertToArabicNumerals(val)}
      </text>
    </motion.g>
  );
};

export default Ufo;
