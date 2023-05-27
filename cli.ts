import parseBoolean from "npm:parseboolean";
import { $ } from "npm:zx";
import { isFunction, isRegExp } from "npm:is-what";

const token = Deno.env.get("INPUT_TOKEN")!;
const githubServerURL = Deno.env.get("INPUT_GITHUB_SERVER_URL")!;
const dryRun = parseBoolean(Deno.env.get("INPUT_DRY_RUN")!);
const query = Deno.env.get("INPUT_QUERY")!;
const secrets = JSON.parse(Deno.env.get("INPUT_DRY_RUN")!);
let secretFilter = (0, eval)(Deno.env.get("INPUT_SECRET_FILTER")!) as (
  k: string,
  v: string
) => boolean;
if (isFunction(secretFilter)) {
  // Nothing
} else if (isRegExp(secretFilter)) {
  const re = secretFilter as RegExp;
  secretFilter = (k) => re.test(k);
} else {
  secretFilter = () => true;
}

Deno.env.set("GITHUB_TOKEN", token);
Deno.env.set("GITHUB_SERVER_URL", githubServerURL);
Deno.env.set("GH_HOST", new URL(githubServerURL).host);

const envFile = await Deno.makeTempFile({ suffix: ".env" });
try {
  for (const [k, v] of Object.entries(secrets)) {
    if (!secretFilter(k, v)) {
      console.debug(`Skipping secret $${k}`);
      continue;
    }

    await Deno.writeTextFile(envFile, `${k}=${v}\n`, { append: true });
  }

  const repositories = (
    "" +
    (await $`gh search repos ${query} --include-forks true --json fullName --jq .[].fullName`)
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
} finally {
  await Deno.remove(envFile);
}
