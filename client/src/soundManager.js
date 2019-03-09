//Upbeat Bird
//Copyright Caleb Hugo 2018, MIT

import {Base64Binary} from "./base64Binary";
import {birdMotion} from "./birdMotion";
import $ from "jquery";

class SoundManager{
    constructor(){
        //Get this nonsense out of the way...
        this.verifySoundUnlocked = this.verifySoundUnlocked.bind(this);
        this.loadPiano = this.loadPiano.bind(this);
        this.soundscape = this.createAudioContext(44100);
        this.soundUnlocked = false;
        this.sampledInstruments = false;
        this.piano = false;
        this.loadPiano();
    }

    createAudioContext (desiredSampleRate) {
        var AudioCtor = window.AudioContext || window.webkitAudioContext

        desiredSampleRate = typeof desiredSampleRate === 'number'
        ? desiredSampleRate
        : 44100
        var context = new AudioCtor()

        // Check if hack is necessary. Only occurs in iOS6+ devices
        // and only when you first boot the iPhone, or play a audio/video
        // with a different sample rate
        var buffer = context.createBuffer(1, 1, desiredSampleRate)
        var dummy = context.createBufferSource()
        dummy.buffer = buffer
        dummy.connect(context.destination)
        dummy.start(0)
        dummy.disconnect()

        context.close() // dispose old context
        context = new AudioCtor()

        return context;
    }

    verifySoundUnlocked() {
        if (this.soundUnlocked || !this.soundscape) {
            return;
        }

        var buffer = this.soundscape.createBuffer(1, 1, 22050);
        var source = this.soundscape.createBufferSource();
        source.buffer = buffer;
        source.connect(this.soundscape.destination);
        source.start(0);

        // by checking the play state after some time, we know if we're really unlocked
        setTimeout(function() {
          if((source.playbackState === source.PLAYING_STATE || source.playbackState === source.FINISHED_STATE)) {
              this.soundUnlocked = true;
          }
      }.bind(this), 0);
    }

    loadSoundsFromJson(){
        $.ajax({dataType: 'json',
            url: "sounds.json",
            success: function(data){
                this.sampledInstruments = data;
            }.bind(this)
        });
    }

    loadPiano(){
        if(!/^https:\/\/calebhugo.com/.test(window.location.href)){ //this is what will happen in the apps.
            if(/^http:\/\/localhost:3000/.test(window.location.href) && false){ //update the sounds if developing. Remove the 'false' to activate.
                $.get("https://calebhugo.com/upbeatBird/upbeatSounds.php",
                    function(data, status){
                        $.post({url: 'http://localhost:3001/saveSounds',
                                type: 'POST',
                                data: {soundString: data},
                                success: function(data){
                                    console.log(data)
                                    this.loadSoundsFromJson();
                                }.bind(this)})
                    }.bind(this))
            }
            else{
                this.loadSoundsFromJson()
            }
        }
        else{ //This is what will happen at calebhugo.com
            $.get("https://calebhugo.com/upbeatBird/upbeatSounds.php",
                function(data, status){
                    try{
                        this.sampledInstruments = JSON.parse(data);
                    }
                    catch(err){console.log(data + " is not a valid JSON string. \n" + err.message)}
                }.bind(this))
        }

        var pianoWait = setInterval(function(){
            if(birdMotion.gamePending){
                document.getElementById("beginNewGameButton").textContent = "Loading Sounds...";
            }
            if(this.sampledInstruments){
                try{
                    this.piano = new SampledInstrument(this.sampledInstruments, this.soundscape);
                }
                catch(e){ //This can make bad things happen...
                    clearInterval(pianoWait);
                    console.log(e);
                }
                clearInterval(pianoWait);
            }
            else{
                //We'll keep trying until it works, because the game doesn't function until there is sound.
                console.log("Sounds were not ready yet. Trying again in .5 seconds");
            }
        }.bind(this), 500);
    }




}

class SampledInstrument{
    constructor(binarySounds, soundscape){
        //get this nonsense out of the way...
        this.play = this.play.bind(this);
        this.primeSound = this.primeSound.bind(this);
        this.smoothStop = this.smoothStop.bind(this);
        this.primeInstrument = this.primeInstrument.bind(this);
        this.primeSound = this.primeSound.bind(this);
        this.binarySounds = JSON.parse(JSON.stringify(binarySounds));
        this.sounds = binarySounds;
        this.notes = {};
        this.sourceNodes = {};
        this.gainNodes = {};
        this.soundingSourceNodes = [];
        this.soundingGainNodes = [];
        this.dynamics = {"fff": 1, "ff": .875,"f": .75,"mf": .625,"mp": .5,"p": .375,"pp": .25,"ppp": .125, "n": 0};
        this.soundscape = soundscape;

        //build and prime the imported sounds:
        this.primeInstrument()
    }

    play(note, dynamic, length){
        if((this.sourceNodes["source" + note])){
            if(!(this.sourceNodes["source" + note].ready)){
                console.log("The " + note + " is priming.")
                return
            }
        }
        else{
            console.log("The " + note + " is priming.")
            return
        }
        if(this.soundingSourceNodes[note]){
            clearTimeout(this["stopCall" + note])
            this.smoothStop(this.soundingSourceNodes[note], this.soundingGainNodes[note]);
        };
        //make an error handler so that we know that a note doesn't exist
        if(dynamic){
            this.gainNodes["gain" + note].gain.value = this.dynamics[dynamic];
        }
        else if(dynamic !== undefined)
            console.log("The dynamic\" " + dynamic + "\" is not a thing.")
        if(this.sounds[note]){
            this.sourceNodes["source" + note].start();
            this.soundingSourceNodes[note] = this.sourceNodes["source" + note]
            this.soundingGainNodes[note] = this.gainNodes["gain" + note]
            if(this.sounds[note].byteLength === 0){ //firefox is a little fussy sometimes.
                this.sounds[note] = Base64Binary.decodeArrayBuffer(this.binarySounds[note])
            }
            this.sourceNodes["source" + note] = null;
            this.primeSound(note, this.sounds[note])
        }
        else
            console.log(note + " is not available");
        if(length){
            this["stopCall" + note] = setTimeout(function(){
                this.smoothStop(this.soundingSourceNodes[note], this.soundingGainNodes[note]);
            }.bind(this), (length * 1000) + 20);
        }
    }

    primeInstrument(){
        for(var sound in this.sounds){
            //turn the binary into the web audio format.
            this.sounds[sound] = Base64Binary.decodeArrayBuffer(this.sounds[sound])
            //Get the sound ready for playback.
            this.primeSound(sound, this.sounds[sound])
        }
    }

    primeSound(note, fileData) {
        if(this.sourceNodes["source" + note])
            this.sourceNodes["source" + note].ready = false;
        this.gainNodes["gain" + note] = this.soundscape.createGain();
        this.gainNodes["gain" + note].connect(this.soundscape.destination);
        this.gainNodes["gain" + note].gain.value = this.dynamics["mf"]; //We do not use the smoothing setter.
        this.soundscape.decodeAudioData(fileData, function(decodedData){
            this.sourceNodes["source" + note] = this.soundscape.createBufferSource();
            this.sourceNodes["source" + note].buffer = decodedData;
            this.sourceNodes["source" + note].connect(this.gainNodes["gain" + note])
            this.sourceNodes["source" + note].ready = true;
        }.bind(this), function(err) {console.log("err(decodeAudioData): " + err); });
    }

    smoothStop(sourceNode, gainNode){
        var stopping = setInterval(function(){
            gainNode.gain.value -= .05;
            if(gainNode.gain.value <= 0){
                gainNode.gain.value = 0;
                clearInterval(stopping)
            }
        }, 1);
    }

    decay(sourceNode, gainNode, rate){
        var decayStopping = setInterval(function(){
            gainNode.gain.value -= .05;
            if(gainNode.gain.value <= 0){
                clearInterval(decayStopping)
                sourceNode.stop();
            }
        }, rate * 20);
    }
}

export var soundManager = new SoundManager();
