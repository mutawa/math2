import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Ufo from "./Ufo";
import Hud from "./Hud";

import { playSound, createProblem } from "./utils";

const {
  INITIAL_COLUMNS,
  WIDTH,
  HEIGHT,
  SHIP_Y,
  SPAWN_Y,
  NUMBER_OF_CORRECT_IN_SEQUENCE_ANSWERS_TO_GAIN_LIFE,
  NUMBER_OF_CORRECT_TO_WIN,
  MAX_LIVES,
  STARTING_LIVES,
  LEVEL_UP_THRESHOLD,
  INITIAL_ATTACK_INTERVAL,
  INITIAL_UFO_SPEED,
  LEVEL_UP_ATTACK_INTERVAL_DECREMENT,
  LEVEL_UP_UFO_SPEED_INCREMENT,
  MAX_NUMBER_OF_COLUMNS,
} = __GAME__CONFIG__;

// Define these outside the component or inside a useMemo to prevent re-creation

export default function MathInvadersSafeShuffle() {
  const [attackInterval, setAttackInterval] = useState(INITIAL_ATTACK_INTERVAL);
  const [ufoSpeed, setUfoSpeed] = useState(INITIAL_UFO_SPEED);
  const [columns, setColumns] = useState(INITIAL_COLUMNS);
  const colWidth = WIDTH / columns;

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
  const [stars, setStars] = useState([]);

  const resetUfos = ({ props = null }) => {
    const p = props ?? problems;
    const cols = Math.min(p.length, MAX_NUMBER_OF_COLUMNS);

    setUfos(
      p.slice(0, cols).map((prob, i) => ({
        id: prob.id,
        col: i,
        val: prob.a,
        spriteIndex: Math.floor(Math.random() * 8) + 1,
        y: -15,
      }))
    );
  };

  const initGame = (currentLevel = 1) => {
    const initialProblems = Array.from({ length: columns }).map(() =>
      createProblem(currentLevel)
    );
    setStars(
      Array.from({ length: 50 }).map(() => ({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        r: Math.random() * 1.5,
        opacity: Math.random(),
        duration: `${5 + Math.random() * 5}s`,
      }))
    );
    setAttackInterval(INITIAL_ATTACK_INTERVAL);
    setLives(STARTING_LIVES);
    setCorrectInSequence(0);

    setProblems(initialProblems);
    setActiveId(initialProblems[Math.floor(Math.random() * columns)].id);
    resetUfos({ props: initialProblems, columns });

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
      setColumns((prev) => Math.min(MAX_NUMBER_OF_COLUMNS, prev + 1));

      setLevel(calculatedLevel);

      setAttackInterval((prev) =>
        Math.max(500, prev - LEVEL_UP_ATTACK_INTERVAL_DECREMENT)
      );
      setUfoSpeed((prev) => prev + LEVEL_UP_UFO_SPEED_INCREMENT);

      const newProps = [...problems, createProblem(calculatedLevel)];

      setProblems(newProps);
      resetUfos({ props: newProps, columns: columns + 1 });
      playSound("levelup");
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 2000);
    }
  }, [score, level]);

  useEffect(() => {
    if (isFiring || isGameOver) return;
    const interval = setInterval(() => {
      setUfos((prev) => {
        const nextUfos = prev.map((u) => ({ ...u, y: u.y + ufoSpeed }));
        if (nextUfos.some((u) => u.y >= SHIP_Y)) {
          playSound("gameover");
          setIsGameOver(true);
        }
        return nextUfos;
      });
    }, attackInterval);
    return () => clearInterval(interval);
  }, [isFiring, isGameOver]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === " ") e.preventDefault();
      if (isFiring || isGameOver) return;
      if (e.key === "ArrowLeft") setShipCol((p) => Math.max(0, p - 1));
      if (e.key === "ArrowRight")
        setShipCol((p) => Math.min(columns - 1, p + 1));
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
        playSound("life");
      } else {
        playSound("correct");
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
          playSound("victory");
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
      playSound("wrong"); // <--- Trigger sound

      const newLives = lives - 1;
      setLives(newLives);

      if (newLives <= 0) {
        playSound("gameover");
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
      <Hud
        score={score}
        lives={lives}
        correctInSequence={correctInSequence}
        level={level}
        columns={columns}
        colWidth={colWidth}
        propLength={problems.length}
      />

      <div style={{ position: "relative", width: "100%" }}>
        <motion.svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          height="auto"
          animate={isShaking ? { x: [-5, 5, -5, 5, 0] } : {}}
          style={{
            background: "#16213e",
            borderRadius: "10px",
            border: "2px solid #0f3460",
            overflow: "hidden",
          }}
        >
          {/* stars moving downwards */}
          {stars.map((star, i) => (
            <circle
              key={`star-${i}`}
              cx={star.x}
              cy={star.y}
              r={star.r}
              fill="white"
              opacity={star.opacity}
            >
              <animate
                attributeName="cy"
                from={star.y}
                to={star.y + HEIGHT}
                dur={star.duration}
                repeatCount="indefinite"
              />
            </circle>
          ))}
          {!isGameOver &&
            Array.from({ length: columns }).map((_, i) => (
              <rect
                key={`z-${i}`}
                x={i * colWidth}
                y={0}
                width={colWidth}
                height={HEIGHT}
                fill="transparent"
                onPointerDown={() => handleInteraction(i, false)}
              />
            ))}

          <AnimatePresence>
            {ufos.map((ufo) => (
              <Ufo
                key={ufo.id}
                ufo={ufo}
                isShaking={wrongHitId === ufo.id}
                isGameOver={isGameOver}
                colWidth={colWidth}
                handleInteraction={handleInteraction}
              />
            ))}
          </AnimatePresence>

          {isFiring && (
            <motion.rect
              x={firedFromCol * colWidth + colWidth / 2 - 2}
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
            animate={{ x: shipCol * colWidth }}
            transition={{ type: "spring", bounce: 0.1 }}
          >
            <rect
              x={5}
              y={HEIGHT - 90}
              width={colWidth - 10}
              height="50"
              rx="8"
              fill="#4cc9f0"
              stroke="#fff"
              strokeWidth="2"
            />
            <rect
              x={colWidth / 2 - 8}
              y={HEIGHT - 105}
              width={16}
              height="20"
              rx="2"
              fill="#4cc9f0"
            />
            <text
              x={colWidth / 2}
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
                cx={colWidth / 2}
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
