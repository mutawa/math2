import { useState } from "react";
import MathShooter from "./MathShooter.jsx";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import MathInvaders from "./MathInvaders.jsx";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <MathInvaders />
    </>
  );
}

export default App;
