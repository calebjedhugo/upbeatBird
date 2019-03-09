
/*Upbeat Bird
Copyright Caleb Hugo 2018
All rights reserved*/

//This file defines how the bird moves and is animated. It is its own module outside
//of jsx since everything is based on the dom frame rate directly.

import {soundLogic} from "./soundLogic"
import {sessionsAndMenus} from "./sessionsAndMenus";
import {soundManager} from "./soundManager";

class BirdMotion {
    constructor(){
        //get this nonesense out of the way...
        this.redefineRatios = this.redefineRatios.bind(this);
        this.updateBPM = this.updateBPM.bind(this);
        this.newBird = this.newBird.bind(this);
        this.newPost = this.newPost.bind(this);
        this.jump = this.jump.bind(this);
        window.addEventListener("keydown", this.jump);
        this.updateAnimation = this.updateAnimation.bind(this);
        this.advanceBirdFrame = this.advanceBirdFrame.bind(this);
        this.updateGoalPlacements = this.updateGoalPlacements.bind(this);
        this.updatePostGap = this.updatePostGap.bind(this);
        this.setJumpMeterDomDirection = this.setJumpMeterDomDirection.bind(this)
        this.setGameActive = this.setGameActive.bind(this);
        this.setGameJustEnded = this.setGameJustEnded.bind(this);
        this.endGame = this.endGame.bind(this);

        //Some objects we'll populate as we go and some we'll set up right here.
        this.nearestPosts = [];
        this.gameJustEnded = false;
        this.goAgainText = "Start New Game";
        this.gameActive = false;

        this.currentPos = {"cyberBird": {"top": 0, "center": {"y": 0, "x": 0}},
                                "post": {"left": 0, "right": 0},
                                "gap": {"top": 0, "bottom": 0}
                            };
    }

    setGameActive(newBool){
        this.gameActive = newBool
    }

    setGameJustEnded(newBool){
        this.gameJustEnded = newBool;
        if(newBool) this.goAgainText = "Go Again!";
    }

    newBird(){
        if(this.gameJustEnded) return;
        sessionsAndMenus.clearPosts(); //fresh start, please.
        //We need ready access to the dom elements we'll be updating with requestAnimationFrame.
        //We'll also be storing some of our own relevant properties in the objects.
        //For clarity, each of these objects have the suffix "Dom". We set these up here
        //to make sure that the elements exist before these properties are assigned.
        this.scoreDom = document.getElementById("score");
        this.jumpMeterDom = document.getElementById("jumpMeter");
        this.cyberBirdDom = document.getElementById("cyberBird");
        this.imgBirdDom = document.getElementById("imgBird");
        this.bpmDom = document.getElementById("bpm");
        this.bpmDom.min = 56

        //we will use an invisible circle for collision detection.
        let cyberBirdDom = this.cyberBirdDom;
        const ratios = this.ratios;
        cyberBirdDom.style.display = "";
        cyberBirdDom.style.left = ratios.birdStart.x + "px";
        cyberBirdDom.style.top = ratios.birdStart.y + "px";
        cyberBirdDom.style.width = ratios.birdRadius * 2 + "px";
        cyberBirdDom.style.height = ratios.birdRadius * 2 + "px";
        cyberBirdDom.style.transform = "";
        cyberBirdDom.rotation = 0;

        //initialized at not falling. Bird's y pos will be adjusted by this many pixels each frame.
        cyberBirdDom.fallingSpeed = 0;
        cyberBirdDom.firstJump = false;
        this.nearestPosts = []; //We do take care of this during endGame. This is just to be safe.

        let imgBirdDom = this.imgBirdDom
        imgBirdDom.framesPerFlap = 6 * 12;
        imgBirdDom.currentImg = 1;
        imgBirdDom.flap = true;
        imgBirdDom.flapIdx = 0;
        imgBirdDom.flapDown = true;
        //reset perfect Object
        let perfect = soundLogic.perfect;
        perfect.count = 0;
        perfect.record = [];
        perfect.postsCleared = 0;
        perfect.streak = 0;
        perfect.score = 0;

        this.scoreDom.textContent = 0;

        //This function is based on the above values so it has to go last.
        this.updateBPM();

        //reset the starting tempo and jump meter direction. bpm.current is set in bpm.update()
        let bpmDom = this.bpmDom;
        bpmDom.nextBeat = (bpmDom.current / 60) * 1000;
        bpmDom.lastTime = Date.now();
        bpmDom.fullBeat = (bpmDom.current / 60) * 1000;
        this.jumpMeterDom.direction = true;

        let highScore = document.getElementById("highScore");
        if(!sessionsAndMenus.options.practice){
            highScore.textContent = perfect.history[sessionsAndMenus.options.difficulty]["Score"][2];
        }
        else {
            highScore.textContent = "";
        }
        highScore.style.color = "";
        requestAnimationFrame(this.updateAnimation);
    }

    newPost(){
        const randomNumber = Math.random();
        const ratios = this.ratios;

        var topPost = document.createElement("div");
        topPost.placement = randomNumber
        topPost.className = "ingamePost";
        topPost.role = "topPost";
        topPost.style.left = ratios.post.left + "px";
        topPost.style.width = ratios.post.width + "px";
        topPost.style.height = ratios.post.height + "px";
        topPost.style.top = ((ratios.currentHeight - ratios.post.gap) * topPost.placement) - ratios.post.height + "px";

        var bottomPost = document.createElement("div");
        bottomPost.placement = randomNumber
        bottomPost.className = "ingamePost";
        bottomPost.role = "bottomPost";
        bottomPost.style.left = ratios.post.left + "px";
        bottomPost.style.width = ratios.post.width + "px";
        bottomPost.style.height = ratios.post.height + "px";
        bottomPost.style.top = ((ratios.currentHeight - ratios.post.gap) * bottomPost.placement) + ratios.post.gap + "px";

        //append our new charactors to the document.
        document.getElementById("inGameElements").appendChild(topPost);
        document.getElementById("inGameElements").appendChild(bottomPost);

        //set up when the next one will happen
        this.ratios.post.space.current = ((ratios.post.space.max - ratios.post.space.min) * Math.random()) + ratios.post.space.min;

        if(!this.nearestPosts[0]) this.nearestPosts = [topPost, bottomPost];
    }

    updatePostGap(currentPost){
        let currentPlacement, increment;
        let cssPos = this.cssPos;
        if(currentPost.role === "topPost"){
            if(Math.floor(cssPos(currentPost, "top")) !== Math.floor(currentPost.goalPlacement)){
                currentPlacement = cssPos(currentPost, "top");
                increment = currentPlacement > currentPost.goalPlacement ? 1 : - 1
                currentPost.style.top = cssPos(currentPost, "top") - increment + "px";
            }
        }
        else if(currentPost.role === "bottomPost"){
            if(Math.floor(cssPos(currentPost, "top")) !== Math.floor(currentPost.goalPlacement)){
                currentPlacement = cssPos(currentPost, "top");
                increment = currentPlacement > currentPost.goalPlacement ? 1 : - 1
                currentPost.style.top = cssPos(currentPost, "top") - increment + "px";
            }
        }
        else console.log("updatePostGap(currentPost) requires the property 'role' of 'currentPost'")
    }

    updateGoalPlacements(){
        var currentPost
        const ratios = this.ratios;
        ratios.post.gap = ratios.post.minGap + ((ratios.currentHeight - ratios.post.minGap) * soundLogic.perfect.gapBonus());
        for(var idx = 0; idx < document.getElementsByClassName("ingamePost").length; idx ++){
            currentPost = document.getElementsByClassName("ingamePost")[idx]
            currentPost.goalPlacement = currentPost.role === "topPost" ?
                ((ratios.currentHeight - ratios.post.gap) * currentPost.placement) - ratios.post.height :
                ((ratios.currentHeight - ratios.post.gap) * currentPost.placement) + ratios.post.gap;
        }
    }

    jump(e){
        let cyberBirdDom = this.cyberBirdDom;
        let imgBirdDom = this.imgBirdDom
        const ratios = this.ratios;
        if(e.keyCode === 32 || e.keyCode === undefined){ //undefined is for mobile.
            if(this.gameJustEnded) e.preventDefault(); //to prevent scrolling down the page!
            if(this.gameActive){
                e.preventDefault();
                soundManager.piano.play(soundLogic.birdLogic()); //add dynamic volume level, plz!.
                cyberBirdDom.fallingSpeed = ratios.jumpStrength; //this is the actual jumping part.
                if(!cyberBirdDom.firstJump) this.newPost();
                cyberBirdDom.firstJump = true;
                cyberBirdDom.jumpPrimed = true;
                imgBirdDom.flap = true;
                imgBirdDom.framesPerFlap = 2 * 12;
                imgBirdDom.flapIdx = 0;
                imgBirdDom.currentImg = 1;
                imgBirdDom.flapDown = true;
            }
        }
    }

    //soundLogic.drumLogic takes care of this since sounds are fired on the meter's
    //change of direction.
    setJumpMeterDomDirection(jumpBool){
        this.jumpMeterDom.direction = jumpBool;
    }

    updateAnimation(){
        this.gameActive = true;
        //               *****bird rules*****
        let currentPos = this.currentPos;
        let cssPos = this.cssPos;
        let cyberBirdDom = this.cyberBirdDom;
        let imgBirdDom = this.imgBirdDom;
        let bpmDom = this.bpmDom;
        let jumpMeterDom = this.jumpMeterDom;
        let scoreDom = this.scoreDom;
        let ratios = this.ratios;

        currentPos.cyberBird.top = Math.max(cssPos(cyberBirdDom, "top") + cyberBirdDom.fallingSpeed, 0); //Can't go higher than the top!
        cyberBirdDom.style.top = currentPos.cyberBird.top + "px";
        currentPos.cyberBird.center.y = cssPos(cyberBirdDom, "center.y");

        //We're floating until the first jump. Else update the falling speed.
        if(cyberBirdDom.firstJump){
            if(cyberBirdDom.fallingSpeed < ratios.maxVelocity)
                cyberBirdDom.fallingSpeed = Math.min(cyberBirdDom.fallingSpeed + ratios.gravityAccel, ratios.maxVelocity);
        }
        else{
            //This fixs a stupid stupid bug in mobile and Safari. The animation freezes
            //after a second until you add something to the dom. I don't know why, but this worked
            //and I'm really sick of debugging this glitch.
            soundLogic.perfect.fallingText("");
            imgBirdDom.flap = true; //Keeps him flappy while he floats.
            cyberBirdDom.style.left = ratios.birdStart.x + "px"; //These shouldn't have to be here.
            cyberBirdDom.style.top = ratios.birdStart.y + "px"; //I'm a little annoyed that I had to do it.
        }
        this.advanceBirdFrame();

            //               *****Perfect upbeat rules*****
        if(cyberBirdDom.jumpPrimed){
            soundLogic.perfect.subdivisions()
            cyberBirdDom.jumpPrimed = false;
            this.updateGoalPlacements();
        }

        //               *****post rules*****
        var currentPost, posts
        posts = document.getElementsByClassName("ingamePost")
        for(var idx = 0; idx < posts.length; idx ++){
            currentPost = posts[idx];
            currentPost.style.left = Number(currentPost.style.left.replace("px", "")) - ratios.post.speed + "px";
            if(Number(currentPost.style.left.replace("px", "")) + ratios.post.width <= 0){
                currentPost.parentNode.removeChild(currentPost);
                idx --;
            }
            //animate gap changes
            else this.updatePostGap(currentPost);
        }
        currentPost = document.getElementsByClassName("ingamePost")[idx - 1];//The last post that was made.
        if(currentPost){
            if(Math.abs(Number(currentPost.style.left.replace("px", "")) - ratios.currentWidth) >= ratios.post.space.current){
                //if the latest post has reached its destination toward the middle of the screen.
                this.newPost();
            }
        }

        if(this.nearestPosts[0]){ //We don't want to attempt any of this if we don't have this.nearestPosts established.
            currentPos.post.right = cssPos(this.nearestPosts[0], "right"); //update nearestPostPos
            if(currentPos.post.right < ratios.birdStart.x){ //If the nearest posts are no longer relevant, set up the new ones.
                this.nearestPosts = [document.getElementsByClassName("ingamePost")[2],
                                    document.getElementsByClassName("ingamePost")[3]];
                currentPos.post.right = cssPos(this.nearestPosts[0], "right");
                soundLogic.perfect.postsCleared ++; //Give credit for clearing the post.
                soundLogic.perfect.updateScore();
            }
            //update the post position for collision detection in postCollisionCheck() in sessionsAndMenus.js
            //currentPos.post.right is already set
            currentPos.post.left = cssPos(this.nearestPosts[0], "left");
            currentPos.gap = {"top": cssPos(this.nearestPosts[0], "bottom"),
                            "bottom": cssPos(this.nearestPosts[1], "top")}
        }

        //               *****jump meter rules*****
        if(bpmDom.nextBeat < 0){
            soundManager.piano.play(soundLogic.bassLogic());
            bpmDom.nextBeat = (60 / bpmDom.current) * 1000;
            bpmDom.fullBeat = bpmDom.nextBeat;
        }
        jumpMeterDom.lastJumpPerc = ratios.jumpPerc; //we need this for the drum logic.
        ratios.jumpPerc = Math.abs(Math.abs((bpmDom.fullBeat - bpmDom.nextBeat) - (bpmDom.fullBeat / 2)) / (bpmDom.fullBeat / 2) - 1);

        //We can now use ratios.jumpPerc for the drum sounds.
        soundLogic.drumTracking.current = soundLogic.drumLogic();
        if(soundLogic.drumTracking.current) soundManager.piano.play(soundLogic.drumTracking.current);

        ratios.jumpStrength = ratios.jumpStrengthRead * ratios.jumpPerc;
        jumpMeterDom.style.height = Math.floor(ratios.jumpPerc * ratios.jumpMeterHeight) + "px";
        //jumpMeterDom.style.top = ratios.currentHeight - jumpMeterDom.clientHeight + "px";
        bpmDom.nextBeat -= Date.now() - bpmDom.lastTime;
        bpmDom.lastTime = Date.now();

        let fallingTextArray = document.getElementsByClassName("gameFallingText");
        for(let idx = 0; idx < fallingTextArray.length; idx ++){
            fallingTextArray[idx].fallingSpeed = fallingTextArray[idx].fallingSpeed === undefined ? 0 : fallingTextArray[idx].fallingSpeed + ratios.gravityAccel;
            fallingTextArray[idx].style.top = cssPos(fallingTextArray[idx], "top") + fallingTextArray[idx].fallingSpeed + "px";
            if(cssPos(fallingTextArray[idx], "top") > ratios.currentHeight){
                //This was originally writting without jsx. It doesn't hurt to leave this in.
                fallingTextArray[idx].parentNode.removeChild(fallingTextArray[idx]);
                idx --;
            }
        }

        //animate the score to make it look more satisfying.
        if(Number(scoreDom.textContent) < soundLogic.perfect.score){
            scoreDom.textContent = Number(scoreDom.textContent) + Math.ceil((soundLogic.perfect.score - Number(scoreDom.textContent)) / 10);
        }
        //Check for game over and recursively call next frame if it's not over.
        if(!sessionsAndMenus.gameOver()) requestAnimationFrame(this.updateAnimation);
        else requestAnimationFrame(this.endGame);
    }

    endGame(){
        let posts;
        let cyberBirdDom = this.cyberBirdDom;
        const ratios = this.ratios;

        //Posts will move into the floor and ceiling and disappear.
        posts = document.getElementsByClassName("ingamePost")
        for(let idx = 0; idx < posts.length; idx ++){
            if(posts[idx].fallingSpeed) posts[idx].fallingSpeed += ratios.gravityAccel;
            else posts[idx].fallingSpeed = ratios.gravityAccel;
            if(posts[idx].role === "topPost"){
                posts[idx].style.top = this.cssPos(posts[idx], "top") - posts[idx].fallingSpeed + "px";
                if(this.cssPos(posts[idx], "top") + posts[idx].clientHeight < 0){
                    posts[idx].parentNode.removeChild(posts[idx]);
                    idx--;
                }
            }
            else{
                posts[idx].style.top = this.cssPos(posts[idx], "top") + posts[idx].fallingSpeed + "px";
                if(this.cssPos(posts[idx], "top") > ratios.currentHeight){
                    posts[idx].parentNode.removeChild(posts[idx]);
                    idx--;
                }
            }
        }
        if(cyberBirdDom.style.display !== "none"){
            if(this.cssPos(cyberBirdDom, "top") > ratios.currentHeight){
                cyberBirdDom.style.display = "none";
            }
            else{
                cyberBirdDom.rotation += 5;
                cyberBirdDom.style.transform = "rotate(" + cyberBirdDom.rotation + "deg)";
                cyberBirdDom.fallingSpeed = cyberBirdDom.fallingSpeed + ratios.gravityAccel;
                cyberBirdDom.style.top = this.cssPos(cyberBirdDom, "top") + cyberBirdDom.fallingSpeed + "px";
            }
        }

        var fallingTextNodes = document.getElementsByClassName("gameFallingText")
        for(let idx = 0; idx < fallingTextNodes.length; idx ++){
            fallingTextNodes[idx].style.top = this.cssPos(fallingTextNodes[idx], "top") + fallingTextNodes[idx].fallingSpeed + "px";
            fallingTextNodes[idx].fallingSpeed += ratios.gravityAccel;
            if(this.cssPos(fallingTextNodes[idx], "top") > ratios.currentHeight){
                fallingTextNodes[idx].parentNode.removeChild(fallingTextNodes[idx])
                idx--;
            }
        }

        if(cyberBirdDom.style.display !== "none" || posts[0] || fallingTextNodes[0]) requestAnimationFrame(this.endGame);
        else{
            this.nearestPosts = [];
            setTimeout(function(){this.gameJustEnded = false}.bind(this), 500);
        }
    }

    advanceBirdFrame(){
        let imgBirdDom = this.imgBirdDom;
        if(imgBirdDom.flap === true){
            imgBirdDom.flapIdx ++;
            if(imgBirdDom.flapIdx % Math.floor(imgBirdDom.framesPerFlap/12) === 0){
                if(imgBirdDom.flapDown) imgBirdDom.currentImg ++;
                else imgBirdDom.currentImg --;
                let imgWidth = imgBirdDom.clientWidth;
                imgBirdDom.style.backgroundPosition = (-imgWidth / 7) * (imgBirdDom.currentImg - 2) + "px 0px";
                if(imgBirdDom.currentImg === 8) imgBirdDom.flapDown = false;
                if(imgBirdDom.currentImg === 1) imgBirdDom.flapDown = true;
            }
            if(imgBirdDom.flapIdx >= imgBirdDom.framesPerFlap){
                imgBirdDom.flap = false;
                imgBirdDom.flapIdx = 0;
                imgBirdDom.currentImg = 2;
                imgBirdDom.flapDown = true;
            }
        }
    }

    //returns the position of an element.
    cssPos(elementNode, attribute){
        if(!elementNode) return;
        switch(attribute){
            case "top": return Number(elementNode.style.top.replace("px", ""));
            case "left": return Number(elementNode.style.left.replace("px", ""));
            case "bottom": return Number(elementNode.style.top.replace("px", "")) + elementNode.clientHeight;
            case "right": return Number(elementNode.style.left.replace("px", "")) + elementNode.clientWidth;
            case "center.x": return Number(elementNode.style.left.replace("px", "")) + (elementNode.clientWidth/2);
            case "center.y": return Number(elementNode.style.top.replace("px", "")) + (elementNode.clientHeight/2);
            case "height": return Number(elementNode.style.height.replace("px", ""));
            case "width": return Number(elementNode.style.height.replace("px", ""));
            default: console.log("Please add \"" + attribute + "\"to cssPos.")
        }
    }

    updateBPM = function(){
        let bpmDom = this.bpmDom;
        let newBPM = this.bpmDom.min + Math.floor((soundLogic.perfect.count * (soundLogic.perfect.postsCleared / 3)) / 10)
        bpmDom.textContent = newBPM;
        bpmDom.current = newBPM;
    }

    redefineRatios(currentHeight, currentWidth){ //called from main app on initialization and resizing.
        this.ratios = {currentHeight: currentHeight,
            currentWidth: currentWidth,
            birdStart:
            {x: currentWidth / 8,
                y: currentHeight / 3},
                birdRadius: currentWidth / 27,
                gravityAccel: currentHeight / 1100, //added to falling speed each frame if game has started.
                maxVelocity: currentHeight / 32,
                jumpStrength: 0, //cyberBird.fallingSpeed is hard set to this amount in jump(). A different value is set each frame
                jumpStrengthRead: - currentHeight / 34, //The strength of a max jump.
                jumpPerc: 1,
                jumpMeterHeight: currentHeight / 3,
                post:
                {gap: currentHeight / 2.75,
                    minGap: currentHeight / 2.75,
                    width: currentWidth / 30,
                    height: currentHeight * 0.75,
                    left: currentWidth,
                    speed: currentWidth / 250,
                    space: {min: currentWidth * 0.75,
                        max: currentWidth * 0.66,
                        current: 0}
                },
                perfectFontSize: currentHeight / 24, //text produced in game
                dataFontSize: currentHeight / 41, //BMP, score, ect.
                beefBorder: currentHeight / 112,
                leanBorder: currentHeight / 200,
                titleFontSize: currentHeight / 12,
                cyberBirdClip: currentWidth * .12
            };
    }
}
export var birdMotion = new BirdMotion();
