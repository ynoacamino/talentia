import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "@/app/App.tsx";
import { usePlayStore } from "@/ui/play/playStore.ts";
import { useTeacherStore } from "@/ui/teacher/teacherStore.ts";

declare global {
	interface Window {
		__useTeacherStore?: typeof useTeacherStore;
		__usePlayStore?: typeof usePlayStore;
	}
}

if (typeof window !== "undefined") {
	window.__useTeacherStore = useTeacherStore;
	window.__usePlayStore = usePlayStore;
}

const root = document.getElementById("root");
if (root) {
	createRoot(root).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
}
