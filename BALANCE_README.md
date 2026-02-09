# Система балансов для спортзала

## Описание

Система балансов позволяет управлять посещениями спортзала для каждого пользователя. У каждого баланса есть:

- Количество доступных посещений
- Срок действия (dueDate)
- Информация о покупке
- История использования

## Модели

### Balance

- `userId` - ID пользователя
- `visits` - количество оставшихся посещений
- `dueDate` - срок действия баланса
- `isActive` - активен ли баланс
- `purchaseDate` - дата покупки
- `price` - стоимость (опционально)
- `notes` - заметки (опционально)

### VisitHistory

- `userId` - ID пользователя
- `balanceId` - ID баланса, с которого списано посещение
- `visitDate` - дата посещения
- `notes` - заметки о посещении

## API Endpoints

### GET /balance/active

Получить активный баланс текущего пользователя

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "60f8b...",
    "visits": 8,
    "dueDate": "2026-03-06T00:00:00.000Z",
    "isExpired": false,
    "purchaseDate": "2026-02-06T10:30:00.000Z"
  }
}
```

### GET /balance/history

Получить все балансы пользователя

### POST /balance

Создать новый баланс (только для администраторов)

**Body:**

```json
{
  "userId": "60f8b...",
  "visits": 12,
  "dueDate": "2026-04-01",
  "price": 5000,
  "notes": "Абонемент на месяц"
}
```

### POST /balance/use-visit

Списать одно посещение

**Body:**

```json
{
  "notes": "Силовая тренировка"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Посещение успешно списано",
  "remainingVisits": 7
}
```

### GET /balance/stats

Получить статистику по пользователю

**Response:**

```json
{
  "success": true,
  "data": {
    "activeBalance": {
      "visits": 8,
      "dueDate": "2026-03-06T00:00:00.000Z",
      "isExpired": false
    },
    "totalBalances": 3,
    "totalVisitsUsed": 25,
    "thisMonthVisits": 8,
    "recentVisits": [...]
  }
}
```

## Использование в коде

### Создание баланса

```typescript
import { BalanceService } from '../services/balanceService';

const balance = await BalanceService.createBalance(
  userId,
  12, // количество посещений
  new Date('2026-04-01'), // срок действия
  5000, // цена
  'Месячный абонемент',
);
```

### Списание посещения

```typescript
const result = await BalanceService.useVisit(userId, 'Силовая тренировка');

if (result.success) {
  console.log(`Осталось посещений: ${result.remainingVisits}`);
} else {
  console.log(`Ошибка: ${result.message}`);
}
```

### Получение активного баланса

```typescript
const balance = await BalanceService.getActiveBalance(userId);
if (balance) {
  console.log(
    `У пользователя ${balance.visits} посещений до ${balance.dueDate}`,
  );
}
```

## Автоматическая очистка

В системе настроена автоматическая деактивация просроченных балансов (cron job каждый день в 02:00).

Для запуска добавьте в `index.ts`:

```typescript
import { startBalanceCleanupJob } from './jobs/balanceCleanup';

// После подключения к базе
startBalanceCleanupJob();
```

## Установка зависимостей

Не забудьте установить:

```bash
npm install node-cron
npm install @types/node-cron --save-dev
```
