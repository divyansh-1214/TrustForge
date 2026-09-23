import express from 'express';
import {config} from 'dotenv';
import membersRouter from './feature/members/members.routes.js';
import organizationsRouter from './feature/organizations/organizations.routes.js';
import usersRouter from './feature/users/users.routes.js';


config();
const app = express();
app.use(express.json());
app.use('/members', membersRouter);
app.use('/organizations', organizationsRouter);
app.use('/users', usersRouter);

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
