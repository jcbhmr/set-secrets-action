import { getInput } from "npm:@actions/core";
import parseBoolean from "npm:parseboolean";
import { $ } from "npm:zx";

const token = getInput("token", { required: true });
const githubServerURL = getInput("github_server_url", { required: true });
const owner = getInput("owner", { required: true });
const repositoryFiler = new RegExp(
  getInput("repository_filter", { required: true })
);
const dryRun = parseBoolean(getInput("dry_run", { required: true }));
const secrets = JSON.parse(getInput("secrets", { required: true }));
const secretFilter = new RegExp(getInput("secret_filter", { required: true }));

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
  ).split(/\s+/g);

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
