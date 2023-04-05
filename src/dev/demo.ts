const { LambdaELB } = require('@eyevinn/dev-lambda');
import { handler } from '../lambda';

new LambdaELB({ handler }).run();
