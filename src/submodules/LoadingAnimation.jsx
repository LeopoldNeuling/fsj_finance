import "../App.css";
import { Fragment } from "react";
import { CircularProgress } from "@mui/material";

function LoadingAnimation() {
	return (
		<div className="loadBufferScreen">
			<Fragment>
				<svg width={0} height={0}>
					<defs>
						<linearGradient id="loaderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
							<stop offset="0%" stopColor="#e01cd5" />
							<stop offset="100%" stopColor="#1CB5E0" />
						</linearGradient>
					</defs>
				</svg>
				<CircularProgress
					sx={{
						"svg circle": {
							stroke: "url(#loaderGradient)",
						},
					}}
				/>
			</Fragment>
		</div>
	);
}

export default LoadingAnimation;
