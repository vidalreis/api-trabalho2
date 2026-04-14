// 📁 backend/src/types/index.ts - Tipos para o backend

// Interface base do usuário (sem password para segurança)
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'gerente' | 'contador' | 'dono';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface do usuário no banco (com password - apenas backend)
export interface UserWithPassword extends User {
  password: string; // Hash da senha
}

// Interface para criação de usuário (sem id e timestamps)
export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: 'gerente' | 'contador' | 'dono';
}

// Interface para login
export interface LoginInput {
  email: string;
  password: string;
}

// Interface para resposta de login
export interface LoginResponse {
  user: User;
  token: string;
}