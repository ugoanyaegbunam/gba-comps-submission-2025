<?php
/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * RegicideC implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * Game.php
 *
 * This is the main file for your game logic.
 *
 * In this PHP file, you are going to defines the rules of the game.
 */
declare(strict_types=1);

namespace Bga\Games\RegicideC;

require_once(APP_GAMEMODULE_PATH . "module/table/table.game.php");

use \Bga\GameFramework\Actions\Types\IntArrayParam;

class Game extends \Table
{
    private static array $CARD_TYPES;
    private $cards;
    private $court_cards;

    /**
     * Your global variables labels:
     *
     * Here, you can assign labels to global variables you are using for this game. You can use any number of global
     * variables with IDs between 10 and 99. If your game has options (variants), you also have to associate here a
     * label to the corresponding ID in `gameoptions.inc.php`.
     *
     * NOTE: afterward, you can get/set the global variables with `getGameStateValue`, `setGameStateInitialValue` or
     * `setGameStateValue` functions.
     */
    public function __construct()
    {
        parent::__construct();

        $this->initGameStateLabels([
            "regentHealth" => 10,
            "spadeCount" => 11,
            "cardValue" => 12, // Value of played cards
            "cardSuit" => 13, // Encoded in Binary: Spade = 8, heart = 4, diamond = 2, club = 1
        ]); 
        
        $this->cards = $this-> getNew( "module.common.deck");
        $this->cards->init( "card" );

    }

    /**
     * Player action, example content.
     *
     * In this scenario, each time a player plays a card, this method will be called. This method is called directly
     * by the action trigger on the front side with `bgaPerformAction`.
     *
     * @throws BgaUserException
     */
 
    function actPlayCard(#[IntArrayParam] array $card_ids) {
        $player_id = $this->getActivePlayerId();
        $this->cards->moveCards($card_ids, 'cardsontable', $player_id);
        // XXX check rules here
        $value = 0;
        $suit = 0;
        $spade = false;
        $heart = false;
        $diamond = false;
        $club = false;

        foreach ($card_ids as $card_id) {
        $currentCard = $this->cards->getCard($card_id);
        // And notify
            if ($currentCard['type_arg'] == 14) {
                $value += 1;
            } else {
                $value += $currentCard['type_arg'];
            }
            switch ($currentCard['type']) {
                case 1:
                    $spade = true;
                    break;
                case 2:
                    $heart = true;
                    break;
                case 4:
                    $diamond = true;
                    break;
                case 3:
                    $club = true;
                    break;
            }

            $this->notifyAllPlayers('playCard', '${player_name} plays card', array('player_name' => $this->getActivePlayerName(),
            'player_id' => $player_id, 'color' => $currentCard ['type'], 'value' => $currentCard ['type_arg'], 'card_id' => $card_id));
        }
        if ($spade) {
            $suit += 8;
        } if ($heart) {
            $suit += 4;
        } if ($diamond) {
            $suit += 2;
        } if ($club) {
            $suit += 1;
        }
        $this->setGameStateValue('cardValue', $value);
        $this->setGameStateValue('regentHealth',$this->getGameStateValue('regentHealth') - $value );
        $this->notifyAllPlayers('hurtRegent', 'Regent takes ${damage}, ${health} health remains. Suits Played ${suit}', array('damage' => $value,
            'health' => $this->getGameStateValue('regentHealth'), 'suit' => $suit));
        // Next player
        $this->gamestate->nextState('playCard');
    }

    function actDiscardCards(#[IntArrayParam] array $card_ids) {
        $player_id = $this->getActivePlayerId();
        $this->cards->moveCards($card_ids, 'discard', $player_id);
        // XXX check rules here
        foreach ($card_ids as $card_id) {
        $currentCard = $this->cards->getCard($card_id);
        // And notify
            $this->notifyAllPlayers('discard', '${player_name} discards card', array('player_name' => $this->getActivePlayerName(),
            'player_id' => $player_id, 'color' => $currentCard ['type'],
             'value' => $currentCard ['type_arg'], 'card_id' => $card_ids[0],
              'discardCount' => $this->cards->countCardsInLocation('discard')));
        }
        // Next player
        $this->gamestate->nextState('resolved');
    }

    public function actPass(): void
    {
        // Retrieve the active player ID.
        $player_id = (int)$this->getActivePlayerId();

        // Notify all players about the choice to pass.
        $this->notifyAllPlayers("cardPlayed", clienttranslate('${player_name} passes'), [
            "player_id" => $player_id,
            "player_name" => $this->getActivePlayerName(),
        ]);

        // at the end of the action, move to the next state
        $this->gamestate->nextState("pass");
    }

    /**
     * Game state arguments, example content.
     *
     * This method returns some additional information that is very specific to the `playerTurn` game state.
     *
     * @return array
     * @see ./states.inc.php
     */
    public function argGiveCards() {
        return array ();
    }

    public function argPlayedCards() {
        return [
            "suit" => $this->getGameStateValue("cardSuit"),
            "value" => $this->getGameStateValue("cardValue"),
        ];
    }


    /**
     * Compute and return the current game progression.
     *
     * The number returned must be an integer between 0 and 100.
     *
     * This method is called each time we are in a game state with the "updateGameProgression" property set to true.
     *
     * @return int
     * @see ./states.inc.php
     */
    public function getGameProgression()
    {
        // TODO: compute and return the game progression

        return 0;
    }

    /**
     * Game state action, example content.
     *
     * The action method of state `nextPlayer` is called everytime the current game state is set to `nextPlayer`.
     */

    public function stNewHand() {
        $this->cards->shuffle('deck');

        $this->setGameStateValue('regentHealth', 20);

        $players = $this->loadPlayersBasicInfos();

        $cardcount = 8;
        $playercount = count($players);
        if ($playercount == 2) {
            $cardcount = 7;
        } elseif ($playercount == 3) {
            $cardcount = 6;
        } elseif ($playercount == 4) {
            $cardcount = 5;
        }

        foreach ( $players as $player_id => $player ) {
            $cards = $this->cards->pickCards($cardcount, 'deck', $player_id);
            // Notify player about their cards
            $this->notifyPlayer($player_id, 'newHand', '', array ('cards' => $cards ));
        }
        $this->cards->moveAllCardsInLocation('deck', 'draw');

        $this->gamestate->nextState("");
    }

    public function stSuitPower(){

        $this->gamestate->nextState("resolve");
        //$this->gamestate->nextState("regicide");
    }


    function stNextPlayer() {
        // Active next player OR end the trick and go to the next trick OR end the hand
        // if ($this->cards->countCardInLocation('cardsontable') == 4) {
        //     // This is the end of the trick
        //     // Move all cards to "cardswon" of the given player
        //     $best_value_player_id = $this->activeNextPlayer(); // TODO figure out winner of trick
        //     $this->cards->moveAllCardsInLocation('cardsontable', 'cardswon', null, $best_value_player_id);
            
        //     // Notify
        //     // Note: we use 2 notifications here in order we can pause the display during the first notification
        //     //  before we move all cards to the winner (during the second)
        //     $players = $this->loadPlayersBasicInfos();
        //     $this->notifyAllPlayers( 'trickWin', clienttranslate('${player_name} wins the trick'), array(
        //         'player_id' => $best_value_player_id,
        //         'player_name' => $players[ $best_value_player_id ]['player_name']
        //     ) );            
        //     $this->notifyAllPlayers( 'giveAllCardsToPlayer','', array(
        //         'player_id' => $best_value_player_id
        //     ) );

        //     if ($this->cards->countCardInLocation('hand') == 0) {
        //         // End of the hand
        //         $this->gamestate->nextState("endHand");
        //     } else {
        //         // End of the trick
        //         $this->gamestate->nextState("nextTrick");
        //     }

            $this->activeNextPlayer();
            $this->gamestate->nextState('nextPlayer');
        }
    


    /**
     * Migrate database.
     *
     * You don't have to care about this until your game has been published on BGA. Once your game is on BGA, this
     * method is called everytime the system detects a game running with your old database scheme. In this case, if you
     * change your database scheme, you just have to apply the needed changes in order to update the game database and
     * allow the game to continue to run with your new version.
     *
     * @param int $from_version
     * @return void
     */
    public function upgradeTableDb($from_version)
    {
//       if ($from_version <= 1404301345)
//       {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "ALTER TABLE DBPREFIX_xxxxxxx ....";
//            $this->applyDbUpgradeToAllDB( $sql );
//       }
//
//       if ($from_version <= 1405061421)
//       {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
//            $this->applyDbUpgradeToAllDB( $sql );
//       }
    }

    /*
     * Gather all information about current game situation (visible by the current player).
     *
     * The method is called each time the game interface is displayed to a player, i.e.:
     *
     * - when the game starts
     * - when a player refreshes the game page (F5)
     */
    protected function getAllDatas()
    {
        $result = [];

       // return information visible by the current player.
        $current_player_id = (int) $this->getCurrentPlayerId();

        $result['hand'] = $this->cards->getPlayerHand( $current_player_id );

        $result['cardsontable'] = $this->cards->getCardsInLocation( 'cardsontable');

        $result['courtcard'] = $this->cards-> getCardOnTop('court');
        $result['discardedcard'] = $this->cards-> getCardOnTop('discard');

        $result['courtcount'] = $this->cards->countCardsInLocation( 'court');
        $result['drawcount'] = $this->cards->countCardsInLocation( 'draw');
        $result['discardcount'] = $this->cards->countCardsInLocation('discard');

        $result['regentHealth'] = $this->getGameStateValue('regentHealth');
        // Get information about players.
        // NOTE: you can retrieve some extra field you added for "player" table in `dbmodel.sql` if you need it.
        $result["players"] = $this->getCollectionFromDb(
            "SELECT `player_id` `id`, `player_score` `score` FROM `player`"
        );

        
        return $result;
    }

    /**
     * Returns the game name.
     *
     * IMPORTANT: Please do not modify.
     */
    protected function getGameName()
    {
        return "regicidec";
    }

    /**
     * This method is called only once, when a new game is launched. In this method, you must setup the game
     *  according to the game rules, so that the game is ready to be played.
     */
    protected function setupNewGame($players, $options = [])
    {
        // Set the colors of the players with HTML color code. The default below is red/green/blue/orange/brown. The
        // number of colors defined here must correspond to the maximum number of players allowed for the gams.
        $gameinfos = $this->getGameinfos();
        $default_colors = $gameinfos['player_colors'];

        foreach ($players as $player_id => $player) {
            // Now you can access both $player_id and $player array
            $query_values[] = vsprintf("('%s', '%s', '%s', '%s', '%s')", [
                $player_id,
                array_shift($default_colors),
                $player["player_canal"],
                addslashes($player["player_name"]),
                addslashes($player["player_avatar"]),
            ]);
        }

        // Create players based on generic information.
        //
        // NOTE: You can add extra field on player table in the database (see dbmodel.sql) and initialize
        // additional fields directly here.
        static::DbQuery(
            sprintf(
                "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar) VALUES %s",
                implode(",", $query_values)
            )
        );

        $this->reattributeColorsBasedOnPreferences($players, $gameinfos["player_colors"]);
        $this->reloadPlayersBasicInfos();

        // Init global values with their initial values.

        $this->setGameStateInitialValue( 'regentHealth', 20 );
        $this->setGameStateInitialValue( 'spadeCount', 0 );

        $cards = array ();
        $court_cards = array ();

        $this->colors = array(
            1 => array('name' => clienttranslate('spade'),
            'nametr' => $this->_('spade')),
            2 => array('name' => clienttranslate('heart'),
            'nametr' => $this->_('heart')),
            3 => array('name' => clienttranslate('diamond'),
            'nametr' => $this->_('diamond')),
            4 => array('name' => clienttranslate('club'),
            'nametr' => $this->_('club'))
        );

        foreach ( $this->colors as $color_id => $color) {
            // spade heart diamond club
            for ($value = 2; $value <= 10; $value ++) {
                // 2, 3, .. 10
                $cards [] = array ('type' => $color_id, 'type_arg' => $value, 'nbr' => 1);
            }
            $cards [] = array ('type' => $color_id, 'type_arg' => 14, 'nbr' => 1);

            for ($value = 13; $value >= 11; $value --) {
                $deckCards [] = array ('type' => $color_id, 'type_arg' => $value, 'nbr' => 1);
            }
        }

        $this->cards->createCards($cards, 'deck');
        $this->cards->createCards($deckCards, 'court');

        $this->values_label = array(
            2 =>'2',
            3 => '3',
            4 => '4',
            5 => '5',
            6 => '6',
            7 => '7',
            8 => '8',
            9 => '9',
            10 => '10',
            11 => clienttranslate('J'),
            12 => clienttranslate('Q'),
            13 => clienttranslate('K'),
            14 => clienttranslate('A')
        );


        // Init game statistics.
        //
        // NOTE: statistics used in this file must be defined in your `stats.inc.php` file.

        // Dummy content.
        // $this->initStat("table", "table_teststat1", 0);
        // $this->initStat("player", "player_teststat1", 0);


        // Activate first player once everything has been initialized and ready.
        $this->activeNextPlayer();
    }

    /**
     * This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
     * You can do whatever you want in order to make sure the turn of this player ends appropriately
     * (ex: pass).
     *
     * Important: your zombie code will be called when the player leaves the game. This action is triggered
     * from the main site and propagated to the gameserver from a server, not from a browser.
     * As a consequence, there is no current player associated to this action. In your zombieTurn function,
     * you must _never_ use `getCurrentPlayerId()` or `getCurrentPlayerName()`, otherwise it will fail with a
     * "Not logged" error message.
     *
     * @param array{ type: string, name: string } $state
     * @param int $active_player
     * @return void
     * @throws feException if the zombie mode is not supported at this game state.
     */
    protected function zombieTurn(array $state, int $active_player): void
    {
        $state_name = $state["name"];

        if ($state["type"] === "activeplayer") {
            switch ($state_name) {
                default:
                {
                    $this->gamestate->nextState("zombiePass");
                    break;
                }
            }

            return;
        }

        // Make sure player is in a non-blocking status for role turn.
        if ($state["type"] === "multipleactiveplayer") {
            $this->gamestate->setPlayerNonMultiactive($active_player, '');
            return;
        }

        throw new \feException("Zombie mode not supported at this game state: \"{$state_name}\".");
    }
}
