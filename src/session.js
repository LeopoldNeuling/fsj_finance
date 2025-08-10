//libraries
import axios from "axios";
//const
import { __KEY } from "./App.jsx";

export let userID;

export async function activeVerified(newSalary) {
	if (!/Mobile/.test(navigator.userAgent)) return false;

	const machineID = localStorage.getItem("machineId");
	if (machineID === null) return false;

	const fetching = await fetch(
		"https://api.baserow.io/api/database/rows/table/375447/?user_field_names=true",
		{
			headers: {
				Authorization: __KEY,
			},
		}
	);
	const response = await fetching.json();
	for (let item of response.results) {
		if (item.ID !== machineID) continue;
		if (newSalary !== "skip")
			axios({
				method: "PATCH",
				url: `https://api.baserow.io/api/database/rows/table/375447/${item.id}/?user_field_names=true`,
				headers: {
					Authorization: __KEY,
					"Content-Type": "application/json",
				},
				data: {
					payment: newSalary,
				},
			});
		userID = {
			fixedCostTable: item.fixedCostID,
			varCostTable: item.varCostID,
			metaDataTable: item.metaDataID,
			expTable: item.expID,
			userIDNum: item.ID,
			deletedTable: item.deletedID,
			userName: item.name,
		};
		localStorage.setItem(
			"salary",
			newSalary !== "skip" ? newSalary : item.payment
		);
		localStorage.setItem("savingFrac", item.saving);
		localStorage.setItem("lang", item.language);
		localStorage.setItem("name", item.name);
		localStorage.setItem("userDataIdRowNum", item.id);
		return true;
	}
	return false;
}
