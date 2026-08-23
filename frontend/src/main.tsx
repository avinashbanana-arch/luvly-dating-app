
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { AppErrorBoundary } from "./app/AppErrorBoundary.tsx";
  import "./styles/index.css";

  window.addEventListener("error", (event) => {
    console.error("[Luvly] Unhandled window error", event.error || event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    console.error("[Luvly] Unhandled promise rejection", event.reason);
  });

  createRoot(document.getElementById("root")!).render(
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
  
