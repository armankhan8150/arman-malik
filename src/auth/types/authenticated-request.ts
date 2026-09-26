import { Request } from 'express';
import { AuthenticatedUser } from '../repositories/user.repository';

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}