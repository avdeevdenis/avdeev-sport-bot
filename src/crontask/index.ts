import { run } from '../entryPoints';

const cron = require('node-cron');

// Вариант для тестирования, срабатывание каждые 5 секунд:
const DAILY_REPEAT_INTERVALS = '*/5 * * * * *';

/**
 * Время работы cron-скрипта  - каждые 5 минут с 09:00 до 24:00 пн-пт включительно
 * (важно не забыть UTC+3)
 */
// const DAILY_REPEAT_INTERVALS = '*/5 6-21 * * *';

cron.schedule(DAILY_REPEAT_INTERVALS, async () => {
  await run();
});