import express from 'express';
import {config} from 'dotenv';
import membersRouter from './feature/members/members.routes.js';
import organizationsRouter from './feature/organizations/organizations.routes.js';
import usersRouter from './feature/users/users.routes.js';
import productsRouter from './feature/projects/projects.routes.js';
import guardrailPoliciesRouter from './feature/guardrailPolicies/guardrailPolicies.routes.js';

config();
const app = express();
app.use(express.json());
app.use('/v1/members', membersRouter);
app.use('/v1/organizations', organizationsRouter);
app.use('/v1/users', usersRouter);
app.use('/v1/products', productsRouter);
app.use('/v1/guardrail-policies', guardrailPoliciesRouter);

app.get('/', (req, res) => {
  res.send('Hello, World!');
});
const PORT = process.env.PORT;
(function () {
  console.log(PORT)
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})();
