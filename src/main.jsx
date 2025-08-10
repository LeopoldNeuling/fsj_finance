//react
import { createRoot } from "react-dom/client";
//@mui
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
//components
import App from "./App.jsx";

export let colMode =
	window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches
		? 0
		: 1;

createRoot(document.getElementById("reactEntry")).render(
	<ThemeProvider
		theme={createTheme({
			palette: {
				mode: colMode === 0 ? "light" : "dark",
			},
		})}
	>
		<CssBaseline />
		<App />
	</ThemeProvider>
);
