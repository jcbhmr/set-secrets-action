import parseBoolean from "npm:parseboolean";
import { $ } from "npm:zx";

const token = Deno.env.get("INPUT_TOKEN")!;
const githubServerURL = Deno.env.get("INPUT_GITHUB_SERVER_URL")!;
const owner = Deno.env.get("INPUT_OWNER")!;
const repositoryFiler = new RegExp(Deno.env.get("INPUT_REPOSITOORY_FILTER")!);
const dryRun = parseBoolean(Deno.env.get("INPUT_DRY_RUN"));
const secrets = JSON.parse(Deno.env.get("INPUT_DRY_RUN")!);
const secretFilter = new RegExp(Deno.env.get("INPUT_SECRET_FILTER")!);

Deno.env.set("GITHUB_TOKEN", token);
Deno.env.set("GITHUB_SERVER_URL", githubServerURL);
Deno.env.set("GH_HOST", new URL(githubServerURL).host);
Deno.env.set("GITHUB_ACTOR", owner);

const envFile = await Deno.makeTempFile({ suffix: ".env" });
try {
  for (const [k, v] of Object.entries(secrets)) {
    if (!secretFilter.test(k)) {
      console.debug(`Skip ${k}`);
      continue;
    }

    await Deno.writeTextFile(envFile, `${k}=${v}\n`, { append: true });
  }

  const repositories = (
    "" + (await $`gh repo list --json nameWithOwner --jq .[].nameWithOwner`)
  )
    .trim()
    .split(/\s+/g);

  for (const repository of repositories) {
    if (!repositoryFiler.test(repository)) {
      console.debug(`Skip ${repository}`);
      continue;
    }

    if (dryRun) {
      console.info`gh secret set -R ${repository} -f ${envFile}`;
    } else {
      await $`gh secret set -R ${repository} -f ${envFile}`;
    }
  }
} finally {
  await Deno.remove(envFile);
}
