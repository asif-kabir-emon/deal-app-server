import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import router from './routes';
import notFound from './middlewares/notFound';
import globalErrorHandler from './middlewares/globalErrorHandler';

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());
app.use(cors({ origin: ['http://localhost:4000', 'http://localhost:3000'] }));

const test = (req: Request, res: Response) => {
  res.send('Welcome to the Server.');
};

app.get('/', test);
app.use('/api', router);

app.use(globalErrorHandler);
app.use('*', notFound);

export default app;
