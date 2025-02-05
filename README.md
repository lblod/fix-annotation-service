# fix-annotation-service

This plugin generates previews of MOW templates. 

## Endpoints

### POST /delta

This endpoint delta from `delta-notifier` service. 
It will update the `ext:preview` property on `mobiliteit:Template` instances based on inserted triples.

Example `delta-notifier` configuration:
```
{
  match: {
    predicate: {
      type: 'uri',
      value: 'http://www.w3.org/ns/prov#value'
    }
  },
  callback: {
    url: "http://annotater/delta",
    method: "POST",
  },
  options: {
    resourceFormat: "v0.0.1",
    ignoreFromSelf: true,
    gracePeriod: 250,
  },
}
```

### POST /update-all

Update all `ext:preview` relationships on `mobiliteit:Template` instances. 
```
docker compose exec annotater curl -X POST http://localhost/update-all
```

### POST /clear

Delete all `ext:preview` relationships on `mobiliteit:Template` instances.
```
docker compose exec annotater curl -X POST http://localhost/clear
```

## How to release

[release-it](https://github.com/release-it/release-it/) and
[lerna-changelog](https://github.com/lerna/lerna-changelog/) are used to release the package.

The generated changelog is based on PR titles and labels. 

### Prerequis

Before releasing, make sure to have the `GITHUB_AUTH` environment variable set to a personal access token with the `repo` scope. 
You can create a new token [here](https://github.com/settings/tokens/new?scopes=repo&description=GITHUB_AUTH+env+variable).

Check labels asignated to recently merged PRs. Labels are used to categorize the changes in the changelog (See [lerna-changelog](https://github.com/lerna/lerna-changelog/?tab=readme-ov-file#usage)).

### Release

To release a new version, run the following command:

```bash
GITHUB_AUTH=<your_github_token> npm run release
```