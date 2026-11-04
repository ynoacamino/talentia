/**
 * Client-Side Router para Talentia / SocraticGuild
 * Discrimina entre /play, /teacher y pantalla de inicio / selector en /.
 * Soporta query parameter ?s=XXXX para auto-completar el código de sesión.
 */
import { useEffect, useState, useSyncExternalStore } from "react";

export type AppRoute = "/play" | "/teacher" | "/" | "/past-sessions";

function getSnapshot(): string {
	if (typeof window === "undefined") return "/";
	return window.location.pathname + window.location.search;
}

function subscribe(callback: () => void) {
	window.addEventListener("popstate", callback);
	return () => window.removeEventListener("popstate", callback);
}

export function useAppRouter() {
	const currentUrl = useSyncExternalStore(subscribe, getSnapshot, () => "/");
	const [_url, setUrl] = useState(getSnapshot());

	useEffect(() => {
		setUrl(currentUrl);
	}, [currentUrl]);

	const pathname =
		typeof window !== "undefined" ? window.location.pathname : "/";
	const searchParams = new URLSearchParams(
		typeof window !== "undefined" ? window.location.search : "",
	);
	const sessionCodeParam = searchParams.get("s")?.toUpperCase() ?? null;

	const navigate = (to: string) => {
		if (typeof window !== "undefined") {
			window.history.pushState({}, "", to);
			window.dispatchEvent(new PopStateEvent("popstate"));
		}
	};

	let route: AppRoute = "/";
	if (pathname.startsWith("/play")) {
		route = "/play";
	} else if (pathname.startsWith("/teacher")) {
		route = "/teacher";
	} else if (pathname.startsWith("/past-sessions")) {
		route = "/past-sessions";
	}

	return {
		route,
		pathname,
		sessionCodeParam,
		searchParams,
		navigate,
	};
}
