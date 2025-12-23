import { useState } from "react";

import "./App.css";
import MathInvaders from "./MathInvaders.jsx";

function App() {
  return (
    <>
      <MathInvaders />
      <br />
      <br />
      <br />
      <br />
      <div dir="rtl">
        &nbsp;;&nbsp;هذا المشروع مفتوح المصدر! يمكنك الاطلاع على الشفرة المصدرية
        أو المساهمة فيه على{" "}
        <a
          href="https://github.com/mutawa/math2.git"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </div>
      .
    </>
  );
}

export default App;
