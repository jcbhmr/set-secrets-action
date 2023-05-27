#!/usr/bin/env -S deno run -Aq
/**
 * TODO: Add doc comment
 *
 * @file
 */

import parseBoolean from "npm:parseboolean";
import { $ } from "npm:zx";
import { isFunction, isRegExp } from "npm:is-what";

const runnerDebug = parseBoolean(Deno.env.get("RUNNER_DEBUG")!);
$.verbose = runnerDebug;

const input = JSON.parse(Deno.env.get("INPUT")!) as Record<string, string>;
const token = input.token;
const githubServerURL = new URL(input["github-server-url"]);
const dryRun = parseBoolean(input["dry-run"]);
const query = input.query;
const secrets = JSON.parse(input.secrets) as Record<string, string>;
const secretFilterRaw = (0, eval)(input["secret-filter"]);
const secretFilter: (k: string, v: string) => boolean = isFunction(
  secretFilterRaw
)
  ? (secretFilterRaw as (k: string, v: string) => boolean)
  : isRegExp(secretFilterRaw)
  ? (k: string) => secretFilterRaw.test(k)
  : () => true;

Deno.env.set("GITHUB_TOKEN", token);
Deno.env.set("GH_HOST", githubServerURL.host);

const envFile = await Deno.makeTempFile({ suffix: ".env" });
globalThis.addEventListener("unload", () => Deno.removeSync(envFile));

for (const [k, v] of Object.entries(secrets)) {
  if (secretFilter(k, v) && k !== "github_token" && v !== token) {
    await Deno.writeTextFile(envFile, `${k}=${v}\n`, { append: true });
  } else if (runnerDebug) {
    console.info(`Skipping ${k}`);
  }
}
if (runnerDebug) {
  console.info(await Deno.readTextFile(envFile));
}

const repositories = (
  "" + (await $`gh search repos ${query} --json fullName --jq .[].fullName`)
)
  .trim()
  .split(/\s+/g)
  .filter((s) => s !== Deno.env.get("GITHUB_REPOSITORY")!);

if (!repositories.length) {
  console.warn("No repositories found");
}
const errors: Error[] = [];
for (const repository of repositories) {
  if (dryRun) {
    console.info`gh secret set -R ${repository} -f ${envFile}`;
  } else {
    await $`gh secret set -R ${repository} -f ${envFile}`.catch((e) =>
      errors.push(e)
    );
  }
}
if (errors.length) {
  throw new AggregateError(errors);
}
