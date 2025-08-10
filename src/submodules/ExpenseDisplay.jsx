//libraries
import axios from "axios";
//react
import { useEffect, useState, Fragment } from "react";
//@mui
import {
	Card,
	CardContent,
	Typography,
	Alert,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	FormControlLabel,
	Checkbox,
	Box,
	IconButton,
} from "@mui/material";
import { DeleteForever, EditNote, Unarchive, Link } from "@mui/icons-material";
//css
import "../App.css";

import LoadingAnimation from "./LoadingAnimation.jsx";

//const
import { __KEY, __palette, translateFromJSON, DEtoUSDate } from "../App.jsx";
import { userID } from "../session.js";
import { colMode } from "../main.jsx";

function ExpenseDisplay({
	Name,
	Date,
	Amount,
	ID,
	tableURL,
	forSavings,
	refresh,
	Tag,
	deletedItem,
	addVarEvent,
	deleteEvent,
	locatedAt,
	expenseLocation,
}) {
	// ***lang settings***
	const inGerman = localStorage.getItem("lang") === "de";
	const [cardBG, setBG] = useState(null);
	useEffect(() => {
		let dayNum = Date.split("/")[0];
		if (dayNum === "Mtl." || dayNum === "Monthly") {
			setBG("grey");
			return;
		}
		if (1 <= dayNum && dayNum < 7) setBG(__palette["week13"][colMode]);
		else if (7 <= dayNum && dayNum < 14) setBG(__palette["week24"][colMode]);
		else if (14 <= dayNum && dayNum < 21) setBG(__palette["week13"][colMode]);
		else setBG(__palette["week24"][colMode]);
	}, []);
	function deleteSelf(firstDelete) {
		if (firstDelete) {
			axios({
				method: "POST",
				url: `https://api.baserow.io/api/database/rows/table/${userID["deletedTable"]}/?user_field_names=true`,
				headers: {
					Authorization: __KEY,
					"Content-Type": "application/json",
				},
				data: {
					Name: Name,
					Date: DEtoUSDate(Date),
					Amount: Amount,
					ontoSavings: forSavings,
					Tag: inGerman ? translateFromJSON(Tag) : Tag,
					position: expenseLocation,
				},
			});
			deleteEvent();
		}

		axios({
			method: "DELETE",
			url: `${tableURL}/${ID}/`,
			headers: {
				Authorization: __KEY,
			},
		}).then(() => {
			refresh();
		});
	}
	function updateSelf(name, cost, toSavings, newTag) {
		let formattedCost = cost.replace(",", ".");
		let tag = newTag;
		if (inGerman) tag = translateFromJSON(tag);
		const data =
			Date === "Mtl."
				? { Name: name, Amount: formattedCost }
				: {
						Name: name,
						Amount: formattedCost,
						ontoSavings: toSavings,
						tag: tag,
				  };

		axios({
			method: "PATCH",
			url: `${tableURL}/${ID}/?user_field_names=true`,
			headers: {
				Authorization: __KEY,
				"Content-Type": "application/json",
			},
			data: data,
		}).then(() => {
			refresh();
		});
	}
	function revokeDeleted() {
		axios({
			method: "POST",
			url: `https://api.baserow.io/api/database/rows/table/${userID["varCostTable"]}/?user_field_names=true`,
			headers: {
				Authorization: __KEY,
				"Content-Type": "application/json",
			},
			data: {
				Name: Name,
				Date: DEtoUSDate(Date),
				Amount: Amount,
				ontoSavings: forSavings,
				tag: inGerman ? translateFromJSON(Tag) : Tag,
				position: expenseLocation,
			},
		}).then(() => {
			deleteSelf();
			addVarEvent();
		});
	}

	const [settingsOpen, settingsSetOpenState] = useState(false);
	const handleSettingsOpen = () => {
		settingsSetOpenState(true);
	};
	const handleSettingsClose = () => {
		settingsSetOpenState(false);
	};

	const [tagRef, setTagRef] = useState(Tag);
	const handleTagChange = (event) => {
		setTagRef(event.target.value);
	};

	// settings
	const [settingsShown, setSettingsShown] = useState(false);
	const toggleSettings = () => {
		setSettingsShown(true);
		setTimeout(() => {
			setSettingsShown(false);
		}, 3000);
	};

	return (
		<Card
			sx={{
				display: "grid",
				gridTemplateColumns: "repeat(5, 1fr)",
				gridTemplateRows: "1fr 1fr",
				gridTemplateAreas: `"main main main main main edit" 
									"main main main main main delete"`,
				width: "100%",
				borderLeft: `5px solid ${cardBG}`,
			}}
			onClick={toggleSettings}
		>
			<CardContent
				className="costSectionContainer"
				sx={{
					gridArea: "main",
				}}
			>
				{/* settings alert */}
				<Fragment>
					<Dialog
						open={settingsOpen}
						onClose={handleSettingsClose}
						PaperProps={{
							component: "form",
							onSubmit: async (event) => {
								event.preventDefault();
								const name = event.target[0].value;
								const cost = event.target[1].value;
								const newTag = event.target[2].value;
								const toSavings = event.target[3].checked;
								if (name === "" || cost === "") return;

								updateSelf(name, cost, toSavings, newTag);
								handleSettingsClose();
							},
							onReset: (event) => {
								event.preventDefault();
								handleSettingsClose();
							},
						}}
					>
						<DialogTitle>{inGerman ? "Einstellungen" : "Settings"}</DialogTitle>
						<DialogContent>
							<TextField
								margin="dense"
								label="Name"
								type="text"
								fullWidth
								variant="filled"
								defaultValue={Name}
							/>
							<TextField
								margin="dense"
								label={inGerman ? "Betrag (€)" : "Amount (€)"}
								type="text"
								inputProps={{
									inputMode: "decimal",
								}}
								pattern="[0-9.,]+"
								fullWidth
								variant="filled"
								defaultValue={Amount}
							/>
							{Date !== "Mtl." && Date !== "Monthly" ? (
								<>
									<FormControl
										variant="filled"
										sx={{
											width: "100%",
										}}
									>
										<InputLabel id="demo-simple-select-filled-label">Tag</InputLabel>
										<Select
											labelId="demo-simple-select-filled-label"
											id="demo-simple-select-filled"
											value={tagRef}
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
									<Typography color={__palette["textNormal"]}>
										<FormControlLabel
											control={<Checkbox defaultChecked={forSavings} />}
											label={inGerman ? "Auf Sparbudget" : "Onto savings budget"}
										/>
									</Typography>
								</>
							) : (
								<></>
							)}
						</DialogContent>
						<DialogActions>
							<Button type="reset">{inGerman ? "Abbrechen" : "Cancel"}</Button>
							<Button type="submit">{inGerman ? "Ändern" : "Change"}</Button>
						</DialogActions>
					</Dialog>
				</Fragment>
				{/* body */}
				<Box
					className="expenseDisplayContainer"
					sx={{
						width: "100%",
						display: "flex",
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "stretch",
						"&>div": {
							height: "10vh",
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							alignItems: "space-between",
						},
						"&::before": {
							backgroundColor:
								locatedAt === "first" || locatedAt === "edge" ? "transparent" : cardBG,
							outline: `dashed ${
								locatedAt === "first" || locatedAt === "edge" ? "transparent" : cardBG
							}`,
							borderColor:
								locatedAt === "first" || locatedAt === "edge"
									? "transparent"
									: colMode === 0
									? "white"
									: "#121212",
						},
						"&::after": {
							border: `1px dashed ${
								locatedAt === "first" || locatedAt === "edge" ? "transparent" : cardBG
							}`,
						},
					}}
				>
					<Box>
						<Typography variant="h6" color={__palette["textNormal"]}>
							{Name}
						</Typography>
						<Typography variant="subtitle1" color={__palette["textNormal"]}>
							<em>{Date}</em>
						</Typography>
					</Box>
					<Box sx={{ width: "20vw", textAlign: "center" }}>
						<Typography color="primary">{`€${Amount}`}</Typography>
						{Date !== "Mtl." && Date !== "Monthly" && Tag !== "" ? (
							<Chip label={Tag} />
						) : (
							<></>
						)}
					</Box>
				</Box>
				{Date !== "Mtl." && Date !== "Monthly" ? (
					<Box
						display={"flex"}
						flexDirection={"row"}
						justifyContent={"space-between"}
					>
						{expenseLocation !== "" ? (
							<Button
								variant="text"
								endIcon={<Link />}
								onClick={() => {
									open(expenseLocation, "_blank");
								}}
							>
								{inGerman
									? "Ort in Google Maps öffnen"
									: "Open location in Google Maps"}
							</Button>
						) : (
							<Button variant="text" endIcon={<Link />} disabled={true}>
								{inGerman ? "Ort nicht verfügbar" : "Location not available"}
							</Button>
						)}
						<Box></Box>
					</Box>
				) : (
					<></>
				)}
				{/* alert */}
				{forSavings ? (
					<Alert severity="info">
						{inGerman ? "belastet das Sparbudget" : "booked onto savings budget"}
					</Alert>
				) : (
					<></>
				)}
			</CardContent>
			{deletedItem ? (
				<IconButton
					variant="contained"
					color="info"
					sx={{
						gridArea: "edit",
					}}
					onClick={revokeDeleted}
				>
					<Unarchive />
				</IconButton>
			) : (
				<>
					{settingsShown ? (
						<>
							<IconButton
								variant="contained"
								color="warning"
								sx={{
									gridArea: "edit",
								}}
								onClick={handleSettingsOpen}
							>
								<EditNote />
							</IconButton>
							<IconButton
								variant="contained"
								color="error"
								sx={{
									gridArea: "delete",
								}}
								onClick={() =>
									deleteSelf(Date === "Mtl." || Date === "Monthly" ? false : true)
								}
							>
								<DeleteForever />
							</IconButton>
						</>
					) : (
						<></>
					)}
				</>
			)}
		</Card>
	);
}

export default ExpenseDisplay;
