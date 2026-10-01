import process from "node:process";
import { type Binary, hasShebang, log, readPackageJson, setExecutableBit } from "./utils.ts";

type GetFilesArguments = {
	input: string[];
	usePackage?: boolean;
};

/** Collates input file paths and binaries from `package.json`, deduplicating any input paths in `package.json`. */
export const getBinaries = async ({ input, usePackage }: GetFilesArguments): Promise<Binary[]> => {
	const binaries: Binary[] = [];

	if (usePackage) {
		const packageBinaries = await readPackageJson();

		if (!packageBinaries) {
			log.error("No package.json found.");
			process.exit(1);
		}

		binaries.push(...packageBinaries);
		input = input.filter(path => packageBinaries.every(binary => binary.path !== path && binary.path !== `./${path}`));
	}

	return [...binaries, ...input.map(path => ({ path }))];
};

type ExecifyResult = {
	didExecify: boolean;
	error?: never;
	hasShebang: boolean;
} | {
	didExecify?: never;
	error: string;
	hasShebang?: never;
};

const execifySingle = async (filePath: string): Promise<ExecifyResult> => {
	try {
		return {
			didExecify: await setExecutableBit(filePath),
			hasShebang: await hasShebang(filePath),
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
