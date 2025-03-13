/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * RegicideC implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * regicidec.js
 *
 * RegicideC user interface script
 * 
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */

 
define([
    "dojo","dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock"
],


function (dojo, declare) {
    const DIRECTIONS = {
        2: ['W', 'E']
    }
    return declare("bgagame.regicidec", ebg.core.gamegui, {
        constructor: function(){
            console.log('Regicide constructor');
            this.cardwidth = 72;
            this.cardheight = 96; 
            // Here, you can init the global variables of your user interface
            // Example:
            // this.myGlobalValue = 0;
        },
        
        /*
            setup:
            
            This method must set up the game user interface according to current game situation specified
            in parameters.
            
            The method is called each time the game interface is displayed to a player, ie:
            _ when the game starts
            _ when a player refreshes the game page (F5)
            
            "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
        */
        
        setup: function( gamedatas )
        {
            console.log( "Starting game setup" );

            document.getElementById('game_play_area').insertAdjacentHTML('beforeend', `
                <div id="player-tables"></div>
            `);
            
            document.getElementById('game_play_area').insertAdjacentHTML('beforeend', `
                <div id="middledecks" class="whiteblock"> 
                <div id="court_header"></div>
                <div id="middledeckcontainer">
                <div id="discard_deck"></div>
                <div id="court_deck"></div>
                <div id="draw_deck"></div>
                </div>
                </div>
            `);

            // Setting up player boards
            let index = 0
            Object.values(gamedatas.players).forEach(player => {
                // example of setting up players boards
                this.getPlayerPanelElement(player.id).insertAdjacentHTML('beforeend', `
                    <div id="player-counter-${player.id}">A player counter</div>
                `);
                    // example of adding a div for each player
                document.getElementById('player-tables').insertAdjacentHTML('beforeend',` 
                    <div class="playertable whiteblock playertable_${DIRECTIONS[Object.keys(gamedatas.players).length][index]}">
                    <div id="player-table-${player.id}">
                        <div class="playertablename" style ="color:#${player.color};">${player.name}</div>
                        <div class="ptc" id='playertablecard_${player.id}'></div>
                    </div>
                    </div>`
            )
            index += 1
            });

            document.getElementById('game_play_area').insertAdjacentHTML('beforeend', `
                <div id="myhand">${this.player_id}</div>
            `);
            

            this.playerHand = new ebg.stock();
            this.playerHand.create( this, $('myhand'), this.cardwidth, this.cardheight)
            this.playerHand.setSelectionMode(2); // pick multiple 
            this.playerHand.apparenceBorderWidth = '3px';

            this.playerHand.image_items_per_row = 13;
            
            // Create cards types:
            for (var suit = 1; suit <= 4; suit ++) {
                for (var value = 2; value <= 14; value ++){
                    var card_type_id = this.getCardUniqueId(suit, value);
                    this.playerHand.addItemType(card_type_id, card_type_id, g_gamethemeurl + 'img/cards.png', card_type_id)
                }
            }

            // Cards in Hand
            for (var i in this.gamedatas.hand) {
                var card = this.gamedatas.hand[i];
                var color = card.type;
                var value = card.type_arg;
                this.playerHand.addToStockWithId(this.getCardUniqueId(color, value), card.id);
            }

            // Cards on Table
            for (i in this.gamedatas.cardsontable) {
                var card = this.gamedatas.cardsontable[i];
                var color = card.type;
                var value = card.type_arg;
                var player_id = card.location_arg;
                this.playCardOnTable(player_id, color, value, card.id);
            }

            //Royal Deck
            var royal = this.gamedatas.courtcard;
            this.placeDeck("court", royal.type, royal.type_arg, royal.id);
            document.getElementById('court_header').insertAdjacentHTML('beforeend', `
                <div>♥: ${this.gamedatas.regentHealth}   ♧: 10  </div>`)

            // Deck Counts
            document.getElementById('court_deck').insertAdjacentHTML('beforeend',`
                <div class="deckcount">${this.gamedatas.courtcount}</div>`);
            
            if (this.gamedatas.discardcount != 0){
                var discarded = this.gamedatas.discardedcard;
                this.placeDeck("discard", discarded.type, discarded.type_arg, discarded.id)
                document.getElementById('discard_deck').insertAdjacentHTML('beforeend',`
                    <div class="deckcount">${this.gamedatas.discardcount}</div>`);
            }

            if (this.gamedatas.drawcount != 0) {
                document.getElementById('draw_deck').insertAdjacentHTML('beforeend',`
                    <div class="cardback"></div>
                    <div class="deckcount">${this.gamedatas.drawcount}</div>`);
            }

            dojo.connect(this.playerHand, 'onChangeSelection', this, 'onPlayerHandSelectionChanged');
            // Setup game notifications to handle (see "setupNotifications" method below)
            this.setupNotifications();

            console.log( "Ending game setup" );

        },
       

        ///////////////////////////////////////////////////
        //// Game & client states
        
        // onEnteringState: this method is called each time we are entering into a new game state.
        //                  You can use this method to perform some user interface changes at this moment.
        //
        onEnteringState: function( stateName, args )
        {
            console.log( 'Entering state: '+stateName, args );
            
            switch( stateName )
            {
            
            /* Example:
            
            case 'myGameState':
            
                // Show some HTML block at this game state
                dojo.style( 'my_html_block_id', 'display', 'block' );
                
                break;
           */
           
           
            case 'dummy':
                break;
            }
        },

        // onLeavingState: this method is called each time we are leaving a game state.
        //                 You can use this method to perform some user interface changes at this moment.
        //
        onLeavingState: function( stateName )
        {
            console.log( 'Leaving state: '+stateName );
            
            switch( stateName )
            {
            
            /* Example:
            
            case 'myGameState':
            
                // Hide the HTML block we are displaying only during this game state
                dojo.style( 'my_html_block_id', 'display', 'none' );
                
                break;
           */
           
           
            case 'dummy':
                break;
            }               
        }, 

        // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
        //                        action status bar (ie: the HTML links in the status bar).
        //  
        onUpdateActionButtons: function( stateName, args )
        {
            console.log( 'onUpdateActionButtons: '+stateName, args );
                      
            if( this.isCurrentPlayerActive() )
            {            
                switch( stateName )
                {
                 case 'playerTurn':
                 case 'resolveDamage':   

                    this.addActionButton('actPlay-btn', _('Play Cards'), () => this.onPlayCards(stateName), null, null, 'blue');
                    dojo.addClass('actPlay-btn', 'disabled');
                    this.addActionButton('actPass-btn', _('Pass'), () => this.bgaPerformAction("actPass"), null, null, 'gray'); 
                    break;
                }
            }
        },       

        onPlayCards: function(stateName) {
            switch ( stateName )
            {
                case 'playerTurn':
                    var items = this.playerHand.getSelectedItems();
                    var card_ids = items.map(items => items.id).join(',');
                    console.log("Card Played:")
                    console.log(card_ids);
                    this.bgaPerformAction('actPlayCard', {card_ids : card_ids});
                    this.playerHand.unselectAll();
                break
                case 'resolveDamage':
                    var items = this.playerHand.getSelectedItems();
                    var card_ids = items.map(items => items.id).join(',');
                    console.log("Card(s) Discarded:")
                    console.log(card_ids);
                    this.bgaPerformAction('actDiscardCards', {card_ids : card_ids});
                break
        }
        },

        ///////////////////////////////////////////////////
        //// Utility methods
        
        /*
        
            Here, you can defines some utility methods that you can use everywhere in your javascript
            script.
        
        */

        getCardUniqueId : function(color, value) {
            return (color - 1) * 13 + (value - 2);
        },

        playCardOnTable : function(player_id, color, value, card_id) {
            this.addTableCard(value, color, player_id);
            // player_id => direction
            // if (player_id != this.player_id) {
            //     this.placeOnObject('cardontable_' + player_id, 'overall_player_board_' + player_id);
            // } else {
            //     // You Play, remove card and add to table
            if ($('myhand_item_' + card_id)) {
                //this.placeOnObject('cardontable_' + player_id, 'myhand_item_' + card_id);
                this.playerHand.removeFromStockById(card_id);
                 }
                 
            // }
            // Place in location
            //this.slideToObject('cardontable_' + player_id, 'playertablecard_' + player_id).play();
        },

        placeDeck : function(location, color, value, card_id) {
            const x = value - 2;
            const y = color - 1;
            document.getElementById(location + '_deck').insertAdjacentHTML('beforeend', `
                <div class="card cardontable" id="cardontable_$" style="background-position:-${x}00% -${y}00%"></div>
                `);
        },

        addTableCard: function(value, color, playerTableId ) {
            const x = value - 2;
            const y = color - 1;
            document.getElementById('playertablecard_' + playerTableId).insertAdjacentHTML('beforeend', `
                <div class="card cardontable" id="cardontable_${playerTableId}" style="background-position:-${x}00% -${y}00%"></div>
                `);
        },

        removeFromHand: function(card_id, color, value, discardCount) {
            if ($('myhand_item_' + card_id)) {
                this.playerHand.removeFromStockById(card_id);
                }
            const x = value - 2;
            const y = color - 1;
            document.getElementById('discard_deck').innerHTML = `
                <div class="card cardontable" style="background-position:-${x}00% -${y}00%"></div>
                <div class="deckcount">${discardCount}</div>
                `;

        },

        updateRegent: function(damage, health) {
            document.getElementById("court_header").innerHTML = `
            <div>♥: ${health}   ♧: 10  </div>`;
        },
        ///////////////////////////////////////////////////
        //// Player's action
        
        /*
        
            Here, you are defining methods to handle player's action (ex: results of mouse click on 
            game objects).
            
            Most of the time, these methods:
            _ check the action is possible at this game state.
            _ make a call to the game server
        
        */
        

        onPlayerHandSelectionChanged: function() {
            var items = this.playerHand.getSelectedItems();
            // if (items.length > 0) {
            //     var action = 'actPlayCard';
            //     if (this.checkAction(action, true)) {
            //         //Can Play Card
            //         var card_id = items[0].id;
            //         // ID is (color - 1) * 13 + value - 2
            //         this.bgaPerformAction(action, {
            //             card_id : card_id,
            //         });
            //         var type = items[0].type;
            //         var color = Math.floor(type / 13) + 1;
            //         var value = type % 13 + 2;

            //         console.log("Card " + color + " " + value + " by " + this.player_id)
            //         this.playerHand.unselectAll();
            //     } else if (this.checkAction('actGiveCards')) {
            //         // Let player Select some cards
            //     } else {
            //         this.playerHand.unselectAll();
            //     }
            // }
            if( this.isCurrentPlayerActive() ) {
                if (items.length == 0) {
                    dojo.addClass('actPlay-btn', 'disabled');
                } else {
                    dojo.removeClass('actPlay-btn', 'disabled')
                }
            }
        },

        
        ///////////////////////////////////////////////////
        //// Reaction to cometD notifications

        /*
            setupNotifications:
            
            In this method, you associate each of your game notifications with your local method to handle it.
            
            Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                  your regicidec.game.php file.
        
        */
                  setupNotifications : function() {
                    console.log('notifications subscriptions setup');
        
                    const notifs = [
                        ['newHand', 1],
                        ['playCard', 100],
                        ['discard', 101],
                        ['hurtRegent', 900],
                        ['trickWin', 1000],
                        ['giveAllCardsToPlayer', 600],
                    ];
            
                    notifs.forEach((notif) => {
                        dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
                        this.notifqueue.setSynchronous(notif[0], notif[1]);
                    });
        
                },

                // HANDLING METHODS
        
                notif_newHand : function(notif) {
                    // We received a new full hand of 13 cards.
                    this.playerHand.removeAll();
        
                    for ( var i in notif.args.cards) {
                        var card = notif.args.cards[i];
                        var color = card.type;
                        var value = card.type_arg;
                        this.playerHand.addToStockWithId(this.getCardUniqueId(color, value), card.id);
                    }
                },
                notif_discard : function(notif) {
                    // Player Discarded
                    this.removeFromHand(notif.args.card_id, notif.args.color, notif.args.value, notif.args.discardCount);
                },

                notif_playCard : function(notif) {
                    // Play a card on the table
                    this.playCardOnTable(notif.args.player_id, notif.args.color, notif.args.value, notif.args.card_id);
                },
                
                notif_hurtRegent : function(notif) {
                    this.updateRegent(notif.args.damage, notif.args.health);
                },

                notif_trickWin : function(notif) {
                    // We do nothing here (just wait in order players can view the 4 cards played before they're gone.
                },
                notif_giveAllCardsToPlayer : function(notif) {
                    // Move all cards on table to given table, then destroy them
                    var winner_id = notif.args.player_id;
                    for ( var player_id in this.gamedatas.players) {
                        var anim = this.slideToObject('cardontable_' + player_id, 'overall_player_board_' + winner_id);
                        dojo.connect(anim, 'onEnd', function(node) {
                            dojo.destroy(node);
                        });
                        anim.play();
                    }
                },
   });             
});
