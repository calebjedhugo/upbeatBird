/*Upbeat Bird
Copyright Caleb Hugo 2018
All rights reserved*/

//This file handles game endings, beginings, and menu elements. App.js calls to
//here when a change is made by the player that requires a change in the game's
//behavior.
import {storage} from "./storage";
import {soundLogic} from "./soundLogic";
import {birdMotion} from "./birdMotion";

class SessionsAndMenus{
    constructor(){
        //lets get this nonsense out of the way...
        this.setOptions = this.setOptions.bind(this);
        this.gameOver = this.gameOver.bind(this);
        this.postCollisionCheck = this.postCollisionCheck.bind(this);
        this.collision = this.collision.bind(this);
        this.clearPosts = this.clearPosts.bind(this);
        //defines what jump perc the player can be off by.
        this.perfectRanges = {
            "easy": 0.07,
            "normal": 0.05,
            "hard": 0.03,
        }
        //This is the source of truth for a perfect upbeat.
        this.perfectSubdivisions = {
            "straight": [0.5, 0.99, 0.5],
            "triplets": [2/3, 1/3],
            "swing": [2/3, 0.99, 1/3]
        }
        //This is how far back we go in perfect.record to calculate ratios.post.gap
        this.perfectMemoryDepth = {
            "easy": 29,
            "normal": 19,
            "hard": 9,
        }

        //I chose to do this instead of messing with classNames. I'm not the best
        //at css, and I didn't see any bennefit in defining this there. This seemed simpler.
        this.outsideCSS = {
            hitPostColor: "red",
            practiceColor: {"true": "lightgreen", "false": ""},
            selectedDifficulty: "lightGreen",
            unselectedDifficulty: "",
            nightTitle: "lightblue",
            dayTitle: ""
        }

        this.options = {difficulty: "",
                        mode: "",
                        practice: ""}
    }

    //App.js passes in an object much like it does with setState. But just one at a time is needed.
    setOptions(changeObject){
        let optionsProperty = Object.keys(changeObject)[0];
        this.options[optionsProperty] = changeObject[optionsProperty];
    }

    //               *****Game Over and Collision Detection*****
    gameOver(){
        if(this.postCollisionCheck() || birdMotion.cssPos(birdMotion.cyberBirdDom, "top") > birdMotion.ratios.currentHeight){
            let highScore = soundLogic.perfect.history[sessionsAndMenus.options.difficulty]["Score"][2];
            birdMotion.setGameActive(false);
            birdMotion.setGameJustEnded(true);
            setTimeout(function(){birdMotion.setGameJustEnded(false);}, 1000);
            if(!this.options.practice){
                if(highScore < soundLogic.perfect.score){
                    highScore = soundLogic.perfect.score;

                    //set the new record in browser history
                    storage.setHighScore(soundLogic.perfect.highScore);
                }
                //only do this stuff if we're not practicing
                soundLogic.perfect.updateHistory();
                storage.setHistory(soundLogic.perfect.history);
            }
            //This is a copy of the method in the GameWindowMain class. It is not defined in this file. :D
            this.switchScreen("stats");
        }
        return !birdMotion.gameActive; //Returning opposite to avoid confusion since the game's not over.
    }

    postCollisionCheck(){
        let currentPos = birdMotion.currentPos;
        if(!birdMotion.nearestPosts[0]) return false; //No post? Don't care.
        if(currentPos.post.left <= birdMotion.ratios.birdStart.x + (birdMotion.ratios.birdRadius * 2)){
            //We only care about any of this is the bird shares the x with the currentPosts.
            if(currentPos.cyberBird.center.y > currentPos.gap.top && currentPos.cyberBird.center.y < currentPos.gap.bottom){
                //Is the distance from cyberBirdDom.center to the post corners less than the cyberBirdDom radius?
                if(Math.min(Math.hypot(currentPos.cyberBird.center, {x: currentPos.post.left, y: currentPos.gap.top}),
                        Math.hypot(currentPos.cyberBird.center, {x: currentPos.post.right, y: currentPos.gap.top}),
                        Math.hypot(currentPos.cyberBird.center, {x: currentPos.post.left, y: currentPos.gap.bottom}),
                        Math.hypot(currentPos.cyberBird.center, {x: currentPos.post.right, y: currentPos.gap.bottom}))
                        < birdMotion.ratios.birdRadius) return this.collision()
            }
            else return this.collision()
        }
        return false;
    }

    collision(){
        let currentPos = birdMotion.currentPos;
        let outsideCSS = this.outsideCSS;
        let nearestPosts = birdMotion.nearestPosts;
        if(!this.options.practice) return true;
        else {
            if(currentPos.cyberBird.center.y < currentPos.gap.top)
                nearestPosts[0].style.backgroundColor = outsideCSS.hitPostColor;
            else
                nearestPosts[1].style.backgroundColor = outsideCSS.hitPostColor;
            return false;
        }
    }

    clearPosts(){
        for(var idx = 0; idx < document.getElementsByClassName("ingamePost").length; idx ++){
            document.getElementsByClassName("ingamePost")[idx].parentNode.removeChild(document.getElementsByClassName("ingamePost")[idx]);
            idx --;
        }
    }

    // vectorDistances(vector1, vector2){
    //     return Math.sqrt(Math.pow(Math.abs(vector1.x - vector2.x), 2) + Math.pow(Math.abs(vector1.y - vector2.y), 2))
    // }
}
export var sessionsAndMenus = new SessionsAndMenus();
