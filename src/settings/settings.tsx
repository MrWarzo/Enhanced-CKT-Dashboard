import React from "react";
import ReactDOM from "react-dom/client";

const rootSettings = document.createElement("div");
rootSettings.className = "container";
document.body.appendChild(rootSettings);

const rootDiv = ReactDOM.createRoot(rootSettings);
rootDiv.render(
  <React.StrictMode>
    <div className="App">CC ici c'est les settings</div>
  </React.StrictMode>
);
