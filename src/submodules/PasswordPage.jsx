//react
import { useState, useRef, useEffect } from "react";
//@mui
import {
	Box,
	TextField,
	Button,
	FormControl,
	Select,
	MenuItem,
	InputLabel,
} from "@mui/material";
import { VpnKey } from "@mui/icons-material";
// funcs & vars
import { activeVerified } from "../session";
import { __errorMarkupDelay } from "../App.jsx";
//css
import "../App.css";

function PasswordPage({ getLastRefreshDate, getPrevSavings, activateApp }) {
	useEffect(() => {
		async function check() {
			/** usage of the activeVerified function ------------*
			 * @param newSalary: in case of new user logging in  *
			 * @param newSalary == 'skip': salary is untouched   *
			 * @returns status: whether apps is opened ----------*/

			if (await activeVerified("skip")) proceed(false);
		}
		check();
	}, []);

	function proceed(isFirst) {
		if (isFirst) location.reload();
		activateApp();
		getLastRefreshDate();
		getPrevSavings();
		// -> fetchFixedCosts()
		// -> fetchVarCosts()
	}

	const [wrongVerifyCodeState, setWrongVerifyCodeState] = useState(false);
	const [invalidSalary, setInvalidSalary] = useState(false);
	const passwordRef = useRef(null);
	const getSalaryRef = useRef(null);

	async function unlock() {
		const salary = getSalaryRef.current.value;
		const vCode = passwordRef.current.value;
		if (vCode === "") {
			setWrongVerifyCodeState(true);
			setTimeout(() => {
				setWrongVerifyCodeState(false);
			}, __errorMarkupDelay);
		}
		if (salary === "" && !accountType) {
			setInvalidSalary(true);
			setTimeout(() => {
				setInvalidSalary(false);
			}, __errorMarkupDelay);
		}
		if (vCode === "" || (salary === "" && !accountType)) return;

		localStorage.setItem("machineId", vCode);
		if (await activeVerified(accountType ? 0 : salary)) proceed(true);
		else setWrongVerifyCodeState(true);
	}

	const [disableSalaryInput, setDisableSalaryInput] = useState(false);
	const [accountType, setAccountType] = useState(false);
	const handleAccountTypeChange = (event) => {
		const newVal = event.target.value;
		setAccountType(newVal);
		setDisableSalaryInput(newVal);
	};

	return (
		<Box className="passwordBox">
			<form className="passwordForm">
				<TextField
					label="Verification Code"
					variant="outlined"
					type="number"
					inputRef={passwordRef}
					error={wrongVerifyCodeState}
					inputProps={{
						inputMode: "numeric",
					}}
					sx={{
						width: "100%",
						margin: "1vh 0",
					}}
				/>
				<FormControl fullWidth>
					<InputLabel>Account type</InputLabel>
					<Select
						labelId="demo-simple-select-label"
						id="demo-simple-select"
						value={accountType}
						label="Account type"
						onChange={handleAccountTypeChange}
					>
						<MenuItem value={false}>Monthly Account</MenuItem>
						<MenuItem value={true}>Saving account</MenuItem>
					</Select>
				</FormControl>
				<TextField
					label="Salary(€)"
					variant="outlined"
					type="Number"
					disabled={disableSalaryInput}
					error={invalidSalary}
					inputRef={getSalaryRef}
					inputProps={{
						inputMode: "decimal",
					}}
					pattern="[0-9.,]+"
					sx={{
						width: "100%",
						margin: "1vh 0",
					}}
				/>
				<Button variant="contained" onClick={() => unlock()} className="button">
					Add device <VpnKey />
				</Button>
			</form>
		</Box>
	);
}

export default PasswordPage;
