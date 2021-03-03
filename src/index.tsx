import { ChangeEvent, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import * as esbuild from "esbuild-wasm";
import { unpkgPathPlugin } from "./plugins/unpkg-path-plugin";
import { fetchPlugin } from "./plugins/fetch-plugin";

const App = () => {
	const [input, setInput] = useState("");
	const [code, setCode] = useState("");

	const esBuildServiceRef = useRef<esbuild.Service>();

	const startService = async () => {
		esBuildServiceRef.current = await esbuild.startService({
			worker: true,
			wasmURL: "https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm",
		});
	};

	useEffect(() => {
		startService();
	}, []);

	const onChangeHandler = (e: ChangeEvent<HTMLTextAreaElement>) => {
		setInput(e.target.value);
	};

	const onSubmitClickedHandler = async () => {
		if (!esBuildServiceRef.current) {
			return;
		}

		const result = await esBuildServiceRef.current.build({
			entryPoints: ["index.js"],
			bundle: true,
			write: false,
			plugins: [unpkgPathPlugin(), fetchPlugin(input)],
			define: {
				"process.env.NODE_ENV": "'production'",
				global: "window",
			},
		});

		setCode(result.outputFiles[0].text);
	};

	return (
		<div>
			<textarea value={input} onChange={onChangeHandler}></textarea>
			<div>
				<button onClick={onSubmitClickedHandler}>Submit</button>
			</div>
			<pre>{code}</pre>
		</div>
	);
};

ReactDOM.render(<App />, document.querySelector("#root"));
