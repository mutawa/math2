import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const WIDTH = 400;
const HEIGHT = 600;

const SHIP_Y = HEIGHT - 50;
const COLUMNS = [80, 200, 320];

const HOP_INTERVAL = 2000;
const HOP_DISTANCE = 25;

const ROCKET_TRAVEL_TIME = 19900; // ms

export default function MathShooter() {
  const ufos = useRef(
    COLUMNS.map((x, i) => ({
      id: i,
      column: i,
      x,
      y: 60,
      value: i * 2 + 2,
      lastHop: 0,
    }))
  );

  const rocket = useRef({
    active: false,
    progress: 0,
    x: COLUMNS[0],
    y: SHIP_Y,
    startY: SHIP_Y,
    targetY: 0,
    targetUfoId: null,
  });

  const [columnIndex, setColumnIndex] = useState(0);
  const [, forceRender] = useState(0);

  // 🔁 GAME LOOP
  useEffect(() => {
    let last = performance.now();

    function loop(now) {
      const dt = now - last;
      last = now;

      const r = rocket.current;

      // 🚀 ROCKET FLIGHT (WORLD PAUSED)
      if (r.active) {
        r.progress += dt / ROCKET_TRAVEL_TIME;
        if (r.progress > 1) r.progress = 1;

        r.x = COLUMNS[columnIndex];
        r.y = r.startY + (r.targetY - r.startY) * r.progress;

        if (r.progress === 1) {
          const hitIndex = ufos.current.findIndex(
            (u) => u.id === r.targetUfoId
          );

          if (hitIndex !== -1) {
            spawnNewUfo(hitIndex);
          }

          r.active = false;
          r.targetUfoId = null;
          r.y = SHIP_Y;
        }
      }

      // 👽 UFO HOPPING (ONLY IF ROCKET NOT ACTIVE)
      if (!r.active) {
        ufos.current.forEach((ufo) => {
          if (now - ufo.lastHop > HOP_INTERVAL) {
            ufo.y += HOP_DISTANCE;
            ufo.lastHop = now;
          }
        });

        // Dock rocket to ship
        r.x = COLUMNS[columnIndex];
        r.y = SHIP_Y;
      }

      forceRender((v) => v + 1);
      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }, [columnIndex]);

  // ⌨️ INPUT
  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowLeft") {
        setColumnIndex((i) => Math.max(0, i - 1));
      }
      if (e.key === "ArrowRight") {
        setColumnIndex((i) => Math.min(COLUMNS.length - 1, i + 1));
      }
      if (e.key === " ") fire();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function fire() {
    const r = rocket.current;
    if (r.active) return;

    const target = ufos.current[columnIndex];

    console.log("Firing at UFO:", target.y);

    if (!target) return;

    r.active = true;
    r.progress = 0;
    r.startY = SHIP_Y;
    r.targetY = target.y;
    r.targetUfoId = target.id;
  }

  function spawnNewUfo(column) {
    ufos.current[column] = {
      id: Math.random(),
      column,
      x: COLUMNS[column],
      y: 40,
      value: Math.floor(Math.random() * 10),
      lastHop: performance.now(),
    };
  }

  return (
    <svg width={WIDTH} height={HEIGHT} style={{ border: "1px solid #444" }}>
      {/* UFOs */}
      {ufos.current.map((ufo) => (
        <motion.g
          key={ufo.id}
          animate={{ x: ufo.x, y: ufo.y }}
          transition={{ type: "spring", stiffness: 150 }}
        >
          <circle r={18} fill={ufo.column === columnIndex ? "green" : "gray"} />
          <text y={5} textAnchor="middle" fill="white">
            {ufo.value} {ufo.y}
          </text>
        </motion.g>
      ))}

      {/* Ship */}
      <g transform={`translate(${COLUMNS[columnIndex]},${SHIP_Y})`}>
        <polygon points="-15,12 15,12 0,-15" fill="cyan" />
      </g>

      {/* Rocket */}
      <motion.circle
        r={4}
        fill="red"
        animate={{ x: rocket.current.x, y: rocket.current.y }}
        transition={{ linear: true }}
      />
    </svg>
  );
}
