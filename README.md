# Lyceum Social

## Возможности

- Регистрация пользователей
- Авторизация (JWT)
- Автоматический вход
- Создание групп
- Просмотр списка групп
- Поиск групп
- Поиск пользователей
- Создание постов
- Просмотр постов внутри группы
- Лайки постов
- Удаление постов
- Комментарии к постам
- Удаление комментариев

## Использовано 

- Frontend: React + TypeScript (Vite)
- Backend: NestJS
- База данных: PostgreSQL (Docker)
- ORM: Prisma

##  Как запустить проект

### 1. Клонировать репозиторий

git clone 
cd lyceum-social

### 2. Запустить базу

docker compose up -d

### 3. Запустить backend

cd backend
npm install
npm run start:dev

### 4. Запустить frontend

cd frontend
npm install
npm run dev

### 5. Открыть сайт

http://localhost:5173

