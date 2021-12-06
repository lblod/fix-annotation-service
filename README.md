# fix-annotation-service

This plugin generates annotated versions of all the templates that don't have it. In order to do that you just have to send a 
POST request to `/fixAnnotated` and the server will answer with `Done` once it has finished.


## development and testing
This service extends semtech/mu-javascript-template. For development include the following in your docker-compose.yml:

```
  fixAnnotated:
    image: semtech/mu-javascript-template
    ports:
      - 9229:9229
    environment:
      NODE_ENV: "development"
      LOG_SPARQL_ALL: "true"
      DEBUG_AUTH_HEADERS: "true"
    volumes:
        - /path/to/fix-annotation-service:/app/
```

You can also expose the 80 port to call the endpoint using postman
