import { RelayEnvironmentProvider } from "react-relay";
import { RelayEnvironment } from "./RelayEnvironment";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <RelayEnvironmentProvider environment={RelayEnvironment}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </RelayEnvironmentProvider>
);


reportWebVitals();
