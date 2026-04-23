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

  static saveExerciseState(exerciseId, code, verdict, resultHTML) {
    try {
      const state = {
        code,
        verdict,
        resultHTML,
        savedAt: new Date().toISOString()
      };
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
}