import { fileURLToPath } from "node:url";
import path from "node:path";
import { type Options as ExecaOptions } from "execa";
import { createTag, stripIndentTransformer, trimResultTransformer } from "proper-tags";

export const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const atFixture = (name: string) => path.join(__dirname, "..", "fixtures", name);

export const atFixtureCwd = (name: string): ExecaOptions => ({ cwd: atFixture(name) });

type Tag<ReturnType = string> = {
	(string_: string): ReturnType;
	(literals: TemplateStringsArray, ...placeholders: any[]): ReturnType;
};

export const trimStdout = createTag(
	stripIndentTransformer(),
	trimResultTransformer("smart" as ""),
) as unknown as Tag;

export const splitStdout = createTag(
	trimStdout,
	{ onEndResult: (result: string) => result.split("\n") },
) as unknown as Tag<string[]>;
