// storageManager.js - LocalStorage management for exercises
class StorageManager {
  static getExerciseState(exerciseId) {
    try {
      const stored = localStorage.getItem(`exercise-${exerciseId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.warn('Error reading exercise state:', e);
      return null;
    }
  }

  // Stores raw rows instead of rendered HTML so saved state
  // stays valid if the render template changes in the future.
  static saveExerciseState(exerciseId, code, verdict, rows) {
    try {
      const state = { code, verdict, rows };
      localStorage.setItem(`exercise-${exerciseId}`, JSON.stringify(state));
    } catch (e) {
      console.warn('Error saving exercise state:', e);
    }
  }

  static clearExerciseState(exerciseId) {
    try {
      localStorage.removeItem(`exercise-${exerciseId}`);
    } catch (e) {
      console.warn('Error clearing exercise state:', e);
    }
  }

  static clearAll() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('exercise-'))
        .forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Error clearing all exercise states:', e);
    }
  }
}