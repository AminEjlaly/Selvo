// webScrollFix.js
import { Platform } from "react-native";

if (Platform.OS === "web" && typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    html, body, #root {
      height: 100%;
      overflow: auto !important;
    }
  `;
  document.head.appendChild(style);
}