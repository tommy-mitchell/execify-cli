import { constants as fsConstants, promises as fs } from "node:fs";
import logSymbols from "log-symbols";
import { readPackageUp } from "read-package-up";

type GetFilesArguments = {
	input: string[];
	usePackage?: boolean;
};

type Binary = {
	name?: string;
	path: string;
};

/** Collates input file paths and binaries from `package.json`, deduplicating any input paths in `package.json`. */
export const getBinaries = async ({ input, usePackage }: GetFilesArguments): Promise<Binary[]> => {
	const binaries: Binary[] = [];

	if (usePackage) {
		const maybePackageJson = await readPackageUp();

		if (!maybePackageJson) {
			throw new Error("No package.json found.");
		}

		const { packageJson } = maybePackageJson;

		if (!packageJson.bin) {
			return binaries;
		}

		if (typeof packageJson.bin === "string") {
			binaries.push({ name: packageJson.name, path: packageJson.bin });
			input = input.filter(p => p !== packageJson.bin);
		} else {
			for (const [name, path] of Object.entries(packageJson.bin)) {
				binaries.push({ name, path });
				input = input.filter(p => p !== path);
			}
		}
	}

	return [...binaries, ...input.map(path => ({ path }))];
};

const EXECUTABLE_MASK = fsConstants.S_IXUSR | fsConstants.S_IXGRP | fsConstants.S_IXOTH;

// eslint-disable-next-line unicorn/consistent-boolean-name
const setExecutableBit = async (filePath: string): Promise<boolean> => {
	const stats = await fs.stat(filePath);

	// Same as 'chmod +x'
	if ((stats.mode & EXECUTABLE_MASK) !== EXECUTABLE_MASK) {
		await fs.chmod(filePath, stats.mode | EXECUTABLE_MASK);
		return true;
	}

	return false;
};

type ExecifyResult = {
	didExecify: boolean;
	error?: string;
};

const execifySingle = async (filePath: string): Promise<ExecifyResult> => {
	try {
		const didExecify = await setExecutableBit(filePath);
		return { didExecify };
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
		const nameSuffix = name ? ` (${name})` : ""; // eslint-disable-line @typescript-eslint/strict-boolean-expressions

		if (didExecify) {
			console.log(`${logSymbols.success} Execified "${path}"${nameSuffix}`);
		} else if (error) { // eslint-disable-line @typescript-eslint/strict-boolean-expressions
			console.error(`${logSymbols.error} Failed to execify "${path}", ${error}${nameSuffix}`);
		} else {
			console.log(`${logSymbols.info} "${path}" already executable${nameSuffix}`);
		}
	}))
);
