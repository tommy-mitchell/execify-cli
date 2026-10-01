import * as configs from "@tommy-mitchell/eslint-config-xo";

/** @type {import('xo').FlatXoConfig} */
export default [...configs.xo, ...configs.dprint, {
	ignores: ["test/fixtures"],
}, {
	rules: {
		"no-bitwise": "off",
		"unicorn/no-process-exit": "off",
	},
}, {
	files: "package.json",
	rules: {
		"package-json/dependency-version-range": ["error", {
			exceptions: ["typescript"],
		}],
	},
}];
