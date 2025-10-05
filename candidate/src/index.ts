import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import router from './routes';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Trace id middleware - attach a trace_id to each request and response
app.use((req: Request, res: Response, next: NextFunction) => {
	const trace = req.header('X-Trace-Id') || uuidv4();
	res.setHeader('X-Trace-Id', trace);
	res.locals.trace_id = trace;
	next();
});

// Health endpoints
app.get('/healthz', (_req: Request, res: Response) => res.json({ status: 'ok' }));
app.get('/readinessz', (_req: Request, res: Response) => res.json({ ready: true }));

app.use(router);

// Global error handler - returns { code, message, trace_id }
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
	const trace = res.locals.trace_id || req.header('X-Trace-Id') || uuidv4();
	const status = err && err.status ? err.status : 500;
	const code = err && err.code ? err.code : 'internal_error';
	const message = err && err.message ? err.message : 'internal server error';
	// log server-side with trace id
	// eslint-disable-next-line no-console
	console.error({ trace, code, message, stack: err && err.stack });
	res.status(status).json({ code, message, trace_id: trace });
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
app.listen(port, () => console.log(`server listening on ${port}`));
