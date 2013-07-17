(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application,
        activation = Windows.ApplicationModel.Activation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {

                var 

                // Page elements.
                $you = $('#you'),
                $yoursText = $('#you .name'),
                $dealer = $('#dealer'),
                $dealersText = $('#dealer .name'),
                $youCards = $('#you #cards'),
                $dealerCards = $('#dealer #cards'),
                $winStatus = $('#win-status'),
                $newGame = $('#options #new-game'),
                $hitMe = $('#options #hit-me'),
                $buttons = $('.button'),
                $stay = $('#options #stay'),

                // Templates.
                $cardTemplate = $($('#card-template').html()),
                $diamondsImage = $($('#diamonds-svg').html()),
                $heartsImage = $($('#hearts-svg').html()),
                $spadesImage = $($('#spades-svg').html()),
                $clubsImage = $($('#clubs-svg').html()),
                
                imageArray = [$diamondsImage, $heartsImage, $spadesImage, $clubsImage],
                playerNumCards = 2,
                dealerNumCards = 2,
                leftOffset = 18,

                yourCards = [],
                dealerCards = [],

                gameActive = true,
                firstTime = true,
                players = null,
                curPlayer = null,
                winner = false,
                loser = false,
                tie = false,

                numSuits =  4,              //For cycling through cards.
                numValues = 13,
                count = 2,
                dealerCount = 2,

                setCards = function(){
                    for (var i = 0; i < 10; i++){
                        $youCards.append($cardTemplate.clone().attr('id', i));
                        $dealerCards.append($cardTemplate.clone().attr('id', i));
                    }
                }(),

                cacheCards = function(){
                    for (var i = 0; i < 10; i++){
                        yourCards[i] = {};
                        yourCards[i].domElement = $('#you #cards #'+i);
                        yourCards[i].suit = $('#you #cards #'+i+' .box #suit');
                        yourCards[i].number = $('#you #cards #'+i+' .box #number');
                        yourCards[i].middle = $('#you #cards #'+i+' #middle');

                        dealerCards[i] = {};
                        dealerCards[i].domElement = $('#dealer #cards #'+i);
                        dealerCards[i].suit = $('#dealer #cards #'+i+' .box #suit');
                        dealerCards[i].number = $('#dealer #cards #'+i+' .box #number');
                        dealerCards[i].middle = $('#dealer #cards #'+i+' #middle');
                    }

                    yourCards[0].domElement.add(dealerCards[0].domElement).addClass('top-card');

                    for (var i = 1; i < 10; i++){
                        yourCards[i].domElement.add(dealerCards[i].domElement).addClass('bottom-card');
                    }
                }(),

                Card = function(suit, faceValue){
                    this.suit =         suit;           //1 = diamond, 2 = heart, 3 = spade, 4 = club
                    this.faceValue =    faceValue;      //1-10 = ace-10, 11 = jack, 12 = queen, 13 = king.
                    this.jackValue =    (faceValue > 10)? 10: faceValue;
                },

                Player = function(id, isDealer){
                    this.isDealer =     isDealer;
                    this.hand =         [];
                    this.total =        0;
                    this.highAceTotal = 0;
                    this.countTotal = function(){
                        this.total = 0;
                        for(var i = 0; i < this.hand.length; i++){
                            this.total += this.hand[i].jackValue;
                        }
                        this.highAceTotal = this.total;
                        for(var j = 0; j < this.hand.length; j++){
                            if(this.hand[j].faceValue == 1) this.highAceTotal = this.total - 1 + 11;
                            break;
                        }
                    };
                    this.didLose = function(){
                        if (this.total > 21){
                            return true;
                        }
                        else return false;
                    };
                },

                deck = {
                    cards: [],
                    draw:       function(){   //Place's the top card in a 'player.hand'
                        return deck.cards.pop();
                    },
                    shuffle:    function(o){
                        for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
                    },
                    initilize:  function(){
                        for(var i = 1; i <= numSuits; i++){
                            for(var j = 1; j <= numValues; j++){
                                deck.cards.push(new Card(i, j));
                            }
                        }
                        deck.shuffle(deck.cards);
                    }
                },

                Start = function(numPlayers){
                    players = [];
                    curPlayer = 0;

                    for(var i = 1; i <= numPlayers; i++){
                        if(i == numPlayers) { players.push(new Player(i, true)); }
                        else { players.push(new Player(i, false)); }
                    }

                    deck.initilize();

                    for(var j = 0; j <players.length; j++){
                        players[j].hand.push(deck.draw());
                        players[j].hand.push(deck.draw());
                        players[j].countTotal();
                    }
                };

                Start(2);

                var 

                DealerTurn = function(){
                    var otherHand = (players[0].highAceTotal <= 21)? players[0].highAceTotal: players[0].total;
                    var yourHand = (players[1].highAceTotal <= 21)? players[1].highAceTotal: players[1].total;
                   
                    if(yourHand <= otherHand ) {
                        HitMe(curPlayer);


                        dealerCards[dealerCount].middle.html('');
                        MSApp.execUnsafeLocalFunction(function(){
                            dealerCards[dealerCount].suit.html(imageArray[players[1].hand[players[1].hand.length-1].suit-1].clone());
                        });
                        dealerCards[dealerCount].number.html(numberToLetter(players[1].hand[players[1].hand.length-1].faceValue));

                        for (var i = 0; i < players[0].hand[players[0].hand.length-1].faceValue; i++){
                            MSApp.execUnsafeLocalFunction(function(){
                                dealerCards[dealerCount].middle.append(imageArray[players[1].hand[players[1].hand.length-1].suit-1].clone());
                            });
                        }

                        dealerCards[dealerCount].domElement.css({'top': '25%', 'left': leftOffset+((dealerCount+1)*7)+'%'});
                        dealerCount++;

                        DealerTurn();
                    }
                    else if(yourHand > 21) winner = true;
                    else if(yourHand > otherHand) loser = true;
                    else tie = true;
                },

                Stay = function(playerNum) {
                    curPlayer += 1;
                    DealerTurn();
                },

                HitMe = function(playerNum)
                {
                    players[playerNum].hand.push(deck.draw());
                    players[playerNum].countTotal();
                },

                youCardUp = function(card){
                    yourCards[card].domElement.css('top', '-380px');
                },

                youCardDown = function(card){
                    yourCards[card].domElement.css('top', '25%');
                },

                dealerCardUp = function(card){
                    dealerCards[card].domElement.css('top', '-380px');
                },

                dealerCardDown = function(card){
                    dealerCards[card].domElement.css('top', '25%');
                },

                numberToLetter = function(number){
                    switch (number){
                        case 1: return 'A'; break;
                        case 11: return 'J'; break;
                        case 12: return 'Q'; break;
                        case 13: return 'K'; break;
                        default: return number;
                    }
                },

                setInitialCardData = function(){
                    // Set user information.
                    setTimeout(function(){
                        yourCards[0].middle.html('');
                        MSApp.execUnsafeLocalFunction(function(){
                            yourCards[0].suit.html(imageArray[players[0].hand[0].suit-1].clone());
                        });
                        yourCards[0].number.html(numberToLetter(players[0].hand[0].faceValue));
                        for (var i = 0; i < players[0].hand[0].faceValue; i++){
                            MSApp.execUnsafeLocalFunction(function(){
                                yourCards[0].middle.append(imageArray[players[0].hand[0].suit-1].clone());
                            });
                        }
                    }, 400);

                    setTimeout(function(){
                        yourCards[1].middle.html('');
                        MSApp.execUnsafeLocalFunction(function(){
                            yourCards[1].suit.html(imageArray[players[0].hand[1].suit-1].clone());
                        });
                        yourCards[1].number.html(numberToLetter(players[0].hand[1].faceValue));

                        for (var i = 0; i < players[0].hand[1].faceValue; i++){
                            MSApp.execUnsafeLocalFunction(function(){
                                yourCards[1].middle.append(imageArray[players[0].hand[1].suit-1].clone());
                            });
                        }
                    }, 700);
                    
                    setTimeout(function(){
                        // Set dealer information.
                        dealerCards[0].middle.html('');
                        MSApp.execUnsafeLocalFunction(function(){
                            dealerCards[0].suit.html(imageArray[players[1].hand[0].suit-1].clone());
                        });
                        dealerCards[0].number.html(numberToLetter(players[1].hand[0].faceValue));  

                        for (var i = 0; i < players[1].hand[0].faceValue; i++){
                            MSApp.execUnsafeLocalFunction(function(){
                                dealerCards[0].middle.append(imageArray[players[1].hand[0].suit-1].clone());
                            });
                        }
                    }, 900);
                    
                    setTimeout(function(){
                        dealerCards[1].middle.html('');
                        MSApp.execUnsafeLocalFunction(function(){
                            dealerCards[1].suit.html(imageArray[players[1].hand[1].suit-1].clone());
                        });
                        dealerCards[1].number.html(numberToLetter(players[1].hand[1].faceValue));                            
                        for (var i = 0; i < players[1].hand[1].faceValue; i++){
                            MSApp.execUnsafeLocalFunction(function(){
                                dealerCards[1].middle.append((imageArray[players[1].hand[1].suit-1].clone()));
                            });
                        }
                    }, 1100);
                },

                setEventListeners = function(){
                    $newGame
                    .on('mousedown touchstart', function(){
                        $newGame.addClass('pushed');

                        gameActive = true;
                        count = 2;
                        dealerCount = 2;
                        deck.cards = [];

                        if (!firstTime){
                            $winStatus.css({
                                    'opacity': 0,
                                    'transform': 'scale(3)'
                                });
                            // Bring the user's cards up.
                            $yoursText.fadeOut(300);
                            youCardUp(0);
                            setTimeout(function(){for(var i = 1; i < 10; i++) youCardUp(i);}, 200);

                            // Bring the dealer's cards up.
                            setTimeout(function(){$dealersText.fadeOut(300); dealerCardUp(0);}, 400);
                            setTimeout(function(){for(var i = 1; i < 10; i++) dealerCardUp(i);}, 600);
                        } else firstTime = false;

                        // Bring user's cards down.
                        setTimeout(function(){youCardDown(0);}, 600);
                        setTimeout(function(){youCardDown(1);}, 800);
                        setTimeout(function(){$yoursText.fadeIn(400);}, 1000);

                        // Bring dealer's cards down.
                        setTimeout(function(){dealerCardDown(0)}, 1000);
                        setTimeout(function(){ dealerCardDown(1);}, 1200);
                        setTimeout(function(){$dealersText.fadeIn(400);}, 1400);

                        Start(2);
                        setInitialCardData();
                    })
                    .on('mouseup touchend', function(){
                        $newGame.removeClass('pushed');
                    });

                    $hitMe
                    .on('mousedown touchstart', function(){

                        if (gameActive){
                            $hitMe.addClass('pushed');
                            HitMe(curPlayer);
                            if (players[curPlayer].didLose()){
                                gameActive = false;
                                $winStatus.html('You lost!').css({
                                    'opacity': 1,
                                    'transform': 'scale(1)'
                                });
                            }

                            yourCards[count].middle.html('');
                            MSApp.execUnsafeLocalFunction(function(){
                                yourCards[count].suit.html(imageArray[players[0].hand[players[0].hand.length-1].suit-1].clone());
                            });
                            yourCards[count].number.html(numberToLetter(players[0].hand[players[0].hand.length-1].faceValue));
                            for (var i = 0; i < players[0].hand[players[0].hand.length-1].faceValue; i++){
                                MSApp.execUnsafeLocalFunction(function(){
                                    yourCards[count].middle.append(imageArray[players[0].hand[players[0].hand.length-1].suit-1].clone());
                                });
                            }

                            yourCards[count].domElement.css({'top': '25%', 'left': leftOffset+((count+1)*7)+'%'});
                            count++;
                        }
                    })
                    .on('mouseup touchend', function(){
                        $hitMe.removeClass('pushed');
                    });

                    $stay
                    .on('mousedown touchstart', function(){
                        if (gameActive){
                            $stay.addClass('pushed');

                            Stay();
                            if (winner){
                                gameActive = false;
                                winner = false;

                                $winStatus.html('You win!').css({
                                    'opacity': 1,
                                    'transform': 'scale(1)'
                                });
                            } else if (tie){
                                gameActive = false;
                                tie = false;

                                $winStatus.html('Tie!').css({
                                    'opacity': 1,
                                    'transform': 'scale(1)'
                                });
                            } else if (loser){
                                gameActive = false;
                                loser = false;

                                $winStatus.html('You lost!').css({
                                    'opacity': 1,
                                    'transform': 'scale(1)'
                                });
                            }
                        } 
                    })
                    .on('mouseup touchend', function(){
                        $stay.removeClass('pushed');
                    });

                    $(window).on('mouseup touchend', function(){
                        $buttons.removeClass('pushed');
                    });
                }(),

                getThingsGoing = function(){if (firstTime) $newGame.trigger('mousedown').trigger('mouseup');}();

            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll());
        }
    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };

    app.start();
})();