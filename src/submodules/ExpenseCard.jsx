import { Box, Badge } from "@mui/material";
import { ContentCopy } from "@mui/icons-material";
import { __palette } from "../App";

function ExpenseCard({ value, inGerman, extraValue, FirstNum, SecondNum }) {
	return (
		<Box
			sx={{
				bgcolor: "background.paper",
				boxShadow: 1,
				borderRadius: 2,
				p: 2,
				minWidth: 300,
				margin: "2vh 0",

				display: "flex",
				flexDirection: "row",
				justifyContent: "space-between",
				alignItems: "center",
				width: "100%",
			}}
		>
			<div>
				<Box
					sx={{
						color: "text.secondary",
					}}
				>
					{inGerman ? "Gesamt" : "Total"}{" "}
					<Badge badgeContent={FirstNum} color="secondary">
						<ContentCopy />
					</Badge>
				</Box>
				<Box color={"text.primary"} sx={{ fontSize: 34, fontWeight: "medium" }}>
					€{value}
				</Box>
			</div>
			{extraValue ? (
				<div style={{ textAlign: "right" }}>
					<Box
						sx={{
							color: "text.secondary",
						}}
					>
						{inGerman ? "Sparkontoausgaben" : "saving budget expenses"}{" "}
						<Badge badgeContent={SecondNum} color="secondary">
							<ContentCopy />
						</Badge>
					</Box>
					<Box color={"text.primary"} sx={{ fontSize: 34, fontWeight: "medium" }}>
						€{extraValue}
					</Box>
				</div>
			) : (
				<></>
			)}
		</Box>
	);
}

export default ExpenseCard;
