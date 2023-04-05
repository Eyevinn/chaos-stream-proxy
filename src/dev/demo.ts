import { LambdaELB } from '@eyevinn/dev-lambda';
import { handler } from '../lambda';
import { ALBResult, ALBEvent } from 'aws-lambda';

new LambdaELB({
  handler: <(event: ALBEvent) => Promise<ALBResult>>handler
}).run();
