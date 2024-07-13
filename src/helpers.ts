/* eslint-disable unicorn/no-array-callback-reference */
import { constants as fsConstants, promises as fs } from "node:fs";
import { globby } from "globby";
import { readPackageUp } from "read-package-up";
import shebangRegex from "shebang-regex";
import { match, P } from "ts-pattern";
import { NODE_SHEBANG } from "./constants.js";

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

	if (shebangRegex.test(file)) {
		await fs.writeFile(filePath, file.replace(shebangRegex, NODE_SHEBANG), "utf8");
	}
};

export const fixShebangs = async (filePaths: string[]) => (
	Promise.all(filePaths.map(fixShebang))
);
