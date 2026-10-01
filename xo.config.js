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
}, {
	// TODO: move to main config
	rules: {
		"@typescript-eslint/consistent-type-imports": ["error", {
			disallowTypeAnnotations: false,
			fixStyle: "inline-type-imports",
		}],
		"@typescript-eslint/strict-boolean-expressions": ["error", {
			allowNullableBoolean: true,
			allowNullableObject: true,
			allowNullableString: true, // diff from xo
			allowNumber: false,
			allowString: true, // diff from xo
		}],
	},
}];
