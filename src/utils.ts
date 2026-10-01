import { constants as fsConstants, promises as fs } from "node:fs";
import { readPackageUp } from "read-package-up";

export type Binary = {
	name?: string;
	path: string;
};

/** Parses all binaries from the nearest `package.json`, returning `undefined` if none exists. */
export const readPackageJson = async (): Promise<Binary[] | undefined> => {
	const maybePackageJson = await readPackageUp();

	if (!maybePackageJson) {
		return;
	}

	const { packageJson } = maybePackageJson;

	if (!packageJson.bin) {
		return [];
	}

	return typeof packageJson.bin === "string"
		? [{ name: packageJson.name, path: packageJson.bin }]
		: Object.entries(packageJson.bin).map(([name, path]) => ({ name, path }));
};

const EXECUTABLE_MASK = fsConstants.S_IXUSR | fsConstants.S_IXGRP | fsConstants.S_IXOTH;

/** Sets the executable bit on a file, if not already set. Returns `true` if the bit was changed, `false` otherwise. */
// eslint-disable-next-line unicorn/consistent-boolean-name
export const setExecutableBit = async (path: string): Promise<boolean> => {
	const stats = await fs.stat(path);

	// Same as 'chmod +x'
	if ((stats.mode & EXECUTABLE_MASK) !== EXECUTABLE_MASK) {
		await fs.chmod(path, stats.mode | EXECUTABLE_MASK);
		return true;
	}

	return false;
};
