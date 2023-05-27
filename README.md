# sync-user-secrets

🔒 Sync one repo's secrets to more repos

```yml
name: Update user secrets
on:
  schedule:
    # https://crontab.guru/daily
    - cron: "0 0 * * *"
  workflow_dispatch:
concurrency:
  group: update-user-secrets
  cancel-in-progress: true
jobs:
  update-user-secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: jcbhmr/sync-secrets-action@main
        with:
          token: ${{ secrets.SYNC_SECRETS_PAT }}
          query: user:${{ github.repository_owner }}
          secrets: ${{ toJSON(secrets) }}
          secret-filter: /^NPM_TOKEN$/
```
