import express from 'express';
import { getReportSummary } from '../controllers/reportController.js';

const reportRouter = express.Router();

reportRouter.get('/summary', getReportSummary);

export default reportRouter;
