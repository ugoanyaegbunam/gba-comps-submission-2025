
-- ------
-- BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
-- GomokuJV implementation : © Jonathan Vilms vilmsj@carleton.edu
-- 
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-- -----

-- dbmodel.sql

CREATE TABLE IF NOT EXISTS `board` (
  `board_x` smallint(8) unsigned NOT NULL,
  `board_y` smallint(8) unsigned NOT NULL,
  `board_player` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`board_x`,`board_y`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;