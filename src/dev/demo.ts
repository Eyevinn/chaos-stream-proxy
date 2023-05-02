import { LambdaELB } from '@eyevinn/dev-lambda';
import { proxy } from '../lambda';
import { ALBResult, ALBEvent } from 'aws-lambda';

new LambdaELB({
  handler: <(event: ALBEvent) => Promise<ALBResult>>proxy
}).run();
