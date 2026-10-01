import nodePath from "node:path";
import process from "node:process";
import type { OneOf } from "./types.ts";
import { type Binary, hasShebang, log, readPackageJson, setExecutableBit } from "./utils.ts";

type Input = {
	input: string[];
	usePackage?: boolean;
};

/** Collates input file paths and binaries from `package.json`, deduplicating any input paths in `package.json`. */
export const getBinaries = async ({ input, usePackage }: Input): Promise<Binary[]> => {
	const binaries: Binary[] = [];

	if (usePackage) {
		const packageBinaries = await readPackageJson();

		if (!packageBinaries) {
			log.error("No package.json found.");
			process.exit(1);
		}

		binaries.push(...packageBinaries);
	}

	for (const path of input) {
		const absolutePath = nodePath.resolve(process.cwd(), path);

		if (binaries.every(binary => binary.absolutePath !== absolutePath)) {
			binaries.push({ absolutePath, path });
		}
	}

	return binaries;
};

type ExecifyResult = OneOf<{
	didExecify: boolean;
	hasShebang: boolean;
}, {
	error: string;
}>;

const execifySingle = async (path: string): Promise<ExecifyResult> => {
	try {
		return {
			didExecify: await setExecutableBit(path),
			hasShebang: await hasShebang(path),
		};
	} catch (error) {
		let message = String(error);

		if (error instanceof Error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				message = `file not found`;
			} else if ((error as NodeJS.ErrnoException).code === "EACCES") {
				message = `permission denied`;
			} else {
				message = error.message;
			}
		}

		return { error: message };
	}
};

type ExecifyOutput = Binary & ExecifyResult;

export const execify = async (binaries: Binary[]): Promise<ExecifyOutput[]> => (
	Promise.all(binaries.map(async (binary) => {
		const result = await execifySingle(binary.absolutePath ?? binary.path);
		return { ...binary, ...result };
	}))
);
