import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLUMNS = 5;
const WIDTH = 450;
const HEIGHT = 900;
const COL_WIDTH = WIDTH / COLUMNS;
const SHIP_Y = HEIGHT - 110;
const SPAWN_Y = -20; // Constant for new UFO starting position
const NUMBER_OF_CORRECT_IN_SEQUENCE_ANSWERS_TO_GAIN_LIFE = 4;
const NUMBER_OF_CORRECT_TO_WIN = 100;

const MAX_LIVES = 6;
const STARTING_LIVES = 3;

const LEVEL_NAMES = [
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
];

// Define these outside the component or inside a useMemo to prevent re-creation
const playSuccessSound = () => {
  const audio = new Audio("/sounds/correct.mp3"); // Path to your file
  audio.volume = 0.5;
  audio.play().catch((e) => console.log("Audio play blocked by browser"));
};

const playLifeSound = () => {
  const audio = new Audio("/sounds/life.mp3"); // Path to your file
  audio.volume = 0.5;
  audio.play().catch((e) => console.log("Audio play blocked by browser"));
};

const playErrorSound = () => {
  const audio = new Audio("/sounds/wrong.mp3");
  audio.volume = 0.4;
  audio.play().catch((e) => console.log("Audio play blocked by browser"));
};

function convertToArabicNumerals(number) {
  const standardDigits = "0123456789";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  return number.toString().replace(/[0-9]/g, (digit) => {
    return arabicDigits[standardDigits.indexOf(digit)];
  });
}

// --- GAME CONFIGURATION ---
const LEVEL_UP_THRESHOLD = 20;
const STARTING_OPERAND_MIN = 1;
const STARTING_OPERAND_MAX = 5;
const MAX_INCREMENT_PER_LEVEL = 2;
const MIN_INCREMENT_PER_LEVEL = 1;

const createProblem = (level) => {
  const minVal = STARTING_OPERAND_MIN + (level - 1) * MIN_INCREMENT_PER_LEVEL;
  const maxVal = STARTING_OPERAND_MAX + (level - 1) * MAX_INCREMENT_PER_LEVEL;

  // Standard random range formula: Math.random() * (max - min + 1) + min
  const n1 = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
  const n2 = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;

  const a1 = convertToArabicNumerals(n1);
  const a2 = convertToArabicNumerals(n2);

  return {
    q: `${a1} × ${a2}`,
    a: n1 * n2,
    id: Math.random(),
  };
};

export default function MathInvadersSafeShuffle() {
  const [problems, setProblems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [ufos, setUfos] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(STARTING_LIVES); // Track wrong answers
  const [correctInSequence, setCorrectInSequence] = useState(0);
  const [level, setLevel] = useState(1);
  const [shipCol, setShipCol] = useState(1);

  const [isFiring, setIsFiring] = useState(false);
  const [bulletDir, setBulletDir] = useState("up");
  const [firedFromCol, setFiredFromCol] = useState(1);
  const [isShaking, setIsShaking] = useState(false);
  const [wrongHitId, setWrongHitId] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const initGame = (currentLevel = 1) => {
    const initialProblems = Array.from({ length: COLUMNS }).map(() =>
      createProblem(currentLevel)
    );
    setLives(STARTING_LIVES);
    setCorrectInSequence(0);

    setProblems(initialProblems);
    setActiveId(initialProblems[Math.floor(Math.random() * COLUMNS)].id);
    setUfos(
      initialProblems.map((prob, i) => ({
        id: prob.id,
        col: i,
        val: prob.a,
        spriteIndex: Math.floor(Math.random() * 8) + 1,
        y: 50,
      }))
    );
    if (currentLevel === 1) setScore(0);
    setLevel(currentLevel);
    setIsGameOver(false);
    setIsFiring(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  const activeProblem = problems.find((p) => p.id === activeId) || {
    q: "",
    a: null,
  };

  useEffect(() => {
    const calculatedLevel = Math.floor(score / LEVEL_UP_THRESHOLD) + 1;
    if (calculatedLevel > level) {
      setLevel(calculatedLevel);
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 2000);
    }
  }, [score, level]);

  useEffect(() => {
    if (isFiring || isGameOver) return;
    const interval = setInterval(() => {
      setUfos((prev) => {
        const nextUfos = prev.map((u) => ({ ...u, y: u.y + 40 }));
        if (nextUfos.some((u) => u.y >= SHIP_Y)) setIsGameOver(true);
        return nextUfos;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isFiring, isGameOver]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === " ") e.preventDefault();
      if (isFiring || isGameOver) return;
      if (e.key === "ArrowLeft") setShipCol((p) => Math.max(0, p - 1));
      if (e.key === "ArrowRight")
        setShipCol((p) => Math.min(COLUMNS - 1, p + 1));
      if (e.key === " ") handleInteraction(shipCol, true);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFiring, isGameOver, shipCol]);

  const handleInteraction = (colIndex, shouldFire = false) => {
    if (isFiring || isGameOver) return;
    setShipCol(colIndex);
    if (shouldFire) {
      setFiredFromCol(colIndex);
      setBulletDir("up");
      setIsFiring(true);
    }
  };

  const handleImpact = () => {
    const hitUfo = ufos.find((u) => u.col === firedFromCol);
    if (!hitUfo) {
      setIsFiring(false);
      return;
    }

    // Check if the shot UFO matches the answer the ship is currently looking for
    if (hitUfo.val === activeProblem.a) {
      // CORRECT ANSWER
      let newCorrectInSequence = correctInSequence + 1;
      if (
        newCorrectInSequence >=
        NUMBER_OF_CORRECT_IN_SEQUENCE_ANSWERS_TO_GAIN_LIFE
      ) {
        newCorrectInSequence = 0;
        // Grant an extra life
        if (lives < MAX_LIVES) {
          setLives((l) => l + 1);
        }
        playLifeSound();
      } else {
        playSuccessSound();
      }
      setCorrectInSequence(newCorrectInSequence);

      setIsShaking(true);

      // 1. Identify all UFOs that ARE NOT the one we just hit
      const remainingUfos = ufos.filter((u) => u.id !== hitUfo.id);
      setUfos(remainingUfos);

      setTimeout(() => {
        setIsShaking(false);
        const newScore = score + 1;
        setScore(newScore);

        if (newScore >= NUMBER_OF_CORRECT_TO_WIN) {
          alert("مبروك! لقد فزت باللعبة!");
          setIsGameOver(true);
          return;
        }

        const currentLevel = Math.floor(newScore / LEVEL_UP_THRESHOLD) + 1;
        const newProb = createProblem(currentLevel);

        // 2. LOGIC FIX: Find the problem ID that matches the UFO we actually hit.
        // We look for the ID in the problems pool that matches the hitUfo.id.
        const updatedPool = problems.map((p) =>
          p.id === hitUfo.id ? newProb : p
        );
        setProblems(updatedPool);

        // 3. TARGET SELECTION:
        // Now we pick the next active problem from the UFOs that are still on screen.
        const visibleUfos = remainingUfos.filter((u) => u.y > SPAWN_Y);

        let nextId;
        if (visibleUfos.length > 0) {
          nextId =
            visibleUfos[Math.floor(Math.random() * visibleUfos.length)].id;
        } else {
          // Fallback to the newly created problem if screen is empty
          nextId = newProb.id;
        }

        setActiveId(nextId);

        // 4. Spawn the replacement
        const ufoToSpawn = {
          id: newProb.id,
          col: hitUfo.col,
          val: newProb.a,
          spriteIndex: Math.floor(Math.random() * 8) + 1,
          y: SPAWN_Y,
        };

        setUfos([...remainingUfos, ufoToSpawn]);
        setIsFiring(false);
      }, 400);
    } else {
      // WRONG ANSWER
      setCorrectInSequence(0); // Reset correct-in-a-row counter
      playErrorSound(); // <--- Trigger sound

      const newLives = lives - 1;
      setLives(newLives);

      if (newLives <= 0) {
        setIsGameOver(true);
      }

      setWrongHitId(hitUfo.id);
      setBulletDir("down");
      setTimeout(() => setWrongHitId(null), 300);
    }
  };

  const currentTargetY = ufos.find((u) => u.col === firedFromCol)?.y || 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "#1a1a2e",
        padding: "10px",
        touchAction: "none",
        width: "100%",
        maxWidth: "420px",
        margin: "0 auto",
        borderRadius: "20px",
        position: "relative",
      }}
    >
      {/* HUD: Score, Level, and Lives */}
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
                    i < correctInSequence
                      ? "#f9d71c"
                      : "rgba(249, 215, 28, 0.3)",
                  borderRadius: "2px",
                }}
              ></span>
            ))}
          </div>
        </div>

        <div style={{ color: "#4cc9f0" }}>
          {" "}
          المستوى {LEVEL_NAMES[level - 1]}
        </div>
      </div>

      {/* <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          padding: "0 10px",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            color: "#4cc9f0",
            fontSize: "18px",
            fontFamily: "monospace",
          }}
        >
          LVL: {level}
        </div>
        <div
          style={{ color: "white", fontSize: "18px", fontFamily: "monospace" }}
        >
          SCORE: {score}
        </div>
      </div> */}

      <div style={{ position: "relative", width: "100%" }}>
        <motion.svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          height="auto"
          animate={isShaking ? { x: [-5, 5, -5, 5, 0] } : {}}
          style={{
            background: "#16213e",
            borderRadius: "10px",
            border: "2px solid #0f3460",
            overflow: "hidden",
          }}
        >
          {!isGameOver &&
            Array.from({ length: COLUMNS }).map((_, i) => (
              <rect
                key={`z-${i}`}
                x={i * COL_WIDTH}
                y={0}
                width={COL_WIDTH}
                height={HEIGHT}
                fill="transparent"
                onPointerDown={() => handleInteraction(i, false)}
              />
            ))}

          <AnimatePresence>
            {ufos.map((ufo) => (
              <motion.g
                key={ufo.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: ufo.y,
                  x: wrongHitId === ufo.id ? [-8, 8, -8, 8, 0] : 0,
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
                  handleInteraction(ufo.col, true);
                }}
                style={{ cursor: isGameOver ? "default" : "pointer" }}
              >
                <image
                  href={`/images/${ufo.spriteIndex}.png`}
                  x={ufo.col * COL_WIDTH + 9}
                  y={-60}
                  width="70"
                  height="40"
                />
                <ellipse
                  cx={ufo.col * COL_WIDTH + COL_WIDTH / 2}
                  cy={0}
                  rx="35"
                  ry="14"
                  fill="#ffffffff"
                  stroke="#000"
                />
                <text
                  x={ufo.col * COL_WIDTH + COL_WIDTH / 2}
                  y={7}
                  textAnchor="middle"
                  fill="black"
                  fontSize="20"
                  fontWeight="900"
                  style={{ pointerEvents: "none" }}
                >
                  {convertToArabicNumerals(ufo.val)}
                </text>
              </motion.g>
            ))}
          </AnimatePresence>

          {isFiring && (
            <motion.rect
              x={firedFromCol * COL_WIDTH + COL_WIDTH / 2 - 2}
              initial={{ y: HEIGHT - 110 }}
              animate={{
                y: bulletDir === "up" ? currentTargetY : HEIGHT - 110,
              }}
              onAnimationComplete={() =>
                bulletDir === "up" ? handleImpact() : setIsFiring(false)
              }
              transition={{
                duration: bulletDir === "up" ? 0.2 : 0.5,
                ease: "linear",
              }}
              width="4"
              height="20"
              fill={bulletDir === "up" ? "#f9d71c" : "#ff4d4d"}
            />
          )}

          <motion.g
            animate={{ x: shipCol * COL_WIDTH }}
            transition={{ type: "spring", bounce: 0.1 }}
          >
            <rect
              x={5}
              y={HEIGHT - 90}
              width={COL_WIDTH - 10}
              height="50"
              rx="8"
              fill="#4cc9f0"
              stroke="#fff"
              strokeWidth="2"
            />
            <rect
              x={COL_WIDTH / 2 - 8}
              y={HEIGHT - 105}
              width={16}
              height="20"
              rx="2"
              fill="#4cc9f0"
            />
            <text
              x={COL_WIDTH / 2}
              y={HEIGHT - 58}
              textAnchor="middle"
              fill="#1a1a2e"
              fontSize={isGameOver ? "18" : "22"}
              fontWeight="bold"
              style={{ fontFamily: "monospace", pointerEvents: "none" }}
            >
              {isGameOver ? "BOOM!" : activeProblem.q}
            </text>
            {!isFiring && !isGameOver && (
              <circle
                cx={COL_WIDTH / 2}
                cy={HEIGHT - 115}
                r="4"
                fill="#f9d71c"
              />
            )}
          </motion.g>
        </motion.svg>

        <AnimatePresence>
          {showLevelUp && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              style={{
                position: "absolute",
                top: "40%",
                width: "100%",
                textAlign: "center",
                color: "#4cc9f0",
                fontSize: "48px",
                fontWeight: "bold",
                textShadow: "0 0 10px #000",
                pointerEvents: "none",
              }}
            >
              LEVEL UP!
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isGameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(26, 26, 46, 0.95)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: "10px",
                color: "white",
              }}
            >
              <h2 style={{ fontSize: "40px", marginBottom: "10px" }}>
                {score >= NUMBER_OF_CORRECT_TO_WIN
                  ? "لقد فزت باللعبة!"
                  : "انتهت اللعبة"}
              </h2>
              <button
                onClick={() => initGame(1)}
                style={{
                  padding: "12px 24px",
                  fontSize: "18px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#4cc9f0",
                  color: "#1a1a2e",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                العب مرة أخرى
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
