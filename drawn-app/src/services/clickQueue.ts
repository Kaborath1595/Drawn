import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { registerClick } from './api';

const QUEUE_KEY = 'click_queue';

export async function enqueueClick(): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue: number[] = raw ? JSON.parse(raw) : [];
  queue.push(Date.now());
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getPendingCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw).length : 0;
}

async function flushQueue(): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return;
  const queue: number[] = JSON.parse(raw);
  if (!queue.length) return;

  const state = await NetInfo.fetch();
  if (!state.isConnected) return;

  const remaining: number[] = [];
  for (const ts of queue) {
    try {
      await registerClick();
    } catch {
      remaining.push(ts);
    }
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
}

export function startQueueListener(onFlush: () => void): () => void {
  return NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      flushQueue().then(onFlush);
    }
  });
}
