import {sessionsAndMenus} from "./sessionsAndMenus";
import {birdMotion} from './birdMotion';
import {storage} from "./storage";

class SoundLogic{
    constructor(){
        //get this nonsense out of the way
        this.bassLogic = this.bassLogic.bind(this);
        this.birdLogic = this.birdLogic.bind(this);
        this.drumLogic = this.drumLogic.bind(this);

        //Initialize some properties.
        this.bassNote = 5;
        this.birdNote = 6;
        this.modes = {"ionian": 0, "dorian": 1,"phygian": 2, "lydian": 3,
                    "mixolydian": 4, "aeolian": 5, "locian": 6};
        this.currentMode = this.randomKey(this.modes);
        this.offset = this.modes[this.currentMode];
        this.drumTracking = {drum16thbeat: true,
                            drumdownbeat: true,
                            drumupbeat: true}

        if(storage.getHistory()["normal"]){ //This will return undefined the first time.
            this.perfect.history = storage.getHistory()
        }
    }
    //6 starts ionian
    bassLogic(){
        //translate the last not played to a scale degree
        let bassNote = this.bassNote;
        let currentScaleDegree = ((bassNote + 1 + this.offset)  % 7) + 1
        let newScaleDegree;
        let randomItem = this.randomItem;
        switch(currentScaleDegree){
            case 1:
                newScaleDegree = randomItem([1,2,3,4,5,6,7]);
                break;
            case 2:
                newScaleDegree = randomItem([4,5,6]);
                break;
            case 3:
                newScaleDegree = randomItem([1,5,7]);
                break;
            case 4:
                newScaleDegree = randomItem([2,5,6]);
                break;
            case 5:
                newScaleDegree = randomItem([1,7,2]);
                break;
            case 6:
                newScaleDegree = randomItem([1,2,3,4,5,7]);
                break;
            case 7:
                newScaleDegree = randomItem([1,2,5,6]);
                break;
            default:
                newScaleDegree = randomItem([1,2,3,4,5,6,7]);
                break;
        }

        var changeAmounts = [newScaleDegree - currentScaleDegree,
                            newScaleDegree - currentScaleDegree + 7,
                            newScaleDegree - currentScaleDegree - 7];
        var finalAmount

        //find the shortest distance without simply making the number positive!
        //(I bet there's a better way to do this, I'm just not seeing it right now)
        if(Math.min(Math.abs(changeAmounts[0]), Math.abs(changeAmounts[1])) === Math.abs(changeAmounts[0]))
            finalAmount = changeAmounts[0]
        else
            finalAmount = changeAmounts[1]

        if(Math.min(Math.abs(finalAmount), Math.abs(changeAmounts[2])) === Math.abs(changeAmounts[2]))
            finalAmount = changeAmounts[2];

        bassNote += finalAmount;

        //make sure we're within the range of the instrument.
        if(bassNote < 1) bassNote += randomItem([7,14]);
        else if(bassNote > 21) bassNote -= randomItem([7,14]);
        return "bass" + bassNote;
    }

    birdLogic(){
        let birdNote = this.birdNote;
        birdNote += this.randomItem([-2, -1, 0, 1, 2])

        if(birdNote < 1) birdNote += this.randomItem([2,3,4]);
        else if(birdNote > 12) birdNote -= this.randomItem([2,3,4]);
        return "bird" + birdNote;
    }

    drumLogic(){
        let ratios = birdMotion.ratios;
        let drumTracking = this.drumTracking;
        let jumpMeterDom = birdMotion.jumpMeterDom;
        switch(sessionsAndMenus.options.mode){
            case "straight":
                if(ratios.jumpPerc >= 0.5 && drumTracking.drum16thbeat){
                    drumTracking.drum16thbeat = false;
                    return "drum16thbeat";
                }
                else if(ratios.jumpPerc <= 0.5 && !drumTracking.drum16thbeat){
                    drumTracking.drum16thbeat = true;
                    return "drum16thbeat";
                }
                break;
            case "triplets":
                if(ratios.jumpPerc >= 2/3 && drumTracking.drum16thbeat){
                    drumTracking.drum16thbeat = false;
                    return "drumupbeat";
                }
                else if(ratios.jumpPerc <= 2/3 && !drumTracking.drum16thbeat){
                    drumTracking.drum16thbeat = true;
                    return "drum16thbeat";
                }
                break;
            case "swing":
                if(ratios.jumpPerc >= 2/3 && drumTracking.drum16thbeat){
                    drumTracking.drum16thbeat = false;
                    return "drumupbeat";
                }
                else if(ratios.jumpPerc <= 1/3 && !drumTracking.drum16thbeat){
                    drumTracking.drum16thbeat = true;
                    return "drum16thbeat";
                }
                break;
            default:
                console.log("\"" + sessionsAndMenus.options.mode + "\" is not a valid option." )
        }
        if(ratios.jumpPerc > jumpMeterDom.lastJumpPerc && !jumpMeterDom.direction){ //Then we are at the bottom
            birdMotion.setJumpMeterDomDirection(true);
            return "drumdownbeat"; //no exceptions
        }
        if(ratios.jumpPerc < jumpMeterDom.lastJumpPerc && jumpMeterDom.direction){
            //Then we are at the top
            birdMotion.setJumpMeterDomDirection(false)
            if(sessionsAndMenus.options.mode !== "triplets") return "drumupbeat"; //only exception
        }
    }

    perfect = {
        upbeat: function(){
            this.count ++;
            this.record.push(1);
            this.updateStreak();
            birdMotion.updateBPM();
            this.fallingText("Perfect Upbeat" + this.getSuffix());
        },
        sixteenthBeat: function(){
            this.count ++;
            this.record.push(1);
            this.updateStreak();
            birdMotion.updateBPM();
            this.fallingText("Perfect 16<sup>th</sup> beat" + this.getSuffix());
        },
        triplet: function(){
            this.count ++;
            this.record.push(1);
            this.updateStreak();
            birdMotion.updateBPM();
            this.fallingText("Perfect triplet" + this.getSuffix());
        },
        not: function(){
            this.record.push(0);
            this.streak = 0;
            birdMotion.updateBPM();
        },
        fallingText(someHTML){
            var fallingText = document.createElement("div");
            fallingText.innerHTML = someHTML;
            fallingText.className = "gameFallingText";
            fallingText.style.fontSize = birdMotion.ratios.perfectFontSize + "px";
            fallingText.style.top = birdMotion.cyberBirdDom.style.top;
            fallingText.style.left = birdMotion.cyberBirdDom.style.left;
            document.getElementById("gameWindow").appendChild(fallingText);
        },
        subdivisions: function(){
            let options = sessionsAndMenus.options;
            let ranges = sessionsAndMenus.perfectRanges;
            const highRange = birdMotion.ratios.jumpPerc + ranges[options.difficulty];
            const lowRange = birdMotion.ratios.jumpPerc - ranges[options.difficulty];
            switch(options.mode){
                case "straight":
                    if((highRange >= .5 && lowRange <= .5))
                        this.sixteenthBeat();
                    else if(highRange >= .99)
                        this.upbeat();
                    else
                        this.not();
                    break;
                case "triplets":
                    if(highRange >= 2/3 && lowRange <= 2/3)
                        this.triplet();
                    else
                        this.not();
                    break;
                case "swing":
                    let jumpMeterDom = birdMotion.jumpMeterDom;
                    if((highRange >= 2/3 && lowRange <= 2/3 && jumpMeterDom.direction) ||
                        (highRange >= 1/3 && lowRange <= 1/3 && !jumpMeterDom.direction))
                        this.sixteenthBeat();
                    else if(highRange >= .99)
                        this.upbeat();
                    else
                        this.not();
                    break;
                default:
                    console.log("\"" + options.mode + "\" is not a valid option." )
            }
        },
        updateScore: function(){
            let options = sessionsAndMenus.options;
            let highScore = this.history[options.difficulty]["Score"][2];
            this.score = Math.ceil(this.postsCleared * this.count * this.longestStreak);
            if(this.score > highScore && !options.practice){
                document.getElementById("scoreLabel2").className = "newHighScore";
                document.getElementById("highScore").textContent = highScore;
            }
        },
        updateStreak: function(){
            this.streak ++;
            if(this.streak > this.longestStreak){
                this.longestStreak = this.streak;
            }
        },
        getSuffix: function(){
            if(this.streak > 1) return " x" + this.streak;
            else return "";
        },
        count: 0,
        record: [],
        gapBonus: function(){
            let options = sessionsAndMenus.options;
            var numerator = 0, denomonator = Math.min(sessionsAndMenus.perfectMemoryDepth[options.difficulty], this.record.length - 1);
            for(var idx = denomonator; idx >= 0; idx --){
                numerator += this.record[this.record.length - idx - 1];
            }
            return Math.min(numerator/Math.max(denomonator, 1), .95);
        },
        postsCleared: 0,
        streak: 0,
        longestStreak: 0,
        score: 0,
        history: {easy: {"Perfect Upbeats": [0,0,0],
                        "Posts Cleared": [0,0,0],
                        "Max BPM": [0,0,0],
                        "Score": [0,0,0],
                        "Best Streak": [0,0,0]},
                normal: {"Perfect Upbeats": [0,0,0],
                    "Posts Cleared": [0,0,0],
                    "Max BPM": [0,0,0],
                    "Score": [0,0,0],
                    "Best Streak": [0,0,0]},
                hard: {"Perfect Upbeats": [0,0,0],
                        "Posts Cleared": [0,0,0],
                        "Max BPM": [0,0,0],
                        "Score": [0,0,0],
                        "Best Streak": [0,0,0]}
                },
        updateHistory: function(){
            let options = sessionsAndMenus.options;

            //update last game column
            var col = 1;
            this.history[options.difficulty]["Perfect Upbeats"][col] = this.history[options.difficulty]["Perfect Upbeats"][col - 1];
            this.history[options.difficulty]["Posts Cleared"][col] = this.history[options.difficulty]["Posts Cleared"][col - 1];
            this.history[options.difficulty]["Max BPM"][col] = this.history[options.difficulty]["Max BPM"][col - 1];
            this.history[options.difficulty]["Score"][col] = this.history[options.difficulty]["Score"][col - 1];
            this.history[options.difficulty]["Best Streak"][col] = this.history[options.difficulty]["Best Streak"][col - 1];

            col = 0;
            this.history[options.difficulty]["Perfect Upbeats"][col] = this.count;
            this.history[options.difficulty]["Posts Cleared"][col] = this.postsCleared;
            this.history[options.difficulty]["Max BPM"][col] = birdMotion.bpmDom.current;
            this.history[options.difficulty]["Score"][col] = this.score;
            this.history[options.difficulty]["Best Streak"][col] = this.longestStreak;

            //update best column
            col = 2;
            this.history[options.difficulty]["Perfect Upbeats"][col] = Math.max(this.count, this.history[options.difficulty]["Perfect Upbeats"][col]);
            this.history[options.difficulty]["Posts Cleared"][col] = Math.max(this.postsCleared, this.history[options.difficulty]["Posts Cleared"][col]);
            this.history[options.difficulty]["Max BPM"][col] = Math.max(birdMotion.bpmDom.current, this.history[options.difficulty]["Max BPM"][col]);
            this.history[options.difficulty]["Score"][col] = Math.max(this.score, this.history[options.difficulty]["Score"][col]);
            this.history[options.difficulty]["Best Streak"][col] = Math.max(this.longestStreak, this.history[options.difficulty]["Best Streak"][col]);
        }
    }

    randomIdx(theArray){
        return Math.floor(theArray.length * Math.random());
    }

    randomKey(theObject){
        return Object.keys(theObject)[Math.floor(Object.keys(theObject).length * Math.random())];
    }

    randomItem(theObject){
        return theObject[Math.floor(Object.keys(theObject).length * Math.random())];
    }
}
export var soundLogic = new SoundLogic();
