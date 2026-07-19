import { ArkanoidGame } from './game.js';

const canvas = document.getElementById('game');
const game = new ArkanoidGame(canvas);
game.start();
