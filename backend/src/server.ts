import express from 'express';
import { config } from 'dotenv';
import cors from "cors";
import membersRouter from './feature/members/members.routes.js';
import organizationsRouter from './feature/organizations/organizations.routes.js';
import usersRouter from './feature/users/users.routes.js';
import productsRouter from './feature/projects/projects.routes.js';
import guardrailPoliciesRouter from './feature/guardrailPolicies/guardrailPolicies.routes.js';
import guardrailDetectionRulesRouter from './feature/guardrailDetectionRules/guardrailDetectionRules.routes.js';
import guardrailTransformationRulesRouter from './feature/guardrailTransformationRules/guardrailTransformationRules.routes.js';
import guardrailEventsRouter from './feature/guardrailEvents/guardrailEvents.routes.js';
import providersRouter from './feature/providers/providers.routes.js';
import modelsRouter from './feature/models/models.routes.js';
import providerModelsRouter from './feature/providerModels/providerModels.routes.js';
import routingRulesRouter from './feature/routingRules/routingRules.routes.js';
import apiKeysRouter from './feature/apiKeys/apiKeys.routes.js';
import usageLogsRouter from './feature/usageLogs/usageLogs.routes.js';
import classifyRoutes from './feature/classify/classify.routes.js';

config();
const frontendUrl = process.env.FRONTEND_URL;
const app = express();
app.use(cors({origin: frontendUrl}));
app.use(express.json());
app.use('/v1/members', membersRouter);
app.use('/v1/organizations', organizationsRouter);
app.use('/v1/users', usersRouter);
app.use('/v1/products', productsRouter);
app.use('/v1/projects', productsRouter);
app.use('/v1/guardrail-policies', guardrailPoliciesRouter);
app.use('/v1/guardrail-detection-rules', guardrailDetectionRulesRouter);
app.use('/v1/guardrail-transformation-rules', guardrailTransformationRulesRouter);
app.use('/v1/guardrail-events', guardrailEventsRouter);
app.use('/v1/providers', providersRouter);
app.use('/v1/models', modelsRouter);
app.use('/v1/provider-models', providerModelsRouter);
app.use('/v1/routing-rules', routingRulesRouter);
app.use('/v1/api-keys', apiKeysRouter);
app.use('/v1/usage-logs', usageLogsRouter);
app.use('/v1/classify', classifyRoutes);

app.get('/', (req, res) => {
  res.json({success: true, message: 'server is running'})
});
const PORT = process.env.PORT;
(function () {
  console.log(PORT)
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})();
