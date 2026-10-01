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
		input = input.filter(path => packageBinaries.every(binary => binary.path !== path));
	}

	return [...binaries, ...input.map(path => ({ path }))];
};

type ExecifyResult = {
	didExecify: boolean;
	error?: string;
};

const execifySingle = async (filePath: string): Promise<ExecifyResult> => {
	try {
		return { didExecify: await setExecutableBit(filePath) };
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

		return { didExecify: false, error: message };
	}
};

export const execify = async (binaries: Binary[]): Promise<void[]> => (
	Promise.all(binaries.map(async ({ name, path }) => {
		const { didExecify, error } = await execifySingle(path);
		const nameSuffix = name ? `(${name})` : "";

		if (didExecify) {
			log.success(`Execified "${path}"`, nameSuffix);
		} else if (error) {
			log.error(`Failed to execify "${path}", ${error}`, nameSuffix);
		} else {
			log.info(`File "${path}" is already executable`, nameSuffix);
		}

		try {
			if (!await hasShebang(path)) {
				log.warn(`File "${path}" is missing a shebang!`, nameSuffix);
			}
		} catch {
			// Errors here don't matter, one is already logged if the file is non-existent
		}
	}))
);
