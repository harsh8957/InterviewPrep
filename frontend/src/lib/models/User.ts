export interface IUser {
  _id: string;
  email: string;
  role: 'candidate' | 'hr' | 'admin';
  firstName: string;
  lastName: string;
  company?: string;
  position?: string;
} 
