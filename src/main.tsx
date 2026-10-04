import { createRoot } from "react-dom/client";
import "./styles/app.css";
import AdminApp from "./apps/AdminApp";
import { obterDeviceId } from "./lib/device-id";

obterDeviceId();

createRoot(document.getElementById("root")!).render(<AdminApp />);
