/* eslint-disable unicorn/no-array-callback-reference */
import { constants as fsConstants, promises as fs } from "node:fs";
import { globby } from "globby";
import { readPackageUp } from "read-package-up";
import { match, P } from "ts-pattern";

type GetFilesArguments = {
	globs: string[];
	usePackage?: boolean;
};

export const getFiles = async ({ globs, usePackage }: GetFilesArguments): Promise<string[]> => {
	const filePaths = globs.length === 0
		? []
		: await globby(globs, { expandDirectories: false, onlyFiles: true });

	if (usePackage) {
		const maybePackageJson = await readPackageUp();

		if (!maybePackageJson) {
			throw new Error("No package.json found.");
		}

		const { packageJson } = maybePackageJson;
		const binaries: string[] = match(packageJson.bin)
			.with(P.string, binary => [binary])
			.with(P.nullish, () => [])
			.otherwise(binary => Object.values(binary));

		filePaths.push(...binaries);
	}

	return filePaths;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const EXECUTABLE_MASK = fsConstants.S_IXUSR | fsConstants.S_IXGRP | fsConstants.S_IXOTH;

const setExecutableBit = async (filePath: string) => {
	const stats = await fs.stat(filePath);

	// Same as 'chmod +x'
	if ((stats.mode & EXECUTABLE_MASK) !== EXECUTABLE_MASK) {
		await fs.chmod(filePath, stats.mode | EXECUTABLE_MASK);
	}
};

export const setExecutableBits = async (filePaths: string[]) => (
	Promise.all(filePaths.map(setExecutableBit))
);

const fixShebang = async (filePath: string) => {
	const file = await fs.readFile(filePath, "utf8");
	const lines = file.split(/\r?\n/);

	if (lines.at(0)?.startsWith("#!/")) {
		lines[0] = "#!/usr/bin/env node";
		await fs.writeFile(filePath, lines.join("\n"), "utf8");
	}
};

export const fixShebangs = async (filePaths: string[]) => (
	Promise.all(filePaths.map(fixShebang))
);
