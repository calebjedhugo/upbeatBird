window.fakeStorage = {
    _data: {},

    setItem: function (id, val) {
        return this._data[id] = String(val);
    },

    getItem: function (id) {
        return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
    },

    removeItem: function (id) {
        return delete this._data[id];
    },

    clear: function () {
        return this._data = {};
    }
};

class LocalStorageManager {
  constructor() {
    this.highScoresKey          = "highScore";
    this.difficultyKey          = "difficulty"
    this.practiceMode           = "practice";
    this.historyKey             = "history";
    this.modeKey                = "mode";
    var supported = this.localStorageSupported();
    this.storage = supported ? window.localStorage : window.fakeStorage;
  }

  localStorageSupported(){
    var testKey = "test";
    var storage = window.localStorage;
    try {
        storage.setItem(testKey, "1");
        storage.removeItem(testKey);
        return true;
    } catch (error) {
        return false;
    }
  }

  //Setters and getters
  setHighScore(highScore) {
    this.storage.setItem(this.highScoresKey, JSON.stringify(highScore));
  }

  getHighScore() {
    var stateJSON = this.storage.getItem(this.highScoresKey);
    return stateJSON ? JSON.parse(stateJSON) : {};
  }

  setDifficulty (difficulty){
      this.storage.setItem(this.difficultyKey, JSON.stringify(difficulty));
  }

  getDifficulty () {
      var stateJSON = this.storage.getItem(this.difficultyKey);
      return stateJSON ? JSON.parse(stateJSON) : {};
  };

  setPractice (practice){
      this.storage.setItem(this.practiceMode, JSON.stringify(practice));
  }

  getPractice () {
      var stateJSON = this.storage.getItem(this.practiceMode);
      return stateJSON ? JSON.parse(stateJSON) : {};
  };

  setHistory (history){
      this.storage.setItem(this.historyKey, JSON.stringify(history));
  }

  getHistory () {
      var stateJSON = this.storage.getItem(this.historyKey);
      return stateJSON ? JSON.parse(stateJSON) : {};
  };

  setMode (mode){
      this.storage.setItem(this.modeKey, JSON.stringify(mode));
  }

  getMode () {
      var stateJSON = this.storage.getItem(this.modeKey);
      return stateJSON ? JSON.parse(stateJSON) : {};
  };
}

export var storage = new LocalStorageManager();
