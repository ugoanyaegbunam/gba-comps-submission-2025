<?php
/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * leoReversi implementation : © <Your name here> <Your email address here>
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

namespace Bga\Games\leoReversi;

require_once(APP_GAMEMODULE_PATH . "module/table/table.game.php");


class Game extends \Table
{

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
            "my_first_global_variable" => 10,
            "my_second_global_variable" => 11,
            "my_first_game_variant" => 100,
            "my_second_game_variant" => 101,
        ]);        
    }

    

    /**
     * Player action, example content.
     *
     * In this scenario, each time a player plays a card, this method will be called. This method is called directly
     * by the action trigger on the front side with `bgaPerformAction`.
     *
     * @throws BgaUserException
     */
    function actPlayDisc( int $x, int $y )
    {
        $player_id = intval($this->getActivePlayerId()); 
        
        // Now, check if this is a possible move
        $board = $this->getBoard();

        
        $sql = "UPDATE board SET board_player='$player_id'
                WHERE ( board_x, board_y) IN ( ('$x', '$y') )";
            
        $this->DbQuery( $sql );
        
        // Notify
        $this->notifyAllPlayers( "playDisc", clienttranslate( '${player_name} plays a disc' ), array(
            'player_id' => $player_id,
            'player_name' => $this->getActivePlayerName(),
            'x' => $x,
            'y' => $y
        ) );

        if ( $this->checkConnect( $x, $y, $player_id, $board) )
        {
            $this->gamestate->nextState( 'endGame' );
            return ;
        }
        


        $this->gamestate->nextState( 'playDisc' );
        return;
    }


    /**
     * Game state arguments, example content.
     *
     * This method returns some additional information that is very specific to the `playerTurn` game state.
     *
     * @return array
     * @see ./states.inc.php
     */
    function argPlayerTurn(): array
    {
        return [
            'possibleMoves' => $this->getPossibleMoves( intval($this->getActivePlayerId()) )
        ];
    }


    /**
     * Game state action, example content.
     *
     * The action method of state `nextPlayer` is called everytime the current game state is set to `nextPlayer`.
     */
    public function stNextPlayer(): void {
        // Retrieve the active player ID.
        $player_id = intval($this->activeNextPlayer());
        
        

        // This player can play. Give him some extra time
        $this->giveExtraTime( $player_id );
        $this->gamestate->nextState( 'nextTurn' );
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

        // WARNING: We must only return information visible by the current player.
        $current_player_id = (int) $this->getCurrentPlayerId();

        // Get information about players.
        // NOTE: you can retrieve some extra field you added for "player" table in `dbmodel.sql` if you need it.
        $result["players"] = $this->getCollectionFromDb(
            $sql = "SELECT player_id id, player_score score, player_color color FROM player "        );

        // TODO: Gather all information about current game situation (visible by player $current_player_id).

        // Get reversi board token
        $result['board'] = self::getObjectListFromDB( "SELECT board_x x, board_y y, board_player player
        FROM board
        WHERE board_player IS NOT NULL" );

        return $result;
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions    (functions used everywhere)
    ////////////

    function checkConnect( int $x, int $y, $player, $board): bool
    {
        $player_id = $this->getActivePlayerId();
        $connections = array(
            array(0, 1), #vertical
            array(1, 0), #horizontal
            array(1, 1), #upLeftDiagonal
            array(1, -1) #downLeftDiagonal
        ); 
        $rowCount = 1;
        $tempx = $x;
        $tempy = $y;
        $backwards = false;
        foreach ($connections as $line) {
            for($a = 0; $a < 4; $a++) {
                $tempx = $tempx + $line[0];
                $tempy = $tempy + $line[1];
                if ($tempx > 0 && $tempx < 8 && $tempy > 0 && $tempy < 8) {
                    if ($board[$tempx][$tempy] == $player) {
                        $rowCount++;
                        if ($rowCount == 4) {
                            #update this player's score so that they win
                        $sql = "UPDATE player SET player_score = 1 WHERE player_id='$player_id'";
                        $this->DbQuery( $sql );
                        $newScores = $this->getCollectionFromDb( "SELECT player_id, player_score FROM player", true );
                        $this->notifyAllPlayers( "newScores", "", array(
                            "scores" => $newScores
                        ) );
                            return true;
                        }
                        continue;
                    } else {
                        if ($backwards == true) {
                            break;
                        }
                    }
                }
                $tempx = $x;
                $tempy = $y;
                $line[0] = $line[0] * -1;
                $line[1] = $line[1] * -1;
                $backwards = true;

            }
            $tempx = $x;
            $tempy = $y;
            $rowCount = 1;
            $backwards = false;
        }
        
        return false;
    }

    // Get the complete board with a double associative array
    function getBoard()
    {
        return self::getDoubleKeyCollectionFromDB( "SELECT board_x x, board_y y, board_player player
                                                       FROM board", true );
    }

    // Get the list of possible moves 
    function getPossibleMoves( $player_id )
    {
        $result = array();
        $hasPossibleMove = false;
        $board = self::getBoard();

        for( $x=1; $x<=7; $x++ ) 
        {
            for( $y=7; $y>=1; $y-- ) 
            {
                if ($board[$x][$y] == null) 
                { 
                    $result[$x][$y] = true;
                    $y = 1;
                    $hasPossibleMove = true;
                }
            }
        }
        if ($hasPossibleMove == false){
            $this->gamestate->nextState( 'endGame' );
            return ;
        }

        return $result;
    }

    /**
     * Returns the game name.
     *
     * IMPORTANT: Please do not modify.
     */
    protected function getGameName()
    {
        return "leoreversi";
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
        $default_colors = array( "ada205", "4795d1" );

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

        // $this->reattributeColorsBasedOnPreferences($players, $gameinfos["player_colors"]); // Might Delete
        $this->reloadPlayersBasicInfos();

        // Init global values with their initial values.

        // Dummy content.
        $this->setGameStateInitialValue("my_first_global_variable", 0);

        // Init game statistics.
        //
        // NOTE: statistics used in this file must be defined in your `stats.inc.php` file.

        // Dummy content.
        // $this->initStat("table", "table_teststat1", 0);
        // $this->initStat("player", "player_teststat1", 0);

        // TODO: Setup the initial game situation here.

        // Init the board
        $sql = "INSERT INTO board (board_x,board_y,board_player) VALUES ";
        $sql_values = array();
        list( $blackplayer_id, $whiteplayer_id ) = array_keys( $players );
        for( $x=1; $x<=7; $x++ )
        {
            for( $y=1; $y<=7; $y++ )
            {
            $token_value = "NULL";
                            
            $sql_values[] = "('$x','$y',$token_value)";
            }
        }
        $sql .= implode( ',', $sql_values );
        $this->DbQuery( $sql );

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

    public function stGameEnd(): void {
        
    }
}