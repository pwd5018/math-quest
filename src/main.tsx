import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./graphics.css";
import "./practice-tools.css";
import "./pip-3d.css";
import "./pip-play.css";
const CloudApp = lazy(() => import("./components/CloudApp"));
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {import.meta.env.VITE_APP_MODE === "firebase" ? (
      <Suspense
        fallback={
          <main className="setup-screen">
            <h1>Opening your adventure…</h1>
          </main>
        }
      >
        <CloudApp />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
