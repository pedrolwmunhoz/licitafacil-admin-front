import { createRoot } from "react-dom/client";
import "./styles/index.css";
import AdminApp from "./apps/AdminApp";

createRoot(document.getElementById("root")!).render(<AdminApp />);
