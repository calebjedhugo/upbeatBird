import React, { Component } from 'react';
import {sessionsAndMenus} from "./sessionsAndMenus";
import {soundLogic} from "./soundLogic";
import {birdMotion} from "./birdMotion";
import {storage} from "./storage";
import {throttle} from 'lodash';
import {soundManager} from './soundManager';

class App extends Component {
    render() {
        return (<GameWindowMain />)
    }
}

class GameWindowMain extends Component{
    constructor(props){
        super(props);
        this.backgroundImgPath = "https://calebhugo.com/upbeatBird/images/"
        birdMotion.redefineRatios(this.mobiVariants.currentHeight, this.mobiVariants.currentWidth);
        this.updatePos = this.updatePos.bind(this);
        this.setMode = this.setMode.bind(this);
        this.togglePractice = throttle(this.togglePractice.bind(this), 550);
        this.setDifficulty = throttle(this.setDifficulty.bind(this), 550);
        this.switchScreen = this.switchScreen.bind(this);
        sessionsAndMenus.switchScreen = this.switchScreen;
        this.toggleStats = throttle(this.toggleStats.bind(this), 550);
        window.addEventListener('resize', this.updatePos);
        window.addEventListener("orientationchange", this.updatePos);
        //figure out what intiaized selections are.
        let mode = typeof storage.getMode() === "string" ? storage.getMode() : "straight"
        sessionsAndMenus.setOptions({mode: mode}); //telling the game. We tell the menu it this.state.
        let difficulty = typeof storage.getDifficulty() === "string" ? storage.getDifficulty() : "easy";
        sessionsAndMenus.setOptions({difficulty: difficulty}); //telling the game. We tell the menu it this.state.
        this.practice = typeof storage.getPractice() === "boolean" ? storage.getPractice() : false;
        sessionsAndMenus.setOptions({practice: this.practice}); //telling the game. We tell the menu it this.state.

        let ratios = birdMotion.ratios;
        this.state = {backgroundColor: sessionsAndMenus.outsideCSS.unselectedDifficulty,
                        gameWindowHeightWBorder: ratios.currentHeight + (this.mobiVariants.borderWidth * 2) + "px",
                        gameWindowWidthWBorder: ratios.currentWidth + (this.mobiVariants.borderWidth * 2) + "px",
                        gameWindowHeight: ratios.currentHeight + "px",
                        gameWindowWidth: ratios.currentWidth + "px",
                        menuFontSize: ratios.perfectFontSize + "px",
                        tableFontSize: ratios.perfectFontSize * 0.65 + "px",
                        titleFontSize: ratios.titleFontSize + "px",
                        leanBorderWidth: ratios.leanBorder + "px",
                        beefBorderWidth: ratios.beefBorder + "px",
                        birdDiameter: (ratios.birdRadius * 2) + "px",
                        cyberBirdClip: "rect(" + -ratios.cyberBirdClip + "px " +
                            ratios.cyberBirdClip + "px " +
                            ratios.cyberBirdClip + "px " +
                            -ratios.cyberBirdClip + "px)",
                        mainMenuDisplay: "", mainMenuOpacity: "1",
                        statsMenuDisplay: "none", statsMenuOpacity: "0",
                        inGameDisplay: "none", inGameOpacity: "0", mode: mode,
                        practice: this.practice, difficulty: difficulty,
                        beginNewGameButtonText: "Start New Game",
                        highScoreLabelText: "High Score: ",
                        backgroundImage: "url(\"" + this.getBackgroundAndTitleColor[0] + "\")",
                        titleColor: this.getBackgroundAndTitleColor[1]
                    }
        this.switchScreenTimeout = undefined;
        this.waitCount = 0;
    }

    //A bit of a border looks nice on a desktop, and we don't want it to fill the screen.
    //But mobile will be launched from a landing page and will need to fill the whole screen.
    get mobiVariants(){
        let mobi = /Mobi/.test(navigator.userAgent);
        let gameWindowWidthPerc = 0.75;
        if(mobi){
            gameWindowWidthPerc = Math.min(window.innerWidth/window.innerHeight, 0.75)
            return {jumpMeterBottom: "0",
                    top: "0px",
                    currentWidth: window.innerHeight * gameWindowWidthPerc,
                    currentHeight: window.innerHeight,
                    borderWidth: 0}
        }
        else {
            return {jumpMeterBottom: "3px",
                    top: "",
                    currentWidth: window.innerHeight * gameWindowWidthPerc * 0.85,
                    currentHeight: window.innerHeight * .85,
                    borderWidth: 3}
        }
    }

    preventDefault(e){e.preventDefault()}

    setDifficulty(newDifficulty){
        //Setting practice mode is here so that we can throttle it with difficulty.
        //The user clicking through too quickly was causing the css transition to skip.
        if(newDifficulty === 'practice'){
            this.togglePractice();
        }
        else{
            this.setState({difficulty: newDifficulty}); //tell the display
            sessionsAndMenus.setOptions({difficulty: newDifficulty}); //tell the game
            storage.setDifficulty(newDifficulty); //tell storage
        }
        //here we use the current difficulty from sessionsAndMenus in case "practice" was passed in.
        this.backgroundAndTitleColor();
    }

    togglePractice(){
        let practice = !this.practice; //using the non-visual version for reliability.
        this.practice = practice; //update the reliable version.
        this.setState({practice: practice,
                        highScoreLabelText: practice ? "Practice Mode" : "High Score: "}); //tell the display
        sessionsAndMenus.setOptions({practice: practice}); //tell the game
        storage.setPractice(practice); //tell storage
    }

    toggleStats(){
        let difficultyArray = ["easy", "normal", "hard"], newIdx;
        newIdx = (difficultyArray.indexOf(this.state.difficulty) + 1) % difficultyArray.length;
        let newDifficulty = difficultyArray[newIdx]
        this.setState({difficulty: newDifficulty});
        sessionsAndMenus.setOptions({difficulty: newDifficulty}); //tell the game
        storage.setDifficulty(newDifficulty);
        this.backgroundAndTitleColor() //tell the background
    }

    setMode(newMode){
        this.setState({mode: newMode}); //tell the display
        sessionsAndMenus.setOptions({mode: newMode}); //tell the game
        storage.setMode(newMode); //tell storage
    }

    updatePos(){
        //Define the gameWindow's dimensions and prepare ingame proportions.
        //All proportions are based on the game window, so we call this now:
        birdMotion.redefineRatios(this.mobiVariants.currentHeight, this.mobiVariants.currentWidth);
        let ratios = birdMotion.ratios;
        this.setState({gameWindowHeightWBorder: ratios.currentHeight + (this.mobiVariants.borderWidth * 2) + "px",
                        gameWindowWidthWBorder: ratios.currentWidth + (this.mobiVariants.borderWidth * 2) + "px",
                        gameWindowHeight: ratios.currentHeight + "px",
                        gameWindowWidth: ratios.currentWidth + "px",
                        menuFontSize: ratios.perfectFontSize + "px",
                        tableFontSize: ratios.perfectFontSize * 0.65 + "px",
                        titleFontSize: ratios.titleFontSize + "px",
                        leanBorderWidth: ratios.leanBorder + "px",
                        beefBorderWidth: ratios.beefBorder + "px",
                        dataFontSize: ratios.dataFontSize + "px",
                        birdDiameter: (ratios.birdRadius * 2) + "px",
                        cyberBirdClip: "rect(" + -ratios.cyberBirdClip + "px " +
                            ratios.cyberBirdClip + "px " +
                            ratios.cyberBirdClip + "px " +
                            -ratios.cyberBirdClip + "px)"
                        })
    }

    get getBackgroundAndTitleColor(){ //returning titleColor as well since they're tied together.
        let newImgPath, newTitleColor
        if(this.practice){
            newImgPath = this.backgroundImgPath + "sunrise.JPG";
            newTitleColor = sessionsAndMenus.outsideCSS.dayTitle;
        }
        else {
            switch(sessionsAndMenus.options.difficulty){
                case "easy":
                    newImgPath = this.backgroundImgPath + "daytime.JPG";
                    newTitleColor = sessionsAndMenus.outsideCSS.dayTitle;
                    break;
                case "normal":
                    newImgPath = this.backgroundImgPath + "sunset.JPG";
                    newTitleColor = sessionsAndMenus.outsideCSS.dayTitle;
                    break;
                case "hard":
                    newImgPath = this.backgroundImgPath + "nighttime.JPG";
                    newTitleColor = sessionsAndMenus.outsideCSS.nightTitle;
                    break;
                default: return console.log(sessionsAndMenus.options.difficulty + " is not a valid difficulty.");
            }
        }
        return [newImgPath, newTitleColor]
    }

    backgroundAndTitleColor(){
        let difficulty = sessionsAndMenus.options.difficulty;
        let theArray = this.getBackgroundAndTitleColor;
        document.getElementById("preloadImg").src = theArray[0]
        document.getElementById("preloadImg").onload = function(){
            this.setState({backgroundImage: "url(\"" + theArray[0] + "\")"});
            this.setState({titleColor: theArray[1]});
        }.bind(this, theArray);
    }

    get tryAgainText(){
        if(this.state.practice) return "Start a Non-Practice Round";
        else return birdMotion.goAgainText;
    }

    switchScreen(menuOrInGame){
        /*In each case, we set the style to "" and then trigger the opacity to
        get the fade transition to work. We have to set display to "" after
        the transition is complete to avoid invisible elements covering visible ones.*/
        const displayNoneTime = 1000;
        clearTimeout(this.switchScreenTimeout);
        switch(menuOrInGame){
            case "menu":{
                this.setState({mainMenuDisplay: ""});
                setTimeout(function(){
                    this.setState({mainMenuOpacity: "1"})
                }.bind(this), 100)

                this.setState({inGameOpacity: "0"});
                this.setState({statsMenuOpacity: "0"})
                this.switchScreenTimeout = setTimeout(function(){
                    this.setState({statsMenuDisplay: "none"});
                    this.setState({inGameDisplay: "none"})
                }.bind(this), displayNoneTime);
                this.setState({beginNewGameButtonText: "Start New Game"}) //soundManager.js (loadPiano()) may have changed this.
                break;
            }
            case "inGame":{
                //soundManager.piano will return undefined if the sounds aren't ready yet.
                clearTimeout(this.waitTimeout);
                if(soundManager.piano){
                    //Being an element modified by the game, this cannont be reset with jsx.
                    document.getElementById("scoreLabel2").className = "";
                    this.setState({inGameDisplay: ""})
                    setTimeout(function(){
                        this.setState({inGameOpacity: "1"})
                    }.bind(this), 100)

                    this.setState({mainMenuOpacity: "0"});
                    this.setState({statsMenuOpacity: "0"});
                    this.switchScreenTimeout = setTimeout(function(){
                        this.setState({mainMenuDisplay: "none",
                                        statsMenuDisplay: "none"});
                        this.updatePos();
                    }.bind(this), displayNoneTime);
                    this.gamePending = true;
                }
                else{
                    this.waitCount ++;
                    if(this.waitCount <= 10){
                        this.waitTimeout = setTimeout(() => this.switchScreen("inGame"), 1000)
                        this.setState({beginNewGameButtonText: "Loading Sounds..."})
                    }
                    else{
                        this.setState({beginNewGameButtonText: "Check connection and try again..."});
                        setTimeout(() => this.setState({beginNewGameButtonText: "Start New Game"}), 5000);
                        this.waitCount = 0;
                    }
                }
                break;
            }
            case "stats":{
                this.setState({statsMenuDisplay: ""});
                setTimeout(function(){
                    this.setState({statsMenuOpacity: "1"});
                }.bind(this), 100)

                //this.setState({inGameOpacity: "0"})
                this.setState({mainMenuOpacity: "0"});
                this.switchScreenTimeout = setTimeout(function(){
                    this.setState({mainMenuDisplay: "none"});
                    //this.setState({inGameDisplay: "none"})
                }.bind(this), displayNoneTime);
                break;
            }
            default: console.log(menuOrInGame + " is not a valid screen.")
        }
        this.updatePos();
    }

    componentDidUpdate(){
        soundManager.verifySoundUnlocked();
        if(this.gamePending){
            birdMotion.newBird();
        }
        this.gamePending = false;
    }

    render() {
        //main elements
        const gameWindowHeightWBorder = this.state.gameWindowHeightWBorder;
        const gameWindowWidthWBorder = this.state.gameWindowWidthWBorder;
        const gameWindowHeight = this.state.gameWindowHeight;
        const gameWindowWidth = this.state.gameWindowWidth;

        //main menu
        const mainMenuDisplay = this.state.mainMenuDisplay;
        const statsMenuDisplay = this.state.statsMenuDisplay;
        const mainMenuOpacity = this.state.mainMenuOpacity;
        const statsMenuOpacity = this.state.statsMenuOpacity;
        const beefBorderWidth = this.state.beefBorderWidth;
        const leanBorderWidth = this.state.leanBorderWidth;
        const titleFontSize = this.state.titleFontSize;
        const titleColor = this.state.titleColor
        const menuFontSize = this.state.menuFontSize;
        const tableFontSize = this.state.tableFontSize;

        //optionsMenus
        const practiceColor = this.state.practice ? sessionsAndMenus.outsideCSS.selectedDifficulty : sessionsAndMenus.outsideCSS.unselectedDifficulty
        const mode = this.state.mode;
        const difficulty = this.state.difficulty;
        const backgroundImage = this.state.backgroundImage;
        //in game elements
        const inGameOpacity = this.state.inGameOpacity;
        const dataFontSize = this.state.dataFontSize;
        const scoreLabel2Class = this.state.scoreLabel2Class;
        const inGameDisplay = this.state.inGameDisplay;
        const birdDiameter = this.state.birdDiameter;
        const cyberBirdClip = this.state.cyberBirdClip;
        const highScoreLabelText = this.state.highScoreLabelText;

        return (<div id="gameWindowMain" onTouchStart={birdMotion.jump}
                    style={{height: gameWindowHeightWBorder, position: "relative"}}>
                    <div id="gameWindowCut"
                            className="centered"
                            style={{height: gameWindowHeightWBorder,
                                    width: gameWindowWidthWBorder,
                                    top: this.mobiVariants.top}}>
                        <img id="preloadImg" style={{display: "none"}}></img>
                        <div id="gameWindow" style={{height: gameWindowHeight,
                                                    width: gameWindowWidth,
                                                    backgroundImage: backgroundImage,
                                                    borderWidth: this.mobiVariants.borderWidth + "px"}}
                            onContextMenu={this.preventDefault}
                            onTouchMove={this.preventDefault}>
                            <div id="mainMenu" className="centered"
                                style={{fontSize: menuFontSize,
                                    display: mainMenuDisplay,
                                    opacity: mainMenuOpacity}}>
                                <div className="gameMenuTitle"
                                    style={{fontSize: titleFontSize, color: titleColor}}>Upbeat Bird</div>
                                <div id="optionsMenu" className="centered" style={{borderWidth: beefBorderWidth}}>
                                    <div id="difficultyMenu">
                                        <ModeSelector select={this.setDifficulty} selection={difficulty} name="Easy"
                                            id="easy" className="difficultySelectors menuElement"/>
                                        <ModeSelector select={this.setDifficulty} selection={difficulty} name="Normal"
                                            id="normal" className="difficultySelectors menuElement"/>
                                        <ModeSelector select={this.setDifficulty} selection={difficulty} name="Hard"
                                            id="hard" className="difficultySelectors menuElement"/>
                                    </div>
                                    <div id="practiceModeSelect" className="menuElement"
                                        onClick={() => this.setDifficulty('practice')} style={{backgroundColor: practiceColor}}>Practice Mode
                                    </div>
                                </div>
                                <table id="modemenu" className="centered" style={{borderWidth: leanBorderWidth}}>
                                    <tbody>
                                        <tr>
                                            <td><ModeSelector select={this.setMode} selection={mode} name="Straight"
                                                id="straight" className="modeSelectors menuElement"/></td>
                                            <td><ModeSelector select={this.setMode} selection={mode} name="Triplets"
                                                id="triplets" className="modeSelectors menuElement"/></td>
                                            <td><ModeSelector select={this.setMode} selection={mode} name="Swing"
                                                id="swing" className="modeSelectors menuElement"/></td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div id="beginNewGameButton" onClick={() => this.switchScreen('inGame')} className="menuElement switchScreenButton"
                                    style={{borderWidth: beefBorderWidth}}>{this.state.beginNewGameButtonText}
                                </div>
                                <div id="statsButton" onClick={() => this.switchScreen('stats')}
                                    className="menuElement switchScreenButton"
                                    style={{borderWidth: beefBorderWidth}}>Stats
                                </div>
                            </div>
                            <div id="stats" className="centered" style={{fontSize: menuFontSize,
                                                                        display: statsMenuDisplay,
                                                                        opacity: statsMenuOpacity}}>
                                <div className="gameMenuTitle"
                                    style={{fontSize: titleFontSize, color: titleColor}}>Upbeat Stats</div>
                                <StatsTable difficulty={this.state.difficulty}
                                            beefBorderWidth={beefBorderWidth}
                                            leanBorderWidth={leanBorderWidth}
                                            toggleStats={this.toggleStats}
                                            fontSize={tableFontSize} />
                                <div id="menuButton" onClick={() => this.switchScreen('menu')}
                                    className="menuElement switchScreenButton"
                                    style={{borderWidth: beefBorderWidth}}>Main Menu
                                </div>
                                <div id="tryAgain" onClick={function(){
                                                        if(this.practice === true){
                                                            this.togglePractice();
                                                        }this.switchScreen('inGame')}.bind(this)} style={{borderWidth: beefBorderWidth}}
                                    className="menuElement switchScreenButton beefBorder">{this.tryAgainText}
                                </div>
                            </div>
                            <div id="inGameElements" style={{opacity: inGameOpacity,
                                                            display: inGameDisplay,
                                                            width: this.mobiVariants.currentWidth,
                                                            height: this.mobiVariants.currentHeight,
                                                            fontSize: dataFontSize}}>
                                <div id="cyberBird" style={{height: birdDiameter,
                                                            width: birdDiameter,
                                                            clip: cyberBirdClip}}>
                                    <div id="imgBird"></div>
                                </div>
                                <div id="jumpMeter" style={{bottom: this.mobiVariants.jumpMeterBottom}}>
                                    <div id="jumpMeterText">Jump Meter</div>
                                </div>
                                <div id="scoreLabel" style={{color: titleColor}}>
                                    <div id="highScoreLabel">{highScoreLabelText}<div id="highScore">0</div></div>
                                    <div id="scoreLabel2" className={scoreLabel2Class}>Score: <div id="score">0</div></div>
                                </div>
                                <div id="bpmLabel" style={{color: titleColor}}>BPM: <div id="bpm">56</div></div>
                            </div>
                        </div>
                    </div>
                </div>)
    }
}

class ModeSelector extends Component {
    render(){
        let backgroundColor = this.props.selection === this.props.id ? sessionsAndMenus.outsideCSS.selectedDifficulty : sessionsAndMenus.outsideCSS.unselectedDifficulty
        return (<div className={this.props.className} onClick={() => this.props.select(this.props.id)}
        id={this.props.id} style={{backgroundColor: backgroundColor}}>{this.props.name}</div>)
    }
}

class StatsTable extends Component {
    render() {
        var h = soundLogic.perfect.history[this.props.difficulty];
        return (<table id="statsTable" className="beefBorder centered"
        style={{fontSize: this.props.fontSize, borderWidth: this.props.beefBorderWidth}}>
        <tbody>
        <tr className="statsRow">
        <StatDifficulty difficulty={this.props.difficulty}
            borderWidth={this.props.leanBorderWidth}
            toggleStats={this.props.toggleStats} />
        <th className="statHeader">This Game</th>
        <th className="statHeader">Last Game</th>
        <th className="statHeader">Record</th>
        </tr>
        <tr className="statsRow">
        <td className="tableLabel">Perfect Upbeats</td>
        <td className="tableCentered">{h["Perfect Upbeats"][0]}</td>
        <td className="tableCentered">{h["Perfect Upbeats"][1]}</td>
        <td className="tableCentered">{h["Perfect Upbeats"][2]}</td>
        </tr>
        <tr className="statsRow">
        <td className="tableLabel">Posts Cleared</td>
        <td className="tableCentered">{h["Posts Cleared"][0]}</td>
        <td className="tableCentered">{h["Posts Cleared"][1]}</td>
        <td className="tableCentered">{h["Posts Cleared"][2]}</td>
        </tr>
        <tr className="statsRow">
        <td className="tableLabel">Max BPM</td>
        <td className="tableCentered">{h["Max BPM"][0]}</td>
        <td className="tableCentered">{h["Max BPM"][1]}</td>
        <td className="tableCentered">{h["Max BPM"][2]}</td>
        </tr>
        <tr className="statsRow">
        <td className="tableLabel">Score</td>
        <td className="tableCentered">{h["Score"][0]}</td>
        <td className="tableCentered">{h["Score"][1]}</td>
        <td className="tableCentered">{h["Score"][2]}</td>
        </tr>
        <tr className="statsRow">
        <td className="tableLabel">Best Streak</td>
        <td className="tableCentered">{h["Best Streak"][0]}</td>
        <td className="tableCentered">{h["Best Streak"][1]}</td>
        <td className="tableCentered">{h["Best Streak"][2]}</td>
        </tr>
        </tbody>
        </table>)
    }
}

class StatDifficulty extends Component{
    render(){
        let difficulty = this.props.difficulty;
        difficulty = "Difficulty: " + difficulty[0].toUpperCase() + difficulty.slice(1)
        return (<th className="statHeader"
            style={{borderWidth: this.props.borderWidth}}
            id="statDifficulty"
            onClick={this.props.toggleStats}>{difficulty}</th>)
    }
}

export default App
