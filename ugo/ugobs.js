/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * UgoBS implementation : © Ugo Anyaegbunam anyaegbunamu@carleton.edu
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * ugobs.js
 *
 * UgoBS user interface script
 * 
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */

 // Constants
 const PLACEMENTS = ['my', 'left', 'top', 'right']
 const DIRECTIONS = ['S', 'W', 'N', 'E']
 const PLAYERID_TO_DIRECTION = {}
 const card_back_type_id = 60; 


define([
    "dojo","dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock"
],
function (dojo, declare) {
    return declare("bgagame.ugobs", ebg.core.gamegui, {
        constructor: function(){
            console.log('ugobs constructor');
              
            // Global variables
            this.cardwidth = 72;
            this.cardheight = 96;
            this.playerHands = [];

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

            // Create a way to reference divs by id without having to stop creating them dynamically
            const orderedPlayers = this.getOrderedPlayers(gamedatas);
            for (let i in orderedPlayers) {
                PLAYERID_TO_DIRECTION[orderedPlayers[i].id] = i;
            }

            // HTML layout (Game Interface)
            document.getElementById('game_play_area').insertAdjacentHTML('beforeend', `
                <div id="game_board_wrap"> 
                    <div id="game_board">
                        <div id="bs_button">BS</div>
                        <div id="pass_button">Pass</div>
                        <div id="play_button">Play</div>
                        ${
                            orderedPlayers.map((player, index) => `
                            <div id ="${PLACEMENTS[index]}_hand_wrap" class="whiteblock ">
                                <b id="${PLACEMENTS[index]}_hand_label" style="color:#${player.color};">${PLACEMENTS[index] === 'my' ? "My hand" : player.name + "'s hand"}</b>
                                <div id="${PLACEMENTS[index]}_hand">
                                    <div class="playertablecard"></div>
                                </div>
                            </div>
                            `).join('')
                        }
                        <div id="card_pile" class="whiteblock">
                            <div class="playertablename">Card Pile</div>
                            <div class="playertablecard" id="playertablecard_pile"></div>
                        </div>

                        <div id="revealed_card_pile">
                            <div class="playertablecard" id="revealed_playertablecard_pile"></div>
                        </div>
                    </div>
                </div>
            `);
            

            // Player hand
            this.playerHand = new ebg.stock();
            this.playerHand.create(this, $('my_hand'), this.cardwidth, this.cardheight);
            this.playerHand.centerItems = true;
            this.playerHand.image_items_per_row = 13;
            this.playerHand.apparenceBorderWidth = '2px'; // Change border width when selected
            this.playerHand.setSelectionMode(2); // Select only a single card
            this.playerHand.horizontal_overlap = 28;
            this.playerHand.item_margin = 0;
            this.playerHands.push(this.playerHand);

            // Left hand
            this.leftHand = new ebg.stock();
            this.leftHand.create(this, $('left_hand'), this.cardwidth, this.cardheight);
            this.leftHand.centerItems = true;
            this.leftHand.image_items_per_row = 13;
            this.leftHand.apparenceBorderWidth = '2px'; // Change border width when selected
            this.leftHand.setSelectionMode(0); // Select only a single card
            this.leftHand.horizontal_overlap = 28;
            this.leftHand.item_margin = 0;
            this.playerHands.push(this.leftHand);

            // Top hand
            this.topHand = new ebg.stock();
            this.topHand.create(this, $('top_hand'), this.cardwidth, this.cardheight);
            this.topHand.centerItems = true;
            this.topHand.image_items_per_row = 13;
            this.topHand.apparenceBorderWidth = '2px'; // Change border width when selected
            this.topHand.setSelectionMode(0); // Select only a single card
            this.topHand.horizontal_overlap = 28;
            this.topHand.item_margin = 0;
            this.playerHands.push(this.topHand);

            // Right hand
            this.rightHand = new ebg.stock();
            this.rightHand.create(this, $('right_hand'), this.cardwidth, this.cardheight);
            this.rightHand.centerItems = true;
            this.rightHand.image_items_per_row = 13;
            this.rightHand.apparenceBorderWidth = '2px'; // Change border width when selected
            this.rightHand.setSelectionMode(0); // Select only a single card
            this.rightHand.horizontal_overlap = 28;
            this.rightHand.item_margin = 0;
            this.playerHands.push(this.rightHand);

            // Link functions to buttons
            dojo.connect(dojo.byId("play_button"), 'click', this, 'playSelectedCards');
            dojo.connect(dojo.byId("bs_button"), 'click', this, 'callBS');
            dojo.connect(dojo.byId("pass_button"), 'click', this, 'passBSCall');

            // Create cards types:
            for (let color = 1; color <= 4; color++)
                for (let value = 2; value <= 14; value++) {
                    // Build card type id
                    const card_type_id = this.getCardUniqueId(color, value);
                    // Change card image style according to the preference option
                    this.playerHand.addItemType(card_type_id, card_type_id, g_gamethemeurl + 'img/cards1_cropped.jpg', card_type_id);
                    this.leftHand.addItemType(card_type_id, card_type_id, g_gamethemeurl + 'img/cards1_cropped.jpg', card_type_id);
                    this.topHand.addItemType(card_type_id, card_type_id, g_gamethemeurl + 'img/cards1_cropped.jpg', card_type_id);
                    this.rightHand.addItemType(card_type_id, card_type_id, g_gamethemeurl + 'img/cards1_cropped.jpg', card_type_id);

                }

            // Add card backs to hands
            this.playerHand.addItemType(card_back_type_id, card_back_type_id, g_gamethemeurl + 'img/cards1_cropped_with_back.jpg', 12);
            this.leftHand.addItemType(card_back_type_id, card_back_type_id, g_gamethemeurl + 'img/cards1_cropped_with_back.jpg', 12);
            this.topHand.addItemType(card_back_type_id, card_back_type_id, g_gamethemeurl + 'img/cards1_cropped_with_back.jpg', 12);
            this.rightHand.addItemType(card_back_type_id, card_back_type_id, g_gamethemeurl + 'img/cards1_cropped_with_back.jpg', 12);

            // Cards in player's hand
            for (let i in gamedatas.hand) {
                const card = gamedatas.hand[i];
                const color = card.type;
                const value = card.type_arg;
                this.playerHand.addToStockWithId(this.getCardUniqueId(color, value), card.id);
            }

            // Gameplay hindered when more cards are displayed so we display at most 13
            // Cards in left hand
            left_player = this.getOrderedPlayers(gamedatas)[1].id;
            for (let i = 0; i < Math.min(13, gamedatas.numCards[left_player]); i++) {
                this.leftHand.addToStock(card_back_type_id, 'overall_player_board_' + left_player);
            }
            // Cards in top hand
            top_player = this.getOrderedPlayers(gamedatas)[2].id;
            for (let i = 0; i < Math.min(13, gamedatas.numCards[top_player]); i++) {
                this.topHand.addToStock(card_back_type_id, 'overall_player_board_' + top_player);
            }
            // Cards in right hand
            right_player = this.getOrderedPlayers(gamedatas)[3].id;
            for (let i = 0; i < Math.min(13, gamedatas.numCards[right_player]); i++) {
                this.rightHand.addToStock(card_back_type_id, 'overall_player_board_' + right_player);
            }
            // Cards played on table
            for (let i in gamedatas.cardsontable) {
                const card = gamedatas.cardsontable[i];
                const color = card.type;
                const value = card.type_arg;
                const player_id = card.location_arg;
                this.addTableCard(value, color, player_id, card.id, "back");
            }            
 
            // Setup game notifications to handle (see "setupNotifications" method below)
            this.setupNotifications();

            console.log( "Ending game setup" );
        },

       

        // I don't do anything here, not really necessary for this game in my opinion
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
                      
        },        

        ///////////////////////////////////////////////////
        //// Utility methods
        
        /*
        
            Here, you can defines some utility methods that you can use everywhere in your javascript
            script.
        
        */

        // Returns players in order of play
        getOrderedPlayers(gamedatas) {
            const players = Object.values(gamedatas.players).sort((a, b) => a.playerNo - b.playerNo);
            const playerIndex = players.findIndex(player => Number(player.id) === Number(this.player_id));
            const orderedPlayers = playerIndex > 0 ? [...players.slice(playerIndex), ...players.slice(0, playerIndex)] : players;
            return orderedPlayers;
        },

        // Random number for showing other player card play
        getRandomIndex(handSize) { return Math.floor(Math.random() * (handSize + 1));},

        // Animates cards being played
        playCardOnTable : function(player_id, color, value, card_id, handSize) {
            this.addTableCard(value, color, player_id, card_id, "back");

            if (player_id != this.player_id) {
                // Some opponent played a card
                // 1) See bottom of file
                index = this.getRandomIndex(handSize);
                playerHandId = PLACEMENTS[PLAYERID_TO_DIRECTION[player_id]] + '_hand';
                handDiv = document.getElementById(playerHandId);
                divsArray = Array.from(handDiv.querySelectorAll('.stockitem'));
                divId = divsArray[index].id;
                this.placeOnObject('cardontable_' + card_id, divId);
                this.slideToObject('cardontable_' + card_id, 'playertablecard_pile').play();
                this.playerHands[PLAYERID_TO_DIRECTION[player_id]].removeFromStock(card_back_type_id);
            } else {
                // You played a card. If it exists in your hand, move card from there and remove
                // corresponding item
                if ($('my_hand_item_' + card_id)) {
                    this.placeOnObject('cardontable_' + card_id, 'my_hand_item_' + card_id);
                    this.slideToObject('cardontable_' + card_id, 'playertablecard_pile').play();
                    this.playerHand.removeFromStockById(card_id);
                }
            }
            console.log("Just showed the card being played");
        },

        // Initializes the div we use to show the card being played and that will sit in the pile
        addTableCard(value, color, card_player_id, card_id, side) {
            const x = value - 2;
            const y = color - 1;
            if (side == 'back') {
                document.getElementById('playertablecard_pile').insertAdjacentHTML('beforeend', `
                    <div class="card cardontable" id="cardontable_${card_id}" style="background-position:-1400% -00%"></div>
                `);
            } else {
            document.getElementById('revealed_playertablecard_pile').insertAdjacentHTML('beforeend', `
                <div class="card cardontable" id="revealed_cardontable_${card_id}" style="background-position:-${x}00% -${y}00%"></div>
            `);
            console.log("Just created table card div")
            }

        },
        
        // Animates giving cards to players
        giveCard(player_id, color, value, card_id) {
            givenCard = '';
            
            if ($('revealed_cardontable_' + card_id)) {
                from = 'revealed_playertablecard_pile';
                givenCard = document.getElementById('revealed_cardontable_' + card_id);
            } 
            else if ($('cardontable_' + card_id)) {
                from = 'playertablecard_pile';
                givenCard = document.getElementById('cardontable_' + card_id);
            } 



            if (player_id != this.player_id) {
                // Some opponent played a card
                this.slideToObjectAndDestroy(givenCard, PLACEMENTS[PLAYERID_TO_DIRECTION[player_id]] + '_hand').play();
                this.playerHands[PLAYERID_TO_DIRECTION[player_id]].addToStock(card_back_type_id);
            } else {
                // You played a card. If it exists in your hand, move card from there and remove
                givenCard.remove();
                this.playerHand.addToStockWithId(this.getCardUniqueId(color, value), card_id, from);
            }
            console.log("Just showed card being given");
        },

        // Animates card reveal
        revealCardOnTable : function(player_id, color, value, card_id) {
            this.addTableCard(value, color, player_id, card_id, "front");

            // Move card from pile to side and reveal
            if ($('cardontable_' + card_id)) {
                this.placeOnObject('revealed_cardontable_' + card_id, 'cardontable_' + card_id);
            } 

            this.slideToObject('revealed_cardontable_' + card_id, 'revealed_playertablecard_pile').play();
            divToDelete = document.getElementById('cardontable_' + card_id);
            divToDelete.remove();
            console.log("Just animated card being given");
        },
    
        // Get card unique identifier based on its color and value
        getCardUniqueId: function (color, value) {
            return (color - 1) * 13 + (value - 2);
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
        
        // Send play to server
        playSelectedCards : function() {
            var items = this.playerHand.getSelectedItems();

            if (items.length > 4) {this.showMessage(_('You may play at most 4 cards'), "error");}

            if (items.length > 0) {
                var action = 'actPlayCard';
                if (this.checkAction(action, true)) {
                    // Can play a card
                    var card_ids = items.map(card => card.id).join(',');  
                    this.bgaPerformAction(action, {
                        card_ids : card_ids,
                    });

                    this.playerHand.unselectAll();
                } else {
                    this.playerHand.unselectAll();
                }
            }
            console.log("Just sent card play to server");
        },

        // Send BS call to server
        callBS: function() {
            var decision = 1;
            var action = "actSubmitDecision"
            if (this.checkAction(action, true)) {
                this.bgaPerformAction(action, {decision : decision});                
                this.showMessage(_('You have elected to call BS'));

            }
            console.log("Just sent BS Call to server");
        },

        // Send pass of BS call to server
        passBSCall : function() {
            var decision = 0;
            var action = "actSubmitDecision"
            if (this.checkAction(action, true)) {
                this.bgaPerformAction(action, {decision : decision});
                this.showMessage(_('You have elected to pass'))
            }
            console.log("Just sent passBSCall to server");
        },

        
        ///////////////////////////////////////////////////
        //// Reaction to cometD notifications

        /*
            setupNotifications:
            
            In this method, you associate each of your game notifications with your local method to handle it.
            
            Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                  your ugobs.game.php file.
        
        */
        setupNotifications: function()
        {
            console.log( 'notifications subscriptions setup' );
            
            // Associate your game notifications with local methods
            
            const notifs = [
                ['newHand', 1],
                ['playCard', 100],
            ];
            
            const delayedNotifs = [
                ['BSCalled', 101],
                ['BSHandled', 102]
            ]
    
            notifs.forEach((notif) => {
                dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
                this.notifqueue.setSynchronous(notif[0], 1000);
            });

            delayedNotifs.forEach((notif) => {
                dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
                this.notifqueue.setSynchronous(notif[0], 2000);
            });
        },

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

        notif_playCard : function(notif) {
            // Card has been played on the table
            var handSize = notif.args.handSize;
            for (var i in notif.args.cards) {
                var card = notif.args.cards[i];
                var color = card.type;
                var value = card.type_arg;
                var card_id = card.id;
                this.playCardOnTable(notif.args.player_id, color, value, card_id, handSize);
            }
        },
        
        notif_BSCalled : function(notif) {
            // Someone called BS
            var card = notif.args.card;
            var color = card.type;
            var value = card.type_arg;
            var card_id = card.id;
            this.revealCardOnTable(notif.args.player_id, color, value, card_id)


        },

        notif_BSHandled : function(notif) {
            // The BS call has been resolved
            for (var i in notif.args.cards) {
                var card = notif.args.cards[i];
                var color = card.type;
                var value = card.type_arg;
                var card_id = card.id;
                this.giveCard(notif.args.player_id, color, value, card_id)
            }
        }
   });             
});

// 1)  I had to do that div silliness because of the way stock works. Since it is a card back and doesn't have a specific id,
// the div instances are created dynamically as stockitem1, stockitem2, etc. However, when the first one dissapears after I remove it, the next element to be removed
// would be 2, but if they refreshed the screen, it would go back to 1. I didn't want to do a bunch of crazy checking to predict div names so I figured I'd just literally
// round up all the divs.