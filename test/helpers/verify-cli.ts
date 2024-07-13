import process from "node:process";
import type { AsyncReturnType, IfNever, RequireOneOrNone as OneOrNoneOf } from "type-fest";
import test, { type ExecutionContext } from "ava";
import esmock from "esmock";
import * as tt from "testtriple";
import { match, P } from "ts-pattern";
import { getProperty } from "dot-prop";
import mapObject from "map-obj";
import * as helpers from "../../src/helpers.js";
import { splitStdout } from "./util.js";

declare module "testtriple" {
	type Spy<T, U = Extract<T, (...args: any) => any>> = IfNever<U, (...args: any) => void, U>;

	export function spy<T>(...functions: Array<Extract<T, (...args: any) => any>>): Spy<T>;
}

type Helpers = typeof helpers;

// dprint-ignore
type HelperCalls = number | {
	[helper in keyof Helpers]?: number | (
		| {
			callCount: number;
			args: Parameters<Helpers[helper]>;
		}
		| {
			resolves?: AsyncReturnType<Helpers[helper]>;
		}
	)
};

type HelperStubs = {
	[Helper in keyof Helpers]: ReturnType<typeof tt.spy<Helpers[Helper]>>;
};

type MockCliArguments = {
	helperCalls: HelperCalls;
	args?: string;
	logs: string[];
};

const mockCli = async ({ helperCalls, args, logs }: MockCliArguments) => {
	const helperStubs = mapObject(helpers, helper => {
		// @ts-expect-error: helperCalls might not be indexable -> undefined
		const resolved = helperCalls[helper]?.resolves as AsyncReturnType<typeof helpers[typeof helper]>;
		const spy = resolved === undefined
			? tt.spy()
			// @ts-expect-error: weird typing of tt.resolves
			: tt.spy(tt.resolves(resolved));

		return [helper, spy];
	}) as HelperStubs;

	/* eslint-disable @typescript-eslint/naming-convention */
	await esmock("../../src/cli.js", import.meta.url, { // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
		"../../src/helpers.js": helperStubs,
	}, {
		"node:process": {
			argv: [...process.argv, ...(args?.split(" ") ?? [])],
			exit: (code: number) => {
				class HelperStubError extends Error {
					helperStubs: HelperStubs;

					constructor(message: string) {
						super(message);

						this.name = "HelperStubError";
						this.helperStubs = helperStubs;
					}
				}

				throw new HelperStubError(`process.exit, exit code: ${code}`);
			},
		},
		"import": {
			console: {
				log: (...args: string[]) =>
					args.map(log => (
						logs.push(...splitStdout(log))
					)),
			},
		},
	}) as typeof import("../../src/cli.js"); // eslint-disable-line @typescript-eslint/consistent-type-imports
	/* eslint-enable @typescript-eslint/naming-convention */

	return { helperStubs };
};

type HelperStubError = Error & {
	name: "HelperStubError";
	helperStubs: HelperStubs;
};

type VerifyCliSucceedsArguments = MockCliArguments & {
	t: ExecutionContext;
	expected: string | string[];
};

const verifyCliSucceeds = async ({
	t,
	expected,
	helperCalls,
	args,
	logs,
}: VerifyCliSucceedsArguments): Promise<HelperStubs> => {
	let helperStubs: HelperStubs;

	try {
		({ helperStubs } = await mockCli({ helperCalls, args, logs }));
	} catch (maybeError: unknown) {
		const error = maybeError as HelperStubError | undefined;

		if (error?.name === "HelperStubError") {
			t.is(error.message, "process.exit, exit code: 0");
			helperStubs = error.helperStubs;
		} else {
			throw error; // eslint-disable-line @typescript-eslint/no-throw-literal
		}
	}

	const expectedLogs = expected === ""
		? []
		: (Array.isArray(expected)
			? expected
			: splitStdout(expected));

	t.deepEqual(logs, expectedLogs);

	return helperStubs;
};

type VerifyCliFailsArguments = MockCliArguments & {
	t: ExecutionContext;
	message: string;
};

const verifyCliFails = async ({ t, message, ...mockCliArgs }: VerifyCliFailsArguments): Promise<HelperStubs> => {
	const { helperStubs } = await t.throwsAsync<HelperStubError>(mockCli(mockCliArgs), { message });
	return helperStubs;
};

type VerifyHelperCallsArguments = {
	t: ExecutionContext;
	helperCalls: HelperCalls;
	helperStubs: HelperStubs;
};

const verifyHelperCalls = ({ t, helperCalls, helperStubs }: VerifyHelperCallsArguments) => {
	for (const [helper, stub] of Object.entries(helperStubs)) {
		if (helper === "default") {
			continue;
		}

		// eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
		const expectedArgs = getProperty(helperCalls, `${helper}.args`) ?? [];
		const expectedCalls: number | "skip assertion" = match(helperCalls)
			.with(P.number, callCount => callCount)
			.otherwise(_helperCalls => (
				match(_helperCalls[helper as keyof typeof helpers])
					.with(P.number, callCount => callCount)
					.with(P.nullish, _ => "skip assertion" as const)
					.with({ callCount: P.number }, call => call.callCount)
					.otherwise(_ => "skip assertion" as const)
			));

		const actualCalls = tt.callsOf(stub);

		if (expectedCalls !== "skip assertion") {
			t.is(actualCalls.length, expectedCalls);
		}

		if (expectedArgs.length > 0) {
			// Access first call -> helpers only called once currently, can change later
			t.deepEqual(actualCalls[0], expectedArgs);
		}
	}
};

// dprint-ignore
type VerifyCliArguments = {
	args?: string;
	helperCalls?: HelperCalls;
} & OneOrNoneOf<{
	output: string | string[];
	errorMessage: string;
}>;

export const verifyCli = test.macro(async (t, {
	args,
	output: expected = "",
	errorMessage,
	helperCalls = 0,
}: VerifyCliArguments) => {
	const logs: string[] = [];
	const mockCliArgs: MockCliArguments = { helperCalls, args, logs };

	// Stub helpers to remove side-effects and spy on call counts
	const helperStubs = await (errorMessage === undefined
		? verifyCliSucceeds({ t, expected, ...mockCliArgs })
		: verifyCliFails({ t, message: errorMessage, ...mockCliArgs }));

	verifyHelperCalls({ t, helperCalls, helperStubs });
});
