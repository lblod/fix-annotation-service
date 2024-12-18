# fix-annotation-service

This plugin generates annotated versions of the templates. 

## Endpoints

### POST /delta

This endpoint delta from `delta-notifier` service. 
It will update the `ex:annotated` property on `mobiliteit:Template` based on inserted triples.

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

Update all `ex:annotated` on `mobiliteit:Template`. 
```
docker compose exec annotater curl -X POST http://localhost/update-all
```

### POST /clear

Delete all `ex:annotated` on `mobiliteit:Template`.
```
docker compose exec annotater curl -X POST http://localhost/clear
```