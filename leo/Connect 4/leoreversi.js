/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * leoReversi implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * leoreversi.js
 *
 * leoReversi user interface script
 * 
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */

define([
    "dojo","dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter"
],
function (dojo, declare) {
    return declare("bgagame.leoreversi", ebg.core.gamegui, {
        constructor: function(){
            console.log('leoreversi constructor');
              
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

            // Example to add a div on the game area
            document.getElementById('game_play_area').insertAdjacentHTML('beforeend', `
                <div id="board">
                    <div id="discs"></div>
                </div>
            `);
            
            // TODO: Set up your game interface here, according to "gamedatas"
            const board = document.getElementById('board');
            const hor_scale = 73.9;
            const ver_scale = 71.5;
            for (let x=1; x<=7; x++) {
                for (let y=1; y<=7; y++) {
                    const left = Math.round((x - 1) * hor_scale + 15);
                    const top = Math.round((y - 1) * ver_scale + 20);
                    // we use afterbegin to make sure squares are placed before discs
                    board.insertAdjacentHTML(`afterbegin`, `<div id="square_${x}_${y}" class="square" style="left: ${left}px; top: ${top}px;"></div>`);
                }
            }

            for( var i in gamedatas.board )
            {
                var square = gamedatas.board[i];
                
                if( square.player !== null )
                {
                    this.addDiscOnBoard( square.x, square.y, square.player );
                }
            } 

            document.querySelectorAll('.square').forEach(square => square.addEventListener('click', e => this.onPlayDisc(e)));
 
            // Setup game notifications to handle (see "setupNotifications" method below)
            this.setupNotifications();

            console.log( "Ending game setup" );

        },


        onPlayDisc: function( evt )
        {
            // Stop this event propagation
            evt.preventDefault();
            evt.stopPropagation();

            // Get the cliqued square x and y
            // Note: square id format is "square_X_Y"
            var coords = evt.currentTarget.id.split('_');
            var x = coords[1];
            var y = coords[2];

            if(!document.getElementById(`square_${x}_${y}`).classList.contains('possibleMove')) {
                // This is not a possible move => the click does nothing
                return ;
            }

            this.bgaPerformAction("actPlayDisc", {
                x:x,
                y:y
            });
        },
       

        ///////////////////////////////////////////////////
        //// Game & client states
        
        // onEnteringState: this method is called each time we are entering into a new game state.
        //                  You can use this method to perform some user interface changes at this moment.
        //
        onEnteringState: function( stateName, args )
        {
            console.log( 'Entering state: '+stateName );
            
            switch( stateName )
            {
            case 'playerTurn':
                this.updatePossibleMoves( args.args.possibleMoves );
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

                    this.addActionButton('actPass-btn', _('Pass'), () => this.bgaPerformAction("actPass"), null, null, 'gray'); 
                    break;
                }
            }
        },        

        ///////////////////////////////////////////////////
        //// Utility methods

        addDiscOnBoard: function( x, y, player )
        {
            var color = this.gamedatas.players[ player ].color;
            
            document.getElementById('discs').insertAdjacentHTML('beforeend', `<div class="disc" data-color="${color}" id="disc_${x}${y}"></div>`);
            
            this.placeOnObject( `disc_${x}${y}`, 'square_'+x+'_1' );
            this.slideToObject( `disc_${x}${y}`, 'square_'+x+'_'+y ).play();
        }, 

        updatePossibleMoves: function( possibleMoves )
        {
            // Remove current possible moves
            document.querySelectorAll('.possibleMove').forEach(div => div.classList.remove('possibleMove'));

            for( var x in possibleMoves )
            {
                for( var y in possibleMoves[ x ] )
                {
                    // x,y is a possible move
                    document.getElementById(`square_${x}_${y}`).classList.add('possibleMove');
                }            
            }
                        
            this.addTooltipToClass( 'possibleMove', '', _('Place a disc here') );
        },                  
        
        /*
        
            Here, you can defines some utility methods that you can use everywhere in your javascript
            script.
        
        */


        ///////////////////////////////////////////////////
        //// Player's action
        
        /*
        
            Here, you are defining methods to handle player's action (ex: results of mouse click on 
            game objects).
            
            Most of the time, these methods:
            _ check the action is possible at this game state.
            _ make a call to the game server
        
        */   

        
        ///////////////////////////////////////////////////
        //// Reaction to cometD notifications

        /*
            setupNotifications:
            
            In this method, you associate each of your game notifications with your local method to handle it.
            
            Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                  your leoreversi.game.php file.
        
        */
        setupNotifications: function()
        {
            console.log( 'notifications subscriptions setup' );

            const notifs = [
                ['playDisc', 500],
                ['turnOverDiscs', 1500],
                ['newScores', 1],
            ];
    
            notifs.forEach((notif) => {
                dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
                this.notifqueue.setSynchronous(notif[0], notif[1]);
            });
        },  

        notif_playDisc: function( notif )
        {
            // Remove current possible moves (makes the board more clear)
            document.querySelectorAll('.possibleMove').forEach(div => div.classList.remove('possibleMove'));

            this.addDiscOnBoard( notif.args.x, notif.args.y, notif.args.player_id );
        },


        notif_turnOverDiscs: function( notif )
        {
            // Get the color of the player who is returning the discs
            var targetColor = this.gamedatas.players[ notif.args.player_id ].color;

            // Made these discs blinking and set them to the specified color
            for( var i in notif.args.turnedOver )
            {
                var disc = notif.args.turnedOver[ i ];
                
                // Make the disc blink 2 times
                var anim = dojo.fx.chain( [
                    dojo.fadeOut( { node: 'disc_'+disc.x+''+disc.y } ),
                    dojo.fadeIn( { node: 'disc_'+disc.x+''+disc.y } ),
                    dojo.fadeOut( { 
                                    node: 'disc_'+disc.x+''+disc.y,
                                    onEnd: node => $(node).dataset.color = targetColor,
                                    } ),
                    dojo.fadeIn( { node: 'disc_'+disc.x+''+disc.y  } )
                                    
                ] ); // end of dojo.fx.chain

                // ... and launch the animation
                anim.play();                
            }
        },


        notif_newScores: function( notif )
        {
            for( var player_id in notif.args.scores )
            {
                var newScore = notif.args.scores[ player_id ];
                this.scoreCtrl[ player_id ].toValue( newScore );
            }
        },
   });             
});
