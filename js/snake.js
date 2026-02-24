/**
 * Snake Game v2.2 - Explosive Fruits
 */
var SnakeGame = function(containerId){

    var self = this;

    this.containerId = containerId;
    this.context = null;
    this.interval = null;
    this.timeout = null;
    this.countdownSeconds = 3;

    this.version = "2.2";
    this.size = 10;
    this.baseSpeed = 150;
    this.speed = 0;

    this.score = 0;
    this.foodPerLevel = 5;
    this.foodTaken = 0;
    this.currentLevel = 1;

    this.lastCatchMoment = null;

    /* ---------------- KEYBOARD ---------------- */
    this.keyboardDispatcher = function(event){
        var keyCode = event ? event.keyCode : window.event.keyCode;
        switch(keyCode){
            case 37: if(self.Snake.direction !== "right") self.Snake.moveLeft(); break;
            case 38: if(self.Snake.direction !== "down") self.Snake.moveUp(); break;
            case 39: if(self.Snake.direction !== "left") self.Snake.moveRight(); break;
            case 40: if(self.Snake.direction !== "up") self.Snake.moveDown(); break;
        }
    };

    /* ---------------- START ---------------- */
    this.start = function(){
        this.Food.draw();
        this.Snake.draw();
        this.restartFoodTaken();
        this.speed -= this.speed * 0.10;
        this.lastCatchMoment = new Date();
        this.clearTimeEvents();
        this.interval = setInterval(this.Snake.move, this.speed);
    };

    this.beforeStart = function(){
        this.clearTimeEvents();
        this.context.clearRect(0,0,this.Screen.gameboard.width,this.Screen.gameboard.height);
        this.Snake.moveRight();
        this.Snake.position.x = 200;
        this.Snake.position.y = 200;
        this.countdownSeconds = 3;
        this.Screen.refreshCountdown();
        this.Screen.refreshScore();
        this.Screen.refreshLevel();
        this.timeout = setTimeout(this.countdown,1000);
    };

    this.countdown = function(){
        if(self.countdownSeconds > 1){
            self.countdownSeconds--;
            self.Screen.refreshCountdown();
            self.timeout = setTimeout(self.countdown,1000);
        } else {
            self.Screen.hideCountdown();
            self.start();
        }
    };

    /* ---------------- EVENTS ---------------- */
    this.events = function(){
        this.Screen.start.onclick = function(){
            self.restart();
            self.beforeStart();
        };
        document.onkeydown = function(event){
            self.keyboardDispatcher(event);
        };
    };

    /* ---------------- LOAD ---------------- */
    this.load = function(){
        if(this.Screen.draw()){
            this.events();
        } else {
            alert("Canvas not supported.");
        }
    };

    this.checkIfCanvasIsSupported = function(){
        if(this.Screen.gameboard.getContext){
            this.context = this.Screen.gameboard.getContext("2d");
            return true;
        }
        return false;
    };

    /* ---------------- SCORE ---------------- */
    this.restartFoodTaken = function(){ this.foodTaken = 0; };

    this.calculateScore = function(){
        var now = new Date();
        var elapsedTime = now - this.lastCatchMoment;
        this.score += (this.currentLevel*10) + Math.round((100/elapsedTime)*1000);
        this.Screen.refreshScore();

        if(this.foodTaken === this.foodPerLevel){
            this.currentLevel++;
            this.beforeStart();
        } else {
            this.Food.draw();
            this.lastCatchMoment = new Date();
        }
    };

    /* ---------------- GAME OVER ---------------- */
    this.lost = function(){
        this.clearTimeEvents();
        alert("Game Over\nLevel: "+this.currentLevel+"\nScore: "+this.score);
        this.restart();
    };

    this.clearTimeEvents = function(){
        if(self.timeout) clearTimeout(self.timeout);
        if(self.interval) clearInterval(self.interval);
    };

    this.restart = function(){
        this.context.clearRect(0,0,this.Screen.gameboard.width,this.Screen.gameboard.height);
        this.currentLevel = 1;
        this.score = 0;
        this.Screen.restart();
        this.speed = this.baseSpeed;
        this.Snake.bornAgain();
        self.Traps = [];
    };

    /* ---------------- SCREEN ---------------- */
    this.Screen = {
        container: document.getElementById(self.containerId),
        gameboard: null,
        start: null,
        level: null,
        score: null,
        countdown: null,
        draw: function(){
            var gameHtml =
            '<div id="snakeGame">'+
            '<header><h1>Snake</h1>'+
            '<div id="board">'+
            '<div><a href="javascript:;" id="start">START</a></div>'+
            '<div>Level: <span id="level">?</span></div>'+
            '<div>Score: <span id="score">?</span></div>'+
            '<div><span id="countdown"></span></div>'+
            '</div></header>'+
            '<canvas id="gameboard" width="400" height="400"></canvas>'+
            '</div>';
            this.container.innerHTML = gameHtml;
            this.gameboard = document.getElementById("gameboard");
            this.start = document.getElementById("start");
            this.level = document.getElementById("level");
            this.score = document.getElementById("score");
            this.countdown = document.getElementById("countdown");
            return self.checkIfCanvasIsSupported();
        },
        refreshLevel:function(){ this.level.innerHTML = self.currentLevel; },
        refreshScore:function(){ this.score.innerHTML = self.score; },
        refreshCountdown:function(){ this.countdown.innerHTML = self.countdownSeconds; },
        restart:function(){ this.level.innerHTML="?"; this.score.innerHTML="?"; this.hideCountdown(); },
        hideCountdown:function(){ this.countdown.innerHTML=""; }
    };

    /* ---------------- FOOD ---------------- */
    this.Food = {
        randomPoint: [],
        draw:function(){
            this.calculateRandomPoint();
            if(self.Snake.body.some(self.Snake.isPieceOfTail)){
                this.draw(); return;
            }
        },
        calculateRandomPoint:function(){
            this.randomPoint = [
                Math.floor(Math.random()*(self.Screen.gameboard.width/self.size))*self.size,
                Math.floor(Math.random()*(self.Screen.gameboard.height/self.size))*self.size
            ];
        }
    };

    /* ---------------- TRAPS (Fruits explosifs) ---------------- */
    this.Traps = [];

    this.spawnTrap = function(){
        let trap = {
            x: Math.floor(Math.random()*(self.Screen.gameboard.width/self.size))*self.size,
            y: Math.floor(Math.random()*(self.Screen.gameboard.height/self.size))*self.size,
            born: Date.now(),
            alive: true,
            flashing: false,
            flashStart: null,
            radius: 6
        };
        // n'apparait pas sur le serpent
        if(self.Snake.body.some(s=>s[0]===trap.x && s[1]===trap.y)){
            self.spawnTrap(); return;
        }
        self.Traps.push(trap);
    };

    this.drawTraps = function(){
        let now = Date.now();
        self.Traps.forEach(trap => {
            if(!trap.alive) return;
            let distX = Math.abs(trap.x - self.Snake.position.x)/self.size;
            let distY = Math.abs(trap.y - self.Snake.position.y)/self.size;
            let distance = Math.max(distX, distY);

            // déclenche clignotement si à 5 cubes
            if(distance <= 5 && !trap.flashing){
                trap.flashing = true;
                trap.flashStart = now;
            }

            // couleur normale ou clignotement “orage”
            if(trap.flashing && now - trap.flashStart <= 1700){ // 1,7s
                // clignote alternance orange/rouge
                let phase = Math.floor((now-trap.flashStart)/100)%2;
                let color = phase===0 ? "#ffaa33" : "#ff0000";
                self.context.fillStyle=color;
                self.context.shadowBlur=15;
                self.context.shadowColor=color;
                self.context.fillRect(trap.x,trap.y,self.size,self.size);
                self.context.shadowBlur=0;
            } else if(!trap.flashing) {
                self.context.fillStyle="#ff3b3b";
                self.context.fillRect(trap.x,trap.y,self.size,self.size);
            }

            // explosion après clignotement
            if(trap.flashing && now - trap.flashStart > 1700){
                trap.alive=false;
                // effet explosion: cercle flash blanc
                self.context.fillStyle="#ffffff";
                self.context.shadowBlur=25;
                self.context.shadowColor="#ffff00";
                let centerX = trap.x+self.size/2;
                let centerY = trap.y+self.size/2;
                let radiusPx = trap.radius*self.size;
                self.context.beginPath();
                self.context.arc(centerX,centerY,radiusPx,0,Math.PI*2);
                self.context.fill();
                self.context.shadowBlur=0;
                // supprime les cases dans le rayon
                for(let dx=-trap.radius; dx<=trap.radius; dx++){
                    for(let dy=-trap.radius; dy<=trap.radius; dy++){
                        let x=trap.x+dx*self.size;
                        let y=trap.y+dy*self.size;
                        if(x>=0 && x<self.Screen.gameboard.width && y>=0 && y<self.Screen.gameboard.height){
                            self.context.clearRect(x,y,self.size,self.size);
                            if(self.Snake.position.x===x && self.Snake.position.y===y){
                                self.lost();
                            }
                        }
                    }
                }
            }
        });
        self.Traps=self.Traps.filter(t=>t.alive);
    };

    /* ---------------- SNAKE ---------------- */
    this.Snake = {
        body:[],
        position:{x:0,y:0},
        direction:"right",
        length:3,
        isPieceOfTail:function(e){ return e[0]===self.Food.randomPoint[0] && e[1]===self.Food.randomPoint[1]; },
        hasEatenItself:function(e){ return e[0]===self.Snake.position.x && e[1]===self.Snake.position.y; },
        draw:function(){
            if(self.Snake.position.x<0||self.Snake.position.x>=self.Screen.gameboard.width||self.Snake.position.y<0||self.Snake.position.y>=self.Screen.gameboard.height){self.lost(); return;}
            if(self.Snake.body.some(self.Snake.hasEatenItself)){self.lost(); return;}
            self.Snake.body.push([self.Snake.position.x,self.Snake.position.y]);
            if(self.Snake.body.length>self.Snake.length) self.Snake.body.shift();
            self.context.clearRect(0,0,self.Screen.gameboard.width,self.Screen.gameboard.height);

            // dessine food
            self.context.fillStyle="#ff3b3b";
            self.context.shadowBlur=20;
            self.context.shadowColor="#ff3b3b";
            self.context.fillRect(self.Food.randomPoint[0],self.Food.randomPoint[1],self.size,self.size);
            self.context.shadowBlur=0;

            // dessine traps
            self.drawTraps();

            // dessine snake
            self.context.shadowBlur=12;
            self.context.shadowColor="#00ff9c";
            self.context.fillStyle="#00ff9c";
            for(let i=0;i<self.Snake.body.length;i++){
                self.context.fillRect(self.Snake.body[i][0],self.Snake.body[i][1],self.size,self.size);
            }
            self.context.shadowBlur=0;

            // mange food
            if(self.Snake.position.x===self.Food.randomPoint[0] && self.Snake.position.y===self.Food.randomPoint[1]){
                self.foodTaken++; self.Snake.length++; self.calculateScore();
            }
        },
        move:function(){
            switch(self.Snake.direction){
                case "left": self.Snake.position.x-=self.size; break;
                case "up": self.Snake.position.y-=self.size; break;
                case "right": self.Snake.position.x+=self.size; break;
                case "down": self.Snake.position.y+=self.size; break;
            }
            self.Snake.draw();
        },
        moveLeft:function(){ self.Snake.direction="left"; },
        moveUp:function(){ self.Snake.direction="up"; },
        moveRight:function(){ self.Snake.direction="right"; },
        moveDown:function(){ self.Snake.direction="down"; },
        bornAgain:function(){ self.Snake.body=[]; self.Snake.direction="right"; self.Snake.length=3; }
    };

    this.speed=this.baseSpeed;
    this.load();

    // spawn traps toutes les 5s
    setInterval(function(){ self.spawnTrap(); },5000);
};