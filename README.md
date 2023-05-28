# sync-user-secrets

🔒 Sync one repo's secrets to more repos

## Usage

The primary usecase for this action to to sync secrets from one "main" repo (like your special meta `user/.github` repo or `user/user` repo) to a bunch of other repositories. This is very useful for users who want to sync something like an `$NPM_TOKEN` secret across a bunch of their Node.js packages. You can use GitHub Search syntax to determine which repositories are targeted by this action.

```yml
name: Update user secrets
on:
  push:
    branches: [main]
    paths:
      - .github/workflows/update-user-secrets.yml
  schedule:
    - cron: '0 0 * * *'
  workflow_dispatch:
concurrency:
  group: update-user-secrets
  cancel-in-progress: true
jobs:
  update-user-secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: jcbhmr/set-secrets-action@main
        with:
          token: ${{ secrets.USER_SECRETS_PAT }}
          query: user:${{ github.repository_owner }}
          secrets: ${{ toJSON(secrets) }}
          secret-filter: (k) => k !== "PROFILE_PAT"
```
