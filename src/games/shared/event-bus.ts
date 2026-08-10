import type { GameEventMap } from "@/types/game";

type Listener<K extends keyof GameEventMap> = (payload: GameEventMap[K]) => void;

export class EventBus {
  private listeners = new Map<keyof GameEventMap, Set<Listener<keyof GameEventMap>>>();

  on<K extends keyof GameEventMap>(event: K, listener: Listener<K>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as Listener<keyof GameEventMap>);
    return () => this.off(event, listener);
  }

  off<K extends keyof GameEventMap>(event: K, listener: Listener<K>): void {
    this.listeners.get(event)?.delete(listener as Listener<keyof GameEventMap>);
  }

  emit<K extends keyof GameEventMap>(event: K, payload: GameEventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) {
      (listener as Listener<K>)(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
