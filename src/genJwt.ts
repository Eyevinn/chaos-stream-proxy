import jwt from 'jsonwebtoken';

if (process.argv.length < 5)
  console.error('Expected 3 arguments; <secret> <email> <company>');
else {
  const secret = process.argv[2];
  const email = process.argv[3];
  const company = process.argv[4];
  console.log(jwt.sign({ company, email }, secret));
}
