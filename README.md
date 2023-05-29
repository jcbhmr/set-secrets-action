# Set secrets action

🔒 Set secrets on a single repo or multiple repos at once

## Usage

Put something like this in a "dummy" repository that will hold a bunch of
secrets. I like to use my community health file repository (`jcbhmr/.github`)
for this.

```yml
name: Update user secrets
on:
  push:
    branches: [main]
    paths:
      - .github/workflows/update-user-secrets.yml
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:
concurrency:
  group: update-user-secrets
  cancel-in-progress: true
jobs:
  update-user-secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: jcbhmr/set-secrets-action@v1
        with:
          token: ${{ secrets.USER_SECRETS_TOKEN }}
          repositories: |
            jcbhmr/md-html
            jcbhmr/node-45981
            jcbhmr/html-simple-dialogs
          secret: NPM_TOKEN=${{ secrets.NPM_TOKEN }}
```
