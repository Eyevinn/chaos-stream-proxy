import { awsLambdaFastify } from '@fastify/aws-lambda';
import { app } from './server';

export const proxy = awsLambdaFastify(app);

// or
// const proxy = awsLambdaFastify(init(), { binaryMimeTypes: ['application/octet-stream'] })

//exports.handler = proxy;
// or
//exports.handler = (event, context, callback) => proxy(event, context, callback);
// or
// exports.handler = (event, context) => proxy(event, context);
// or
exports.handler = async (event, context) => proxy(event, context);

/*
how to push your image to aws ecr
docker build . -t chaos_stream_proxy -f DockerfileLambda && docker tag chaos_stream_proxy:latest YOUR_AWS_ACCOUND_ID.dkr.ecr.eu-central-1.amazonaws.com/chaos_stream_proxy:latest && docker push YOUR_AWS_ACCOUND_ID.dkr.ecr.eu-central-1.amazonaws.com/chaos_stream_proxy:latest     
*/
