import { mkdir, readdir, readFile, writeFile } from "fs/promises";

let text = `// Generation Time: ${new Date().toISOString()}\n`;
async function runProcess(dir: URL) {
	const d = await readdir(dir, { withFileTypes: true });
	for (const f of d) {
		if (f.isDirectory()) await runProcess(new URL(`${f.name}/`, dir));
		else {
			let lookForImport = false;
			const txt = (await readFile(new URL(f.name, dir)))
				.toString()
				.split("\n")
				.map((line, index) => {
					if (line.startsWith("type")) console.warn("Unexported Type In %s:%d", new URL(f.name, dir).pathname.replace(new URL(".", import.meta.url).pathname, ""), index + 1);
					if (line.startsWith("interface")) console.warn("Unexported Interface In %s:%d", new URL(f.name, dir).pathname.replace(new URL(".", import.meta.url).pathname, ""), index + 1);
					if (line.startsWith("eslint-disable")) return "[DELETE]";
					if (line.startsWith("export *")) return "[DELETE]";
					if (line.startsWith("import ")) {
						if (line.endsWith("l")) return "[DELETE]";
						lookForImport = true;
					}
					if (lookForImport) {
						if (line.endsWith(";")) lookForImport = false;
						return "[DELETE]";
					}
					return line;
				})
				.filter(line => line !== "[DELETE]")
				.join("\n");
			text += `/* File: ${new URL(f.name, dir).pathname.replace(typesBase.pathname, "")} */\n${txt}`
			;
		}
	}
}

const typesBase = new URL("lib/", import.meta.url);
await runProcess(typesBase);
await mkdir(new URL("./dist", import.meta.url), { recursive: true });
await writeFile(new URL("./dist/types.d.ts", import.meta.url), text);
