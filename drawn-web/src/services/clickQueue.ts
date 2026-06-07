let _pendingCount = 0;

export function getPendingCount(): number {
  return _pendingCount;
}

export function startQueueListener(onUpdate: () => void): () => void {
  // Ask SW for current count on init
  navigator.serviceWorker?.controller?.postMessage({ type: 'GET_COUNT' });

  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'PENDING_COUNT') {
      _pendingCount = event.data.count;
      onUpdate();
    }
  };

  navigator.serviceWorker?.addEventListener('message', handler);
  return () => navigator.serviceWorker?.removeEventListener('message', handler);
}
