import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const WIDTH = 450;
const HEIGHT = 700;
const INITIAL_COLUMNS = 3;

// https://vite.dev/config/
export default defineConfig({
  base: "/fun/math/space3/",
  plugins: [react()],
  define: {
    __GAME__CONFIG__: {
      INITIAL_COLUMNS,
      MAX_NUMBER_OF_COLUMNS: 7,
      WIDTH,
      HEIGHT,
      // OPERATIONS: ["+", "*", "-", "/"],
      OPERATIONS: ["+", "*", "-"],

      ALLOW_NEGATIVE_ANSWERS: false,

      SHIP_Y: HEIGHT - 110,
      SPAWN_Y: -20,
      NUMBER_OF_CORRECT_IN_SEQUENCE_ANSWERS_TO_GAIN_LIFE: 10,
      NUMBER_OF_CORRECT_TO_WIN: 100,
      MAX_LIVES: 13,
      STARTING_LIVES: 4,
      LEVEL_UP_THRESHOLD: 15,
      STARTING_OPERAND_MIN: 1,
      STARTING_OPERAND_MAX: 4,
      MAX_INCREMENT_PER_LEVEL: 2,
      MIN_INCREMENT_PER_LEVEL: 1,
      INITIAL_ATTACK_INTERVAL: 1300,
      INITIAL_UFO_SPEED: 10,
      LEVEL_UP_ATTACK_INTERVAL_DECREMENT: 50,
      LEVEL_UP_UFO_SPEED_INCREMENT: 5,
      LEVEL_NAMES: [
        "الأول",
        "الثاني",
        "الثالث",
        "الرابع",
        "الخامس",
        "السادس",
        "السابع",
        "الثامن",
        "التاسع",
        "العاشر",
      ],
    },
  },
});
