const baseUrl = import.meta.env.BASE_URL;

const {
  STARTING_OPERAND_MIN,
  STARTING_OPERAND_MAX,
  MAX_INCREMENT_PER_LEVEL,
  MIN_INCREMENT_PER_LEVEL,
  OPERATIONS,
  ALLOW_NEGATIVE_ANSWERS,
} = __GAME__CONFIG__;

function convertToArabicNumerals(number) {
  const standardDigits = "0123456789";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  return number.toString().replace(/[0-9]/g, (digit) => {
    return arabicDigits[standardDigits.indexOf(digit)];
  });
}

const playSound = (name) => {
  const audio = new Audio(`${baseUrl}/sounds/${name}.mp3`); // Path to your file
  audio.volume = 0.5;
  audio
    .play()
    .catch((e) => console.log(`Audio play of [${name}] blocked by browser`));
};

const createProblem = (level) => {
  const operation = OPERATIONS[Math.floor(Math.random() * OPERATIONS.length)];

  const minVal = STARTING_OPERAND_MIN + (level - 1) * MIN_INCREMENT_PER_LEVEL;
  const maxVal = STARTING_OPERAND_MAX + (level - 1) * MAX_INCREMENT_PER_LEVEL;

  // Standard random range formula: Math.random() * (max - min + 1) + min
  const n1 = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
  const n2 = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;

  const a1 = convertToArabicNumerals(n1);
  const a2 = convertToArabicNumerals(n2);
  const id = Math.random();

  switch (operation) {
    case "+":
      return {
        q: `${a1} + ${a2}`,
        a: n1 + n2,
        id,
      };
    case "-":
      if (ALLOW_NEGATIVE_ANSWERS) {
        return {
          q: `${a1} - ${a2}`,
          a: n1 - n2,
          id,
        };
      } else {
        let o1 = n1;
        let o2 = n2;
        const swap = n1 < n2;
        if (swap) {
          o1 = n2;
          o2 = n1;
        }
        return {
          q: `${convertToArabicNumerals(o1)} - ${convertToArabicNumerals(o2)}`,
          a: o1 - o2,
          id,
        };
      }

    case "*":
      return {
        q: `${a1} × ${a2}`,
        a: n1 * n2,
        id,
      };
    case "/":
      const prod = n1 * n2;
      return {
        q: `${convertToArabicNumerals(prod)} ÷ ${a1}`,
        a: n2,
        id,
      };
  }

  return {
    q: `${a1} × ${a2}`,
    a: n1 * n2,
    id: Math.random(),
  };
};

export { convertToArabicNumerals, playSound, createProblem };
