/* 
  The `mu` library is part of the `semtech/mu-javascript-template` Docker image that is used to run the service.
  This file is only used by the IDE to provide code completion and type checking.
*/
declare module 'mu' {
    import { Express, ErrorRequestHandler } from "express";
    export const app : Express;
    export const errorHandler : ErrorRequestHandler
    export const sparqlEscapeString : (value: string) => string;
}