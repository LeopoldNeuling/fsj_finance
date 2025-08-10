//libraries
import axios from "axios";
import moment from "moment";
//react
import { useEffect, useRef, useState, Fragment } from "react";
//@mui
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Typography,
	TextField,
	Button,
	Box,
	FormControl,
	InputLabel,
	Alert,
	FormControlLabel,
	Checkbox,
	Card,
	CardContent,
	Dialog,
	DialogActions,
	DialogTitle,
	Select,
	Slider,
	MenuItem,
	BottomNavigation,
	BottomNavigationAction,
	Paper,
	List,
	Switch,
	Autocomplete,
	DialogContent,
	Snackbar,
	IconButton,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import {
	Check,
	Close,
	ExpandMore,
	EuroSymbol,
	CalendarMonthOutlined,
	SavingsOutlined,
	LocalAtm,
	Percent,
	EventRepeat,
	AddTask,
	PlaylistAddCheckCircle,
	PriceCheck,
	QueryStats,
	Moving,
	PersonPin,
	ArrowOutward,
	HistoryToggleOff,
	GTranslate,
	AutoDelete,
	DeleteForever,
	Paid,
	Settings,
} from "@mui/icons-material";
import { PieChart, pieArcLabelClasses } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
//components
import ExpenseDisplay from "./submodules/ExpenseDisplay.jsx";
import LoadingAnimation from "./submodules/LoadingAnimation.jsx";
import ExpenseCard from "./submodules/ExpenseCard.jsx";
import PasswordPage from "./submodules/PasswordPage.jsx";
//css
import "./App.css";
//json translations
import translationIndex from "./translations/translationIndex.json";
//functions, const
import { userID } from "./session.js";
//const
export const __KEY = "Token codpkZ7FH0B2hgSYibndwpVU2JUNof11";
export const __palette = {
	textNormal: "text.secondary",
	save: "#FF004D",
	free: "#00FFAB",
	week13: ["#A64D79", "#6A1E55"],
	week24: ["#B5CFD8", "#435560"],
};
const __today = {
	DE: moment().format("DD/MM/YYYY"),
	US: moment().format("YYYY-MM-DD"),
	dayNum: moment().format("DD"),
};
export const __errorMarkupDelay = 3000;

// ***HELPER FUNCTIONS***
export function UStoDEDate(date) {
	return date.split("-").reverse().join("/");
}
export function DEtoUSDate(date) {
	return date.split("/").reverse().join("-");
}
export function translateFromJSON(key) {
	return translationIndex[0][key];
}
async function getUserIpAddress() {
	try {
		const response = await fetch("https://api.ipify.org?format=json");
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		const data = await response.json();
		return data.ip;
	} catch (error) {
		return false;
	}
}
async function getUserPositionByExternalAPI() {
	const userIP = await getUserIpAddress();
	const apiLocationLink = userIP
		? `https://api.ipgeolocation.io/ipgeo?apiKey=fafcc23e78c74e16a492704fc6929ae4&ip=${userIP}`
		: "https://api.ipgeolocation.io/ipgeo?apiKey=fafcc23e78c74e16a492704fc6929ae4";
	try {
		const fetching = await fetch(apiLocationLink, {
			method: "GET",
			redirect: "follow",
		});
		if (!fetching.ok) throw new Error("Error while using API");
		const response = await fetching.json();
		return [response.latitude, response.longitude];
	} catch (e) {
		return false;
	}
}
// -------------------------------------------------------------

function App() {
	// ***local storage***
	const inGerman = localStorage.getItem("lang") === "de";
	const user = localStorage.getItem("name");

	const rawTotal = localStorage.getItem("salary");
	const __fracSavedString = localStorage.getItem("savingFrac");
	const __fracSaved = parseFloat(__fracSavedString);

	// change languages
	function swapLangs(switchToGerman) {
		const newLang = switchToGerman ? "de" : "en";
		axios({
			method: "PATCH",
			url: `https://api.baserow.io/api/database/rows/table/375447/${localStorage.getItem(
				"userDataIdRowNum"
			)}/?user_field_names=true`,
			headers: {
				Authorization: __KEY,
				"Content-Type": "application/json",
			},
			data: {
				language: newLang,
			},
		}).then(() => {
			localStorage.setItem("lang", newLang);
			location.reload();
		});
	}

	// ***CHANGING SAVING FRACTION***
	const [sliderDisabled, setSliderDisabled] = useState(false);
	const [reloadDueToSlider, setReloadDueToSlider] = useState(false);
	const valueFrac = (value) => {
		return `${(value * 100).toFixed(0)}% = €${(value * rawTotal).toFixed(2)}`;
	};
	async function changeSavingFrac(newFrac) {
		if (newFrac == __fracSaved) return;
		setSliderDisabled(true);
		setReloadDueToSlider(true);

		const fetching = await fetch(
			"https://api.baserow.io/api/database/rows/table/375447/?user_field_names=true",
			{
				headers: {
					Authorization: __KEY,
				},
			}
		);
		const response = await fetching.json();
		for (let entry of response.results) {
			if (entry.ID == userID["userIDNum"]) {
				axios({
					method: "PATCH",
					url: `https://api.baserow.io/api/database/rows/table/375447/${entry.id}/?user_field_names=true`,
					headers: {
						Authorization: __KEY,
						"Content-Type": "application/json",
					},
					data: {
						saving: newFrac,
					},
				}).then(() => {
					localStorage.setItem("savingFrac", newFrac);
					location.reload();
				});
				break;
			} else {
				setSliderDisabled(false);
			}
		}
	}

	// ***HANDLE SELECT MENU***
	const scrollDownPage = (expansion) => {
		if (!expansion) return;
		setTimeout(() => {
			$("html, body").animate(
				{
					scrollTop: $(document).height(),
				},
				500
			);
		}, 100);
	};
	const [navigationValue, setNavigationValue] = useState("overview");
	function handleNavigationChange(_, value) {
		setNavigationValue(value);
		if (value === "varCost" || value === "deleted") scrollDownPage(true);
	}
	// ---------------------------------------------------------

	// ***FIXED COST SECTION***
	const [fixedCost, addFixed] = useState([]);
	const [fixedDisplay, setFixedDisplay] = useState(0);
	const fixedNameRef = useRef(null);
	const fixedAmountRef = useRef(null);
	const [numOfFixed, setNumOfFixed] = useState(0);
	let fixedTotal = 0;
	async function fetchFixedCosts() {
		const fetching = await fetch(
			`https://api.baserow.io/api/database/rows/table/${userID["fixedCostTable"]}/?user_field_names=true`,
			{
				headers: {
					Authorization: __KEY,
				},
			}
		);
		const response = await fetching.json();

		addFixed([]);
		setNumOfFixed(0);
		for (let cost of response.results) {
			fixedTotal += parseFloat(cost.Amount);
			addFixed((prev) => {
				return [...prev, [cost.Name, cost.Amount, cost.id]];
			});
			setNumOfFixed((prev) => {
				return prev + 1;
			});
		}
		setFixedDisplay(fixedTotal.toFixed(2));
		fetchVarCosts();
	}
	const [fixedNameInputError, setFixedNameInputError] = useState(false);
	const [fixedNameInputAmountError, setFixedNameInputAmountError] =
		useState(false);
	function createFixed() {
		const name = fixedNameRef.current.value;
		const amount = fixedAmountRef.current.value;

		if (name === "") {
			setFixedNameInputError(true);
			setTimeout(() => {
				setFixedNameInputError(false);
			}, __errorMarkupDelay);
		}
		if (amount === "") {
			setFixedNameInputAmountError(true);
			setTimeout(() => {
				setFixedNameInputAmountError(false);
			}, __errorMarkupDelay);
		}
		if (name === "" || amount === "") return;

		axios({
			method: "POST",
			url: `https://api.baserow.io/api/database/rows/table/${userID["fixedCostTable"]}/?user_field_names=true`,
			headers: {
				Authorization: __KEY,
				"Content-Type": "application/json",
			},
			data: {
				Name: name,
				Amount: parseFloat(amount),
			},
		}).then(() => {
			fixedNameRef.current.value = "";
			fixedAmountRef.current.value = "";
			getPrevSavings();
		});
	}
	// ---------------------------------------------------------

	// ***SAVINGS CONTROL***
	const [amountSaved, setSaved] = useState(0);
	let prevSavings = 0;
	async function getPrevSavings() {
		const fetching = await fetch(
			`https://api.baserow.io/api/database/rows/table/${userID["metaDataTable"]}/1/?user_field_names=true`,
			{
				headers: {
					Authorization: __KEY,
				},
			}
		);
		const response = await fetching.json();
		prevSavings += parseFloat(response.saved);
		fetchFixedCosts();
	}
	const [savingsDialogOpen, setSavingsDialogOpen] = useState(false);
	const handleSavingsDialogOpen = () => {
		setSavingsDialogOpen(true);
	};
	const handleSavingsDialogClose = () => {
		setSavingsDialogOpen(false);
	};
	function setNewPastSaved(value) {
		console.log("xyz");
		const formatValue = value.replace(",", ".");
		axios({
			method: "PATCH",
			url: `https://api.baserow.io/api/database/rows/table/${userID["metaDataTable"]}/1/?user_field_names=true`,
			headers: {
				Authorization: __KEY,
				"Content-Type": "application/json",
			},
			data: {
				saved: parseFloat(formatValue).toFixed(2),
			},
		}).then(() => {
			getPrevSavings();
		});
	}
	// ---------------------------------------------------------

	// ***VARIABLE COST SECTION***
	const varAmountRef = useRef(null);
	const bookOntoSaved = useRef(null);
	const monthlyAdditionsRef = useRef(null);
	const [varCost, addVar] = useState([]);
	const [varDisplay, setVarDisplay] = useState(0);
	const [weekEstimate, setWeekEstimate] = useState(0);
	const [amountAccessible, setAccessible] = useState(0);
	const [pastSavings, setPastSavings] = useState(0);
	const [monthlyAdditions, setMonthlyAdditions] = useState(0);
	const [savingsCheck, setCheck] = useState(false);
	const [emergencyCash, setEmergencyCash] = useState(0);
	const [displayMonthlySavings, setMonthlySavings] = useState(0);
	let diagramCategories = [];
	let tagCategories = [];
	const [nameDiagramData, setNameDiagram] = useState([]);
	const [tagDiagramData, setTagDiagram] = useState([]);
	let varTotal = 0;
	let varTotalIncludeOntoSavings = 0;
	const [varCostFull, setVarCostFull] = useState(0);
	const [savingsFixedVarExpenditure, setSavingsFixedVarExpenditure] =
		useState(0);
	const [commonStores, setCommonStores] = useState([]);
	let costByDaysInMonth = [];
	const [histogramXAxis, setHistogramXAxis] = useState([]);
	const [histogramData, setHistogramData] = useState([]);
	const [lastMonthDiagram, setLastMonthDiagram] = useState([]);
	const [lastMonthDiagramXAxis, setLastMonthDiagramXAxis] = useState([]);
	const [lastMonthAddition, setLastMonthAddition] = useState([]);
	const [lastMonthsSalary, setLastMonthsSalary] = useState([]);
	const [addTag, setAddTag] = useState([]);
	const [tagRef, setTagRef] = useState("");
	const [storeDiagramHeight, setStoreDiagramHeight] = useState(0);
	const handleTagChange = (event) => {
		setAddTag(event.target.value);
		setTagRef(event.target.value);
	};
	const [bonusInputError, setBonusInputError] = useState(false);
	const [addButtonBonus, setAddButtonBonus] = useState(false);
	const [recentAddition, setRecentAddition] = useState(0);
	const [undoSnackBarOpen, setUndoSnackBarOpen] = useState(false);
	const handleUndoSnackBarOpen = () => {
		setUndoSnackBarOpen(true);
	};
	const handleUndoSnackBarClose = () => {
		setUndoSnackBarOpen(false);
	};
	const checkIfBonusInputIsValid = (amount) => {
		if (amount !== "") return true;
		setBonusInputError(true);
		setTimeout(() => {
			setBonusInputError(false);
		}, 3000);
		return false;
	};
	function createMonthlyAddition() {
		const amount = monthlyAdditionsRef.current.value;
		if (!checkIfBonusInputIsValid(amount)) {
			setAddButtonBonus(true);
			setTimeout(() => {
				setAddButtonBonus(false);
			}, __errorMarkupDelay);
			return;
		}
		axios({
			method: "PATCH",
			url: `https://api.baserow.io/api/database/rows/table/${userID["metaDataTable"]}/1/?user_field_names=true`,
			headers: {
				Authorization: __KEY,
				"Content-Type": "application/json",
			},
			data: {
				addedMonthly: (parseFloat(monthlyAdditions) + parseFloat(amount)).toFixed(
					2
				),
			},
		}).then(() => {
			setRecentAddition(parseFloat(monthlyAdditions).toFixed(2));
			monthlyAdditionsRef.current.value = "";
			setBonusInputError(false);
			getPrevSavings();
			handleUndoSnackBarOpen();
		});
	}
	function resetBack() {
		if (recentAddition === 0) return;
		axios({
			method: "PATCH",
			url: `https://api.baserow.io/api/database/rows/table/${userID["metaDataTable"]}/1/?user_field_names=true`,
			headers: {
				Authorization: __KEY,
				"Content-Type": "application/json",
			},
			data: {
				addedMonthly: recentAddition,
			},
		}).then(() => {
			setRecentAddition(0);
			handleUndoSnackBarClose();
			getPrevSavings();
		});
	}
	async function displayDiagram(
		totalExpenditureThisMonth,
		totalAdditionsThisMonth,
		currentSalary
	) {
		//name diagram
		let nameTest = [];
		let autoCompleteTest = [];
		let formattedTestName = "";
		for (let i = 0; i < diagramCategories.length; i++) {
			if (diagramCategories[i][2] === 1) continue;
			formattedTestName =
				diagramCategories[i][0].charAt(0) +
				diagramCategories[i][0].slice(1).toLowerCase();
			nameTest.push({
				label: formattedTestName,
				value: diagramCategories[i][1].toFixed(2),
			});
			autoCompleteTest.push(formattedTestName);
		}
		setCommonStores(autoCompleteTest);
		const rowsNeeded = diagramCategories.length / 3;
		const rowHeight = 17;
		setStoreDiagramHeight((_) => {
			return 250 + Math.ceil(rowsNeeded) * rowHeight;
		});
		setNameDiagram(nameTest);

		// tag diagram
		let tagTest = [];
		for (let i = 0; i < tagCategories.length; i++) {
			tagTest.push({
				label: tagCategories[i][0],
				value: tagCategories[i][1].toFixed(2),
			});
		}
		setTagDiagram(tagTest);

		// date diagram
		let histogramXAxisTest = [];
		let histogramDataTest = [];
		for (let i = 0; i < costByDaysInMonth.length; i++) {
			histogramXAxisTest.push(
				`${costByDaysInMonth[i][0].split("-")[2]}.${
					costByDaysInMonth[i][0].split("-")[1]
				}`
			);
			histogramDataTest.push(parseFloat(costByDaysInMonth[i][1]).toFixed(2));
		}
		setHistogramXAxis(histogramXAxisTest);
		setHistogramData(histogramDataTest);

		// last month diagram
		let lastMonthData = [];
		let lastMonthDataXAxis = [];
		let lastMonthAdditionsData = [];
		let lastMonthSalaryData = [];

		const fetching = await fetch(
			`https://api.baserow.io/api/database/rows/table/${userID["expTable"]}/?user_field_names=true`,
			{
				headers: {
					Authorization: __KEY,
				},
			}
		);
		const response = await fetching.json();
		let langBuffer;
		let counterMonthsDownwards = response.count;
		for (let cost of response.results) {
			lastMonthData.push(cost.Expenditure);
			lastMonthAdditionsData.push(cost.additions);
			lastMonthSalaryData.push(cost.prevSalary);

			langBuffer = moment()
				.subtract(counterMonthsDownwards, "month")
				.format("MMMM");
			if (inGerman) langBuffer = translateFromJSON(langBuffer);
			lastMonthDataXAxis.push(langBuffer);
			counterMonthsDownwards--;
		}
		lastMonthData.push(
			parseFloat(String(totalExpenditureThisMonth).replace(",", ".")).toFixed(2)
		);
		lastMonthAdditionsData.push(totalAdditionsThisMonth.toFixed(2));
		lastMonthSalaryData.push(parseFloat(currentSalary).toFixed(2));

		langBuffer = moment()
			.subtract(counterMonthsDownwards, "month")
			.format("MMMM");
		if (inGerman) langBuffer = translateFromJSON(langBuffer);
		lastMonthDataXAxis.push(langBuffer);
		setLastMonthDiagram(lastMonthData);
		setLastMonthDiagramXAxis(lastMonthDataXAxis);
		setLastMonthAddition(lastMonthAdditionsData);
		setLastMonthsSalary(lastMonthSalaryData);
	}
	const [numOfVar, setNumOfVar] = useState(0);
	const [numOfVarInclBookedSavings, setNumOfVarInclBookedSavings] = useState(0);
	async function fetchVarCosts() {
		const fetching = await fetch(
			`https://api.baserow.io/api/database/rows/table/${userID["varCostTable"]}/?user_field_names=true`,
			{
				headers: {
					Authorization: __KEY,
				},
			}
		);
		const response = await fetching.json();

		const fetchingMonthlyAdditions = await fetch(
			`https://api.baserow.io/api/database/rows/table/${userID["metaDataTable"]}/1/?user_field_names=true`,
			{
				headers: {
					Authorization: __KEY,
				},
			}
		);
		const responseMonthlyAdditions = await fetchingMonthlyAdditions.json();
		const monthlyAdditions = parseFloat(responseMonthlyAdditions.addedMonthly);
		setMonthlyAdditions(monthlyAdditions.toFixed(2));

		let varOntoSavings = 0;
		let tagBuffer;
		let varCostBuffer = [];
		setNumOfVar(0);
		setNumOfVarInclBookedSavings(0);
		for (let cost of response.results) {
			if (cost.ontoSavings) {
				varOntoSavings += parseFloat(cost.Amount);
				varTotalIncludeOntoSavings += parseFloat(cost.Amount);
				setNumOfVarInclBookedSavings((prev) => {
					return prev + 1;
				});
			} else {
				varTotal += parseFloat(cost.Amount);
				setNumOfVar((prev) => {
					return prev + 1;
				});
			}

			tagBuffer = cost.tag;
			if (inGerman) tagBuffer = translateFromJSON(tagBuffer);

			varCostBuffer.push([
				cost.Name,
				UStoDEDate(cost.Date),
				cost.Amount,
				cost.id,
				cost.ontoSavings,
				tagBuffer,
				cost.position,
			]);

			// categories by name
			let nameCategoryFound = -1;
			for (let i = 0; i < diagramCategories.length; i++) {
				if (diagramCategories[i][0].toUpperCase() !== cost.Name.toUpperCase())
					continue;
				nameCategoryFound = i;
				break;
			}
			if (nameCategoryFound !== -1) {
				diagramCategories[nameCategoryFound][1] += parseFloat(cost.Amount);
				diagramCategories[nameCategoryFound][2] += 1;
			} else {
				diagramCategories.push([
					cost.Name.toUpperCase(),
					parseFloat(cost.Amount),
					1,
				]);
			}

			// categories by tag
			let tagCategoryFound = -1;
			for (let i = 0; i < tagCategories.length; i++) {
				if (tagCategories[i][0] !== tagBuffer) continue;
				tagCategoryFound = i;
				break;
			}
			if (tagCategoryFound !== -1) {
				tagCategories[tagCategoryFound][1] += parseFloat(cost.Amount);
			} else if (tagBuffer !== "") {
				tagCategories.push([tagBuffer, parseFloat(cost.Amount)]);
			}

			// categories by day
			let dayFound = -1;
			for (let i = 0; i < costByDaysInMonth.length; i++) {
				if (costByDaysInMonth[i][0] !== cost.Date) continue;
				dayFound = i;
				break;
			}
			if (dayFound !== -1) {
				costByDaysInMonth[dayFound][1] += parseFloat(cost.Amount);
			} else {
				costByDaysInMonth.push([cost.Date, parseFloat(cost.Amount)]);
			}
		}
		diagramCategories.sort((a, b) => b[1] - a[1]);
		tagCategories.sort((a, b) => b[1] - a[1]);
		addVar(varCostBuffer);

		let saved = rawTotal * __fracSaved + prevSavings - varOntoSavings;
		let free =
			rawTotal > 0
				? rawTotal * (1 - __fracSaved) - fixedTotal - varTotal + monthlyAdditions
				: monthlyAdditions - varTotal;

		let weekly =
			(rawTotal * (1 - __fracSaved) - fixedTotal + monthlyAdditions) / 4;
		let emergency = rawTotal - fixedTotal - varTotal;
		let monthlySavings = rawTotal * __fracSaved;
		setSavingsFixedVarExpenditure(varTotal + fixedTotal + varOntoSavings);
		saved = saved.toFixed(2);
		free = free.toFixed(2);
		weekly = weekly.toFixed(0);
		emergency = emergency.toFixed(2);
		monthlySavings = monthlySavings.toFixed(2);
		setVarDisplay(varTotal.toFixed(2));
		setVarCostFull(varTotalIncludeOntoSavings.toFixed(2));
		setAccessible(free);
		setSaved(saved);
		setPastSavings(prevSavings);
		setWeekEstimate(weekly);
		setEmergencyCash(emergency);
		setMonthlySavings(monthlySavings);

		displayDiagram(
			varTotal + fixedTotal + varOntoSavings,
			monthlyAdditions,
			rawTotal
		);

		fetchDeleted();
	}
	const [varNameInputError, setVarNameInputError] = useState(false);
	const [varNameInputAmountError, setVarNameInputAmountError] = useState(false);
	const [varNameValue, setVarNameValue] = useState("");
	const locationRef = useRef(true);
	const [locationEnabled, setLocationEnabled] = useState(true);
	async function createVar() {
		const name = varNameValue;
		const date = __today["US"];
		const amount = varAmountRef.current.value;
		// extract location
		let locationLink = "";
		const currentLocation = await getUserPositionByExternalAPI();
		locationLink = `https://www.google.com/maps?q=${currentLocation[0]},${currentLocation[1]}`;
		if (
			locationRef.current.checked === false ||
			currentLocation[0] === undefined ||
			currentLocation[1] === undefined
		)
			locationLink = "";
		//onto savings
		let ontoSavings = rawTotal > 0 ? bookOntoSaved.current.checked : false;
		if (amountAccessible - amount < 0)
			rawTotal > 0 ? (ontoSavings = true) : (ontoSavings = false);
		//tag
		let tag = tagRef;
		if (inGerman) tag = translateFromJSON(tag);

		if (name === "") {
			setVarNameInputError(true);
			setTimeout(() => {
				setVarNameInputError(false);
			}, __errorMarkupDelay);
		}
		if (amount === "") {
			setVarNameInputAmountError(true);
			setTimeout(() => {
				setVarNameInputAmountError(false);
			}, __errorMarkupDelay);
		}
		if (name === "" || amount === "") return;

		axios({
			method: "POST",
			url: `https://api.baserow.io/api/database/rows/table/${userID["varCostTable"]}/?user_field_names=true`,
			headers: {
				Authorization: __KEY,
				"Content-Type": "application/json",
			},
			data: {
				Name: name,
				Date: date,
				Amount: parseFloat(amount),
				ontoSavings: ontoSavings,
				tag: tag,
				position: locationLink,
			},
		}).then(() => {
			setVarNameValue("");
			varAmountRef.current.value = "";
			setAddTag("");
			setCheck(false);
			getPrevSavings();
		});
	}

	const [deleted, setDeleted] = useState([]);
	async function fetchDeleted() {
		const fetching = await fetch(
			`https://api.baserow.io/api/database/rows/table/${userID["deletedTable"]}/?user_field_names=true`,
			{
				headers: {
					Authorization: __KEY,
				},
			}
		);
		const response = await fetching.json();
		let tagBuffer;
		const buffer = [];
		for (let item of response.results) {
			tagBuffer = item.Tag;
			if (inGerman) tagBuffer = translateFromJSON(tagBuffer);

			buffer.push([
				item.Name,
				UStoDEDate(item.Date),
				item.ontoSavings,
				item.Amount,
				tagBuffer,
				item.id,
				item.position,
			]);
		}
		setDeleted(buffer);
	}
	async function deleteAllFinally() {
		const fetching = await fetch(
			`https://api.baserow.io/api/database/rows/table/${userID["deletedTable"]}/?user_field_names=true`,
			{
				headers: {
					Authorization: __KEY,
				},
			}
		);
		const response = await fetching.json();
		const idArray = [];
		for (let cost of response.results) {
			idArray.push(cost.id);
		}
		function deleteDeletedHistory(idOffset) {
			axios({
				method: "DELETE",
				url: `https://api.baserow.io/api/database/rows/table/${userID["deletedTable"]}/${idArray[idOffset]}/`,
				headers: {
					Authorization: __KEY,
				},
			}).then(() => {
				if (idOffset < idArray.length - 1) deleteDeletedHistory(idOffset + 1);
				else {
					getLastRefreshDate();
					getPrevSavings();
				}
			});
		}
		deleteDeletedHistory(0);
	}
	// ---------------------------------------------------------

	// ***RESET MECHANISM***
	const [lastRefreshDate, setRefresh] = useState(null);
	async function getLastRefreshDate() {
		const fetching = await fetch(
			`https://api.baserow.io/api/database/rows/table/${userID["metaDataTable"]}/1/?user_field_names=true`,
			{
				headers: {
					Authorization: __KEY,
				},
			}
		);
		const response = await fetching.json();
		setRefresh(UStoDEDate(response.lastRefreshed));
	}
	async function reset() {
		deleteAllFinally();

		// add prev cost
		axios({
			method: "POST",
			url: `https://api.baserow.io/api/database/rows/table/${userID["expTable"]}/?user_field_names=true`,
			headers: {
				Authorization: __KEY,
				"Content-Type": "application/json",
			},
			data: {
				Expenditure: savingsFixedVarExpenditure.toFixed(2),
				additions: monthlyAdditions,
				prevSalary: rawTotal,
			},
		});

		// upload savings, refresh date -> reset monthly added
		axios({
			method: "PATCH",
			url: `https://api.baserow.io/api/database/rows/table/${userID["metaDataTable"]}/1/?user_field_names=true`,
			headers: {
				Authorization: __KEY,
				"Content-Type": "application/json",
			},
			data: {
				saved: (parseFloat(amountSaved) + parseFloat(amountAccessible)).toFixed(2),
				lastRefreshed: __today["US"],
				addedMonthly: 0,
			},
		});

		// reset buying history
		const fetching = await fetch(
			`https://api.baserow.io/api/database/rows/table/${userID["varCostTable"]}/?user_field_names=true`,
			{
				headers: {
					Authorization: __KEY,
				},
			}
		);
		const response = await fetching.json();
		const idArray = [];
		for (let cost of response.results) {
			idArray.push(cost.id);
		}
		function deleteVarCostForReset(idOffset) {
			axios({
				method: "DELETE",
				url: `https://api.baserow.io/api/database/rows/table/${userID["varCostTable"]}/${idArray[idOffset]}/`,
				headers: {
					Authorization: __KEY,
				},
			}).then(() => {
				if (idOffset === idArray.length - 1) {
					getLastRefreshDate();
					getPrevSavings();
					setActive(true);
				} else deleteVarCostForReset(idOffset + 1);
			});
		}
		setActive(false);
		deleteVarCostForReset(0);
	}
	// ---------------------------------------------------------

	// ***PASSWORD OVERLAY***
	const [opened, setAccess] = useState(false);
	const activateApp = () => {
		setAccess(true);
	};
	// ---------------------------------------------------------

	// ***RESET ALERT HANDLE***
	const [openReloadDialogue, setOpenReloadDialogue] = useState(false);
	const toggleReloadDialogue = () => {
		setOpenReloadDialogue(true);
	};
	const handleCloseReloadDialogue = (status) => {
		if (status) reset();
		setOpenReloadDialogue(false);
	};
	// ---------------------------------------------------------

	// ***ACTIVATE APP WHEN LOADED***
	const [appActive, setActive] = useState(false);
	const [appCounter, addCounter] = useState(0);
	useEffect(() => {
		addCounter((prev) => {
			return prev + 1;
		});
		if (appCounter === 1) setActive(true);
	}, [varCost]);
	// ---------------------------------------------------------

	const [sentToDeleted, setSentToDeleted] = useState(false);
	const [sentToVar, setSentToVar] = useState(false);

	const inheritDeletedEvent = () => {
		setSentToDeleted(true);
		setTimeout(() => {
			setSentToDeleted(false);
		}, 1000);
	};
	const inheritVarCostEvent = () => {
		handleNavigationChange("", "varCost");
		setSentToVar(true);
		setTimeout(() => {
			setSentToVar(false);
		}, 1000);
	};

	return (
		<Paper elevation={0}>
			{!reloadDueToSlider ? (
				<>
					{opened ? (
						<>
							<Box
								style={{
									visibility: appActive ? "visible" : "hidden",
									margin: "0 1vw",
								}}
							>
								<List
									sx={{
										marginBottom: "10vh",
										"&>*": {
											marginLeft: "2vw",
										},
									}}
								>
									{/* overview page */}
									{navigationValue === "overview" ? (
										<Box
											sx={{
												"&>*": {
													marginBottom: "1vh",
												},
											}}
										>
											{/* reset month */}
											{rawTotal > 0 ? (
												<Fragment>
													<Alert
														severity="warning"
														action={
															<Button
																color="inherit"
																size="small"
																onClick={() => toggleReloadDialogue()}
															>
																{inGerman ? "Neu berechnen" : "Recalculate"}
															</Button>
														}
													>
														{inGerman ? "Letztes Update am" : "Last update on"}{" "}
														{lastRefreshDate}
													</Alert>
													<Dialog open={openReloadDialogue}>
														<DialogTitle>
															<Typography>
																{inGerman
																	? "Wirklich Monat neu berechnen?(Gehalt erhalten)"
																	: "Confirm new Month?"}
															</Typography>
														</DialogTitle>
														<DialogActions>
															<Button
																onClick={() => {
																	handleCloseReloadDialogue(false);
																}}
															>
																<Close />
															</Button>
															<Button
																onClick={() => {
																	handleCloseReloadDialogue(true);
																}}
															>
																<Check />
															</Button>
														</DialogActions>
													</Dialog>
												</Fragment>
											) : (
												<></>
											)}
											{/* logout */}
											<Alert
												severity="info"
												icon={<PersonPin />}
												action={
													<Button
														color="inherit"
														size="small"
														onClick={() => {
															localStorage.clear();
															location.reload();
														}}
													>
														{inGerman ? "Ausloggen" : "Log out"}
													</Button>
												}
											>
												{inGerman ? "Eingeloggt als" : "Logged in as"}{" "}
												<em>{user.toUpperCase()}</em>
											</Alert>
											{/* language swap */}
											<Alert
												severity="info"
												icon={<GTranslate />}
												action={
													<Switch
														defaultChecked={inGerman}
														onChange={(_, value) => swapLangs(value)}
													/>
												}
											>
												{inGerman ? "App auf Deutsch" : "App in english"}
											</Alert>

											{/* Salary Overview */}
											{rawTotal > 0 ? (
												<Card>
													<CardContent>
														<div>
															<Typography
																variant="subtitle1"
																color={__palette["textNormal"]}
																gutterBottom
															>
																{inGerman ? "Gehalt" : "Salary"} <Paid fontSize="small" />
															</Typography>
															<Typography sx={{ mb: 1.5 }} color={__palette["textNormal"]}>
																€{rawTotal}
															</Typography>
														</div>
													</CardContent>
												</Card>
											) : (
												<></>
											)}
											{/* Expenses Overview */}
											{rawTotal > 0 ? (
												<Card>
													<CardContent>
														<Box
															sx={{
																width: "100%",
																display: "flex",
																flexDirection: "row",
																justifyContent: "space-between",
																alignItems: "center",

																marginBottom: "4vh",
															}}
														>
															<Box>
																<Typography
																	variant="subtitle1"
																	color={__palette["save"]}
																	gutterBottom
																>
																	{inGerman ? "Gespart" : "Savings"}{" "}
																	<SavingsOutlined fontSize="small" />
																</Typography>
																<Typography sx={{ mb: 1.5 }} color={__palette["save"]}>
																	€{amountSaved}
																</Typography>
															</Box>
															<Box>
																<Alert
																	action={
																		<Fragment>
																			<Settings color="error" onClick={handleSavingsDialogOpen} />
																			<Dialog
																				open={savingsDialogOpen}
																				onClose={handleSavingsDialogClose}
																				fullWidth
																				PaperProps={{
																					component: "form",
																					onSubmit: (event) => {
																						event.preventDefault();
																						setNewPastSaved(event.target[0].value);
																						handleSavingsDialogClose();
																					},
																				}}
																			>
																				<DialogContent>
																					<TextField
																						autoFocus
																						required
																						label={
																							inGerman ? "Aktueller Kontostand" : "Current Balance"
																						}
																						type="decimal"
																						inputProps={{
																							inputMode: "decimal",
																						}}
																						fullWidth
																						variant="filled"
																					/>
																				</DialogContent>
																				<DialogActions>
																					<Button onClick={handleSavingsDialogClose}>
																						{inGerman ? "Abbrechen" : "Cancel"}
																					</Button>
																					<Button type="submit">
																						{inGerman ? "Ändern" : "Set"}
																					</Button>
																				</DialogActions>
																			</Dialog>
																		</Fragment>
																	}
																	severity="error"
																	icon={<CalendarMonthOutlined />}
																>
																	<Typography
																		color={__palette["textNormal"]}
																		variant="subtitle2"
																	>
																		{inGerman ? "Letzt. Monat" : "Last month"} €{pastSavings}
																	</Typography>
																</Alert>
																{userID["userName"] === "leo" ? (
																	<>
																		<Alert
																			severity="info"
																			icon={<Moving />}
																			sx={{ marginTop: "2vh" }}
																		>
																			Profit €{(amountSaved - 3956.65).toFixed(2)}
																		</Alert>
																	</>
																) : (
																	<></>
																)}
															</Box>
														</Box>
														<Card>
															<CardContent sx={{ borderLeft: "solid 1px grey" }}>
																<Slider
																	defaultValue={__fracSaved}
																	valueLabelFormat={valueFrac}
																	valueLabelDisplay="auto"
																	step={0.05}
																	marks={[
																		{
																			value: __fracSaved,
																			label: `${(__fracSaved * 100).toFixed(2)}%`,
																		},
																	]}
																	min={0}
																	max={1}
																	onChangeCommitted={(_, val) => changeSavingFrac(val)}
																	disabled={sliderDisabled}
																/>
																<Alert severity="warning" icon={<EventRepeat />}>
																	{inGerman ? "Mtl. gespart" : "Monthly saved"} €
																	{displayMonthlySavings}
																</Alert>
															</CardContent>
														</Card>
													</CardContent>
												</Card>
											) : (
												<></>
											)}
											{/* Open cash */}
											<Card>
												<CardContent>
													<Box
														sx={{
															width: "100%",
															display: "flex",
															flexDirection: "row",
															justifyContent: "space-between",
															alignItems: "center",

															marginBottom: "4vh",
														}}
													>
														<Box>
															<Typography
																variant="subtitle1"
																color={__palette["free"]}
																gutterBottom
															>
																{inGerman ? "Offen" : "Available"} <LocalAtm fontSize="small" />
															</Typography>
															<Typography sx={{ mb: 1.5 }} color={__palette["free"]}>
																€{amountAccessible}
															</Typography>
														</Box>
														<Box>
															<Alert
																severity="success"
																icon={<EuroSymbol />}
																sx={{
																	marginBottom: "1vh",
																}}
															>
																<Typography color={__palette["textNormal"]} variant="subtitle2">
																	Bonus €{monthlyAdditions}
																</Typography>
															</Alert>
															{rawTotal > 0 ? (
																<Alert severity="info" icon={<Percent />}>
																	<Typography
																		color={__palette["textNormal"]}
																		variant="subtitle2"
																	>
																		{inGerman ? "Wöchentl." : "Weekly"}~ €{weekEstimate}
																	</Typography>
																</Alert>
															) : (
																<></>
															)}
														</Box>
													</Box>
													{amountAccessible < 0 ? (
														<Alert severity="error" sx={{ width: "100%", marginTop: "0vh" }}>
															{inGerman
																? "Monatl. Ausgaben zu hoch!"
																: "Monthly expenses are too high!"}
															<br />
															{inGerman
																? "Offen vom mtl. Sparbudget"
																: "Left of the monthly savings budget"}
															{` €${emergencyCash}`}
														</Alert>
													) : (
														<></>
													)}
													{/* Bonus */}
													<Card>
														<CardContent sx={{ borderLeft: "solid 1px grey" }}>
															<Typography
																variant="subtitle1"
																color={__palette["textNormal"]}
																gutterBottom
															>
																Boni <PriceCheck />
															</Typography>
															<TextField
																label="Bonus(€)"
																variant="filled"
																type="Number"
																error={bonusInputError}
																inputRef={monthlyAdditionsRef}
																inputProps={{
																	inputMode: "decimal",
																}}
																sx={{
																	width: "100%",
																	margin: "1vh 0",
																}}
															/>

															<Button
																sx={{
																	marginBottom: "2vh",
																}}
																variant="contained"
																className="button"
																color={addButtonBonus ? "error" : "primary"}
																onClick={() => createMonthlyAddition()}
															>
																{inGerman ? "Hinzufügen" : "Add"}
																<AddTask />
															</Button>
														</CardContent>
													</Card>
												</CardContent>
												<Snackbar open={undoSnackBarOpen} onClose={handleUndoSnackBarClose}>
													<Alert
														onClose={handleUndoSnackBarClose}
														severity="success"
														variant="filled"
														sx={{ width: "100%" }}
														action={
															<Button
																sx={{ color: "black" }}
																variant="text"
																size="small"
																onClick={resetBack}
															>
																{inGerman ? "rückgängig" : "undo"}
															</Button>
														}
													>
														{inGerman ? "Bonus hinzugefügt" : "Bonus added"}
													</Alert>
												</Snackbar>
											</Card>

											{/* Diagram */}
											<Accordion
												disableGutters={true}
												onChange={(_, expanded) => scrollDownPage(expanded)}
											>
												<AccordionSummary expandIcon={<ExpandMore />}>
													<Typography
														variant="subtitle1"
														color={__palette["textNormal"]}
														gutterBottom
													>
														{inGerman ? "Ausgaben Überblick" : "Expenses overview"}{" "}
														<QueryStats />
													</Typography>
												</AccordionSummary>
												<AccordionDetails>
													<Box
														className="unresponsive"
														sx={{
															"&>*": {
																marginBottom: "1vh",
															},
														}}
													>
														{/* by stores */}
														<Card>
															<CardContent>
																<Typography
																	variant="subtitle2"
																	color={__palette["textNormal"]}
																	gutterBottom
																	sx={{
																		marginTop: "1vh",
																	}}
																>
																	{inGerman ? "Nach Läden" : "By store"}
																</Typography>
																<PieChart
																	sx={{
																		[`& .${pieArcLabelClasses.root}`]: {
																			fontWeight: "bold",
																		},
																	}}
																	series={[
																		{
																			data: nameDiagramData,
																			arcLabel: (item) => `€${item.value}`,
																			arcLabelMinAngle: 32.5,
																			//styling
																			innerRadius: 30,
																			outerRadius: 90,
																			paddingAngle: 5,
																			cornerRadius: 5,
																			startAngle: 0,
																			endAngle: nameDiagramData.length === 1 ? 359 : 360,
																			cx: 85,
																			cy: 100,
																			//highlighting
																			highlightScope: { faded: "global", highlighted: "item" },
																			faded: {
																				innerRadius: 30,
																				additionalRadius: -30,
																				color: "gray",
																			},
																		},
																	]}
																	slotProps={{
																		legend: {
																			direction: "row",
																			position: { vertical: "bottom", horizontal: "left" },
																		},
																	}}
																	margin={{ bottom: 60 }}
																	height={storeDiagramHeight}
																/>
															</CardContent>
														</Card>
														{/* by tags */}
														<Card>
															<CardContent>
																<Typography
																	variant="subtitle2"
																	color={__palette["textNormal"]}
																	gutterBottom
																	sx={{
																		marginTop: "1vh",
																	}}
																>
																	{inGerman ? "Nach Tags" : "By tag"}
																</Typography>
																<PieChart
																	sx={{
																		[`& .${pieArcLabelClasses.root}`]: {
																			fontWeight: "bold",
																		},
																	}}
																	series={[
																		{
																			data: tagDiagramData,
																			arcLabel: (item) => `€${item.value}`,
																			arcLabelMinAngle: 30,
																			//styling
																			innerRadius: 30,
																			outerRadius: 90,
																			paddingAngle: 5,
																			cornerRadius: 5,
																			startAngle: 0,
																			endAngle: tagDiagramData.length === 1 ? 359 : 360,
																			cx: 85,
																			cy: 100,
																			//highlighting
																			highlightScope: { faded: "global", highlighted: "item" },
																			faded: {
																				innerRadius: 30,
																				additionalRadius: -30,
																				color: "gray",
																			},
																		},
																	]}
																	slotProps={{
																		legend: {
																			direction: "row",
																			position: { vertical: "bottom", horizontal: "left" },
																		},
																	}}
																	margin={{ bottom: 60 }}
																	height={300}
																/>
															</CardContent>
														</Card>
														{/* by day */}
														<Card>
															<CardContent>
																<Typography
																	variant="subtitle2"
																	color={__palette["textNormal"]}
																	gutterBottom
																	sx={{
																		marginTop: "1vh",
																	}}
																>
																	{inGerman ? "Nach Tagen" : "By days"}
																</Typography>
																<BarChart
																	width={325}
																	height={210}
																	borderRadius={5}
																	series={[
																		{
																			data: histogramData,
																			label: inGerman ? "Ausgaben pro Tag" : "Expenses per day",
																		},
																	]}
																	xAxis={[{ data: histogramXAxis, scaleType: "band" }]}
																/>
															</CardContent>
														</Card>
														{/* by month */}
														<Card>
															<CardContent>
																<Typography
																	variant="subtitle2"
																	color={__palette["textNormal"]}
																	gutterBottom
																	sx={{
																		marginTop: "1vh",
																	}}
																>
																	{inGerman
																		? "Letzte Monate Überblick"
																		: "Overview of the last months"}
																</Typography>
																<BarChart
																	width={325}
																	height={400}
																	margin={{ top: 125, left: 75 }}
																	borderRadius={5}
																	layout="horizontal"
																	series={[
																		{
																			data: lastMonthDiagram,
																			label: inGerman
																				? "Ausgaben in den letzten Monaten"
																				: "Expenses from last months",
																			stack: "sub",
																		},
																		{
																			data: lastMonthAddition,
																			label: inGerman
																				? "Boni in den letzen Monaten"
																				: "Bonus of the last Months",
																			stack: "add",
																		},
																		{
																			data: lastMonthsSalary,
																			label: inGerman ? "Monatl. Gehalt" : "Monthly Salary",
																			stack: "add",
																		},
																	]}
																	yAxis={[{ data: lastMonthDiagramXAxis, scaleType: "band" }]}
																/>
															</CardContent>
														</Card>
													</Box>
												</AccordionDetails>
											</Accordion>
										</Box>
									) : (
										<></>
									)}
									{/* variable costs page */}
									{navigationValue === "varCost" ? (
										<Box>
											{varCost.map((cost, iter) => (
												<ExpenseDisplay
													Name={cost[0]}
													Date={cost[1]}
													Amount={cost[2]}
													ID={cost[3]}
													forSavings={cost[4]}
													tableURL={`https://api.baserow.io/api/database/rows/table/${userID["varCostTable"]}`}
													Tag={cost[5]}
													key={iter}
													expenseLocation={cost[6]}
													locatedAt={
														varCost.length === 1
															? "edge"
															: iter === 0
															? "first"
															: iter === varCost.length - 1
															? "last"
															: "unset"
													}
													refresh={getPrevSavings}
													deleteEvent={inheritDeletedEvent}
												/>
											))}
											<ExpenseCard
												inGerman={inGerman}
												value={varDisplay}
												extraValue={varCostFull}
												FirstNum={numOfVar}
												SecondNum={numOfVarInclBookedSavings}
											/>
											<Box
												sx={{
													width: "100%",
													marginTop: "5vh",

													"&>*": {
														width: "100%",
													},
												}}
											>
												<Autocomplete
													disablePortal
													options={commonStores}
													freeSolo={true}
													inputValue={varNameValue}
													onInputChange={(_, value, __) => {
														setVarNameValue(value);
													}}
													renderInput={(params) => (
														<TextField
															{...params}
															label="Name"
															variant="filled"
															error={varNameInputError}
														/>
													)}
												/>
												<TextField
													label={inGerman ? "Betrag(€)" : "Amount(€)"}
													variant="filled"
													error={varNameInputAmountError}
													inputRef={varAmountRef}
													type="number"
													inputProps={{
														inputMode: "decimal",
													}}
												/>
												<FormControl variant="filled">
													<InputLabel id="demo-simple-select-filled-label">Tag</InputLabel>
													<Select
														labelId="demo-simple-select-filled-label"
														id="demo-simple-select-filled"
														value={addTag}
														onChange={handleTagChange}
													>
														<MenuItem value="">
															<em>{inGerman ? "Kein Tag" : "No tag"}</em>
														</MenuItem>
														<MenuItem value={inGerman ? "Ferien" : "Holidays"}>
															{inGerman ? "Ferien" : "Holidays"}
														</MenuItem>
														<MenuItem value={"Transport"}>Transport</MenuItem>
														<MenuItem value={inGerman ? "Essen" : "Food"}>
															{inGerman ? "Essen" : "Food"}
														</MenuItem>
														<MenuItem value={inGerman ? "Einkäufe" : "Shopping"}>
															{inGerman ? "Einkäufe" : "Shopping"}
														</MenuItem>
														<MenuItem value={inGerman ? "Zigaretten" : "Cigarettes"}>
															{inGerman ? "Zigaretten" : "Cigarettes"}
														</MenuItem>
														<MenuItem value={"Energy Drinks"}>Energy Drinks</MenuItem>
													</Select>
												</FormControl>
												{rawTotal > 0 ? (
													<Typography color={__palette["textNormal"]}>
														<FormControlLabel
															control={
																<Checkbox
																	inputRef={bookOntoSaved}
																	checked={savingsCheck}
																	onChange={() => {
																		setCheck(!savingsCheck);
																	}}
																/>
															}
															label={
																inGerman
																	? "Auf das Sparbudget schreiben"
																	: "Book onto savings budget"
															}
														/>
													</Typography>
												) : (
													<></>
												)}
												<Typography color={__palette["textNormal"]}>
													<FormControlLabel
														control={
															<Checkbox
																inputRef={locationRef}
																checked={locationEnabled}
																onChange={() => {
																	setLocationEnabled(!locationEnabled);
																}}
															/>
														}
														label={inGerman ? "Standort speichern" : "Save location"}
													/>
												</Typography>
												<Button
													variant="contained"
													className="button"
													color={"primary"}
													onClick={() => createVar()}
												>
													{inGerman ? "Hinzufügen" : "Add"}
													<PlaylistAddCheckCircle />
												</Button>
											</Box>
										</Box>
									) : (
										<></>
									)}
									{/* fixed costs page */}
									{navigationValue === "fixedCost" ? (
										<Box>
											{fixedCost.map((cost, iter) => (
												<ExpenseDisplay
													Name={cost[0]}
													Date={inGerman ? "Mtl." : "Monthly"}
													Amount={cost[1]}
													ID={cost[2]}
													forSavings={false}
													tableURL={`https://api.baserow.io/api/database/rows/table/${userID["fixedCostTable"]}`}
													key={iter}
													locatedAt={
														fixedCost.length === 1
															? "edge"
															: iter === 0
															? "first"
															: iter === fixedCost.length - 1
															? "last"
															: "unset"
													}
													refresh={getPrevSavings}
													deleteEvent={inheritDeletedEvent}
												/>
											))}
											<ExpenseCard
												inGerman={inGerman}
												value={fixedDisplay}
												FirstNum={numOfFixed}
											/>
											<Box
												sx={{
													width: "100%",
													marginTop: "5vh",

													"&>*": {
														width: "100%",
													},
												}}
											>
												<TextField
													label="Name"
													variant="filled"
													error={fixedNameInputError}
													inputRef={fixedNameRef}
												/>
												<TextField
													label={inGerman ? "Betrag(€)" : "Amount(€)"}
													variant="filled"
													error={fixedNameInputAmountError}
													inputRef={fixedAmountRef}
													type="number"
													inputProps={{
														inputMode: "decimal",
													}}
												/>
												<Button
													variant="contained"
													className="button"
													color={"primary"}
													onClick={() => createFixed()}
													sx={{
														marginTop: "2.5vh",
													}}
												>
													{inGerman ? "Hinzufügen" : "Add"}
													<PlaylistAddCheckCircle />
												</Button>
											</Box>
										</Box>
									) : (
										<></>
									)}
									{navigationValue === "deleted" ? (
										<Box>
											{deleted.map((cost, iter) => (
												<ExpenseDisplay
													Name={cost[0]}
													Date={cost[1]}
													Amount={cost[3]}
													ID={cost[5]}
													forSavings={cost[2]}
													tableURL={`https://api.baserow.io/api/database/rows/table/${userID["deletedTable"]}`}
													Tag={cost[4]}
													expenseLocation={cost[6]}
													key={iter}
													locatedAt={
														deleted.length === 1
															? "edge"
															: iter === 0
															? "first"
															: iter === deleted.length - 1
															? "last"
															: "unset"
													}
													deletedItem={true}
													refresh={getPrevSavings}
													addVarEvent={inheritVarCostEvent}
												/>
											))}
											<Button
												endIcon={<DeleteForever />}
												color="error"
												sx={{ marginTop: "2vh" }}
												variant="contained"
												onClick={deleteAllFinally}
												fullWidth
												disabled={deleted.length === 0}
											>
												{inGerman ? "Unwiederrufbar löschen" : "Delete all"}
											</Button>
										</Box>
									) : (
										<></>
									)}
								</List>

								{/* menu */}
								<Paper
									sx={{
										position: "fixed",
										bottom: 0,
										left: 0,
										right: 0,
										zIndex: 10,
									}}
									elevation={5}
								>
									{rawTotal > 0 ? (
										<BottomNavigation
											value={navigationValue}
											onChange={handleNavigationChange}
											sx={{
												height: "10vh",
											}}
										>
											<BottomNavigationAction
												label={inGerman ? "Überblick" : "Overview"}
												value="overview"
												icon={<BarChartIcon />}
											/>

											<BottomNavigationAction
												label="Abonnements"
												value="fixedCost"
												icon={<HistoryToggleOff />}
											/>
											<BottomNavigationAction
												label={inGerman ? "Ausgaben" : "Expenses"}
												value="varCost"
												icon={<ArrowOutward color={sentToVar ? "error" : "text.main"} />}
											/>
											<BottomNavigationAction
												label={inGerman ? "Gelöscht" : "Deleted"}
												value="deleted"
												icon={<AutoDelete color={sentToDeleted ? "error" : "text.main"} />}
											/>
										</BottomNavigation>
									) : (
										<BottomNavigation
											value={navigationValue}
											onChange={handleNavigationChange}
											sx={{
												height: "10vh",
											}}
										>
											<BottomNavigationAction
												label={inGerman ? "Überblick" : "Overview"}
												value="overview"
												icon={<BarChartIcon />}
											/>
											<BottomNavigationAction
												label={inGerman ? "Ausgaben" : "Expenses"}
												value="varCost"
												icon={<ArrowOutward color={sentToVar ? "error" : "text.main"} />}
											/>
											<BottomNavigationAction
												label={inGerman ? "Gelöscht" : "Deleted"}
												value="deleted"
												icon={<AutoDelete color={sentToDeleted ? "error" : "text.main"} />}
											/>
										</BottomNavigation>
									)}
								</Paper>
							</Box>
							{/* Loading animation */}
							{!appActive ? <LoadingAnimation /> : <></>}
						</>
					) : (
						// password page
						<PasswordPage
							getLastRefreshDate={getLastRefreshDate}
							getPrevSavings={getPrevSavings}
							activateApp={activateApp}
						/>
					)}
				</>
			) : (
				<LoadingAnimation />
			)}
		</Paper>
	);
}

export default App;
